'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../supabase/client';
import { ArtistProfile, Profile } from '../types/database.types';

interface AuthContextType {
  user: Profile | null;
  artistProfile: ArtistProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  artistProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        setArtistProfile(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUser(profile as Profile);
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Member',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          is_super_admin: false,
          user_type: 'regular',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Fetch artist profile if available
      const { data: artist } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (artist) {
        setArtistProfile(artist as ArtistProfile);
      } else {
        setArtistProfile(null);
      }
    } catch {
      setUser(null);
      setArtistProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      setUser(null);
      setArtistProfile(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, artistProfile, loading, signOut, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
