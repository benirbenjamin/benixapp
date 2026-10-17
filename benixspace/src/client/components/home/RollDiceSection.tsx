import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dices, Sparkles, Trophy, Wallet, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const RollDiceSection: React.FC = () => {
  const { user, wallet, token, updateWalletBalance } = useAuth();
  const [stake, setStake] = useState<number>(100);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleRoll = async () => {
    if (!token) {
      setError('Please log in to play with your central wallet.');
      return;
    }
    if ((wallet?.balance || 0) < stake) {
      setError('Insufficient wallet balance. Please deposit funds into your central wallet.');
      return;
    }

    setRolling(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/modules/games/pve/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stake })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (data.newBalance !== undefined) {
          updateWalletBalance(data.newBalance);
        }
      } else {
        setError(data.error || 'Game roll failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setRolling(false);
    }
  };

  return (
    <section className="py-12 bg-gradient-to-br from-amber-500/10 via-slate-50 to-amber-500/5 rounded-3xl border border-amber-200/80 my-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-amber-200/60 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 w-fit">
              <Dices className="w-3.5 h-3.5 text-amber-600" />
              Benix Games Arena
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              RollDice Quick Challenge
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Wallet: {Number(wallet?.balance || 0).toLocaleString()} RWF</span>
            </span>
          </div>
        </div>

        {/* Game Arena Box */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Your Wager (RWF)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setStake(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      stake === amt
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRoll}
              disabled={rolling}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Dices className={`w-5 h-5 ${rolling ? 'animate-spin' : ''}`} />
              <span>{rolling ? 'Rolling Dice...' : `Roll Dice (${stake} RWF)`}</span>
            </button>

            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Dice Animation Area */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-100 min-h-[160px] text-center space-y-3">
            {result ? (
              <div className="space-y-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Roll</span>
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                      {result.playerRoll}
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-400">VS</div>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Roll</span>
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                      {result.aiRoll}
                    </div>
                  </div>
                </div>

                {result.win ? (
                  <div className="text-emerald-600 font-extrabold text-sm flex items-center justify-center gap-1.5">
                    <Trophy className="w-4 h-4" />
                    <span>You Won {result.payout} RWF! Credited to your wallet.</span>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs font-semibold">
                    Better luck next roll! The house won this round.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-xs space-y-1">
                <Dices className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <div>Pick your stake and roll against AI to win 1.9x payout!</div>
                <div className="text-[10px] text-slate-400">Connected to your shared Benix.Space wallet</div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
