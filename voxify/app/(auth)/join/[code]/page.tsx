'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { choirService } from '@/lib/services/choirService';
import { Choir } from '@/lib/types/database.types';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { Music, CheckCircle2, Clock, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export default function JoinChoirPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { refreshChoirs, selectChoir } = useChoir();

  const codeParam = (params?.code as string || '').toUpperCase();

  const [choir, setChoir] = useState<Choir | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChoir() {
      if (!codeParam) return;
      setLoading(true);
      const data = await choirService.findChoirByCode(codeParam);
      setChoir(data);
      setLoading(false);
    }
    loadChoir();
  }, [codeParam]);

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/join/${codeParam}`);
      return;
    }
    if (!choir) return;

    setJoining(true);
    setError(null);
    const { success, status, alreadyMember, error: joinErr } = await choirService.joinChoirByCode(choir.id);

    setJoining(false);
    if (!success) {
      setError(joinErr || 'Failed to submit join request');
    } else {
      setIsAlreadyMember(alreadyMember || false);
      setResultStatus(status);
      await refreshChoirs(choir.id);
      selectChoir(choir.id);
    }
  };

  const handleGoToDashboard = async () => {
    if (choir) {
      await refreshChoirs(choir.id);
      selectChoir(choir.id);
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-purple-600/20 p-1 border border-purple-500/30 items-center justify-center">
          <Image src="/logo.png" alt="Voxify Logo" width={48} height={48} className="object-contain" />
        </div>

        {loading ? (
          <div className="py-8 space-y-2">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Finding Choir Code <span className="font-mono text-purple-400">{codeParam}</span>...</p>
          </div>
        ) : !choir ? (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold text-slate-100">Choir Not Found</h2>
            <p className="text-xs text-slate-400">
              No choir found matching code <strong className="font-mono text-amber-400">{codeParam}</strong>. Please check your invitation link.
            </p>
          </div>
        ) : resultStatus ? (
          <div className="space-y-4">
            {isAlreadyMember ? (
              <>
                <UserCheck className="w-12 h-12 text-purple-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Already a Member!</h2>
                <p className="text-xs text-slate-400">
                  You are already a registered member of <strong>{choir.name}</strong>.
                </p>
              </>
            ) : resultStatus === 'active' ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h2 className="text-2xl font-bold text-emerald-300">Membership Approved!</h2>
                <p className="text-xs text-slate-400">
                  You are now an active singer of <strong>{choir.name}</strong>.
                </p>
              </>
            ) : (
              <>
                <Clock className="w-12 h-12 text-amber-400 mx-auto" />
                <h2 className="text-2xl font-bold text-amber-300">Request Sent</h2>
                <p className="text-xs text-slate-400">
                  Your request to join <strong>{choir.name}</strong> has been submitted. The Choir Master will review your application.
                </p>
              </>
            )}
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all text-xs"
            >
              Go to Choir Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest font-mono">
                CODE: {choir.choir_code}
              </span>
              <h2 className="text-2xl font-bold text-white">{choir.name}</h2>
              {choir.church_name && <p className="text-xs text-slate-400">{choir.church_name} {choir.location ? `• ${choir.location}` : ''}</p>}
              {choir.description && <p className="text-xs text-slate-400 pt-2 italic">{choir.description}</p>}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {joining ? 'Submitting...' : 'Request to Join Choir'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
