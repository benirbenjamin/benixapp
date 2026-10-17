'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { choirService } from '../services/choirService';
import { Choir, ChoirMember } from '../types/database.types';
import { useAuth } from './AuthContext';

interface ChoirContextType {
  choirs: Choir[];
  activeChoir: Choir | null;
  activeMember: ChoirMember | null;
  loading: boolean;
  selectChoir: (choirId: string) => void;
  setActiveChoirExplicitly: (choir: Choir) => void;
  refreshChoirs: (selectNewChoirId?: string) => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  isSectionLeader: boolean;
}

const ChoirContext = createContext<ChoirContextType>({
  choirs: [],
  activeChoir: null,
  activeMember: null,
  loading: true,
  selectChoir: () => {},
  setActiveChoirExplicitly: () => {},
  refreshChoirs: async () => {},
  isOwner: false,
  isAdmin: false,
  isSectionLeader: false,
});

export const ChoirProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [choirs, setChoirs] = useState<Choir[]>([]);
  const [activeChoir, setActiveChoir] = useState<Choir | null>(null);
  const [activeMember, setActiveMember] = useState<ChoirMember | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChoirs = async (selectNewChoirId?: string) => {
    if (!user) {
      setChoirs([]);
      setActiveChoir(null);
      setActiveMember(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userChoirs = await choirService.getMyChoirs();
      setChoirs(userChoirs);

      // If explicit choir ID passed (e.g. after choir creation/joining), select it directly
      const storedChoirId = selectNewChoirId || (typeof window !== 'undefined' ? localStorage.getItem('voxify_active_choir') : null);
      const targetChoir = userChoirs.find(c => c.id === storedChoirId) || userChoirs[0] || null;

      setActiveChoir(targetChoir);

      if (targetChoir) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('voxify_active_choir', targetChoir.id);
        }
        const members = await choirService.getChoirMembers(targetChoir.id);
        const currentMember = members.find(m => m.user_id === user.id) || null;
        setActiveMember(currentMember);
      }
    } catch {
      setChoirs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChoirs();
  }, [user]);

  const selectChoir = async (choirId: string) => {
    const target = choirs.find(c => c.id === choirId);
    if (target) {
      setActiveChoir(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('voxify_active_choir', choirId);
      }
      if (user) {
        const members = await choirService.getChoirMembers(target.id);
        const currentMember = members.find(m => m.user_id === user.id) || null;
        setActiveMember(currentMember);
      }
    }
  };

  const setActiveChoirExplicitly = async (choir: Choir) => {
    setActiveChoir(choir);
    setChoirs(prev => {
      if (prev.some(c => c.id === choir.id)) return prev;
      return [choir, ...prev];
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('voxify_active_choir', choir.id);
    }
    if (user) {
      const members = await choirService.getChoirMembers(choir.id);
      const currentMember = members.find(m => m.user_id === user.id) || null;
      setActiveMember(currentMember);
    }
  };

  const isOwner = activeMember?.role === 'owner' || (activeChoir ? activeChoir.owner_id === user?.id : false);
  const isAdmin = isOwner || activeMember?.role === 'admin';
  const isSectionLeader = isAdmin || activeMember?.role === 'section_leader';

  return (
    <ChoirContext.Provider
      value={{
        choirs,
        activeChoir,
        activeMember,
        loading,
        selectChoir,
        setActiveChoirExplicitly,
        refreshChoirs: fetchChoirs,
        isOwner,
        isAdmin,
        isSectionLeader,
      }}
    >
      {children}
    </ChoirContext.Provider>
  );
};

export const useChoir = () => useContext(ChoirContext);
