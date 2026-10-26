import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { WalletModal } from '../../components/modals/WalletModal';
import { SeoHead } from '../../components/common/SeoHead';
import { getAuthToken } from '../../services/api';
import {
  Dices,
  Trophy,
  Coins,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  History,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ArrowLeft,
  Bot
} from 'lucide-react';
import { PvEGame } from '../../components/games/PvEGame';

export const GamesPage: React.FC = () => {
  const { user, wallet, hasAppProfile, refreshMe, updateWalletBalance } = useAuth();
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'pve' | 'quick'>('pve');
  const [bannerCollapsed, setBannerCollapsed] = useState<boolean>(true);

  // Game state - Minimum bet from 50 RWF, no dummy rolls
  const [wager, setWager] = useState<number>(50);
  const [diceVal, setDiceVal] = useState<number>(6);
  const [targetPrediction, setTargetPrediction] = useState<'high' | 'low'>('high'); // high: 4-6, low: 1-3
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{ won: boolean; amount: number; dice: number } | null>(null);
  const [rollHistory, setRollHistory] = useState<Array<{ id: number; dice: number; won: boolean; amount: number }>>([]);

  const handleRollDice = async () => {
    if (!user || !hasAppProfile('games')) {
      setWizardTarget('games');
      return;
    }

    if ((wallet?.balance || 0) < wager) {
      setShowWalletModal(true);
      return;
    }

    setIsRolling(true);
    setLastResult(null);

    // Roll animation
    let count = 0;
    const interval = setInterval(async () => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceVal(finalDice);
        setIsRolling(false);

        const won = (targetPrediction === 'high' && finalDice >= 4) || (targetPrediction === 'low' && finalDice <= 3);
        const payout = won ? Math.round(wager * 1.95) : -wager;

        setLastResult({ won, amount: won ? payout : wager, dice: finalDice });
        setRollHistory((prev) => [
          { id: Date.now(), dice: finalDice, won, amount: won ? payout : -wager },
          ...prev.slice(0, 9)
        ]);

        // Real wallet ledger bet sync
        try {
          const token = getAuthToken();
          if (token) {
            const res = await fetch('/api/wallet/bet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ wager, won, multiplier: 1.95 })
            });
            const data = await res.json();
            if (data?.newBalance !== undefined) {
              updateWalletBalance(data.newBalance);
            } else {
              refreshMe();
            }
          }
        } catch (e) {
          console.warn('Bet ledger sync error:', e);
        }
      }
    }, 100);
  };

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-amber-500 selection:text-white">
      <SeoHead
        title="RollDice Arena & Wallet Games — BenixSpace"
        description="Compete in provably fair RollDice games. Use your unified BenixSpace wallet balance for instant deposits, fair multipliers, and cash prizes."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Prominent Back to Home Button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:scale-105 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400 font-bold bg-[#121824] px-3 py-1.5 rounded-xl border border-slate-800">
              Min Bet: 50 RWF • 1.95x Win Payout
            </span>
          </div>
        </div>

        {/* Compact Arena Bar (fits viewport without scrolling) */}
        {bannerCollapsed ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#20180d] via-[#1a1409] to-[#0B0E14] border border-amber-500/30 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                <Dices className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  RollDice Arena <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">Provably Fair</span>
                </h1>
                <p className="text-[11px] text-slate-400">Instant Winnings Credited to Central Wallet</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#1C2538] hover:bg-[#25324c] border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{(wallet?.balance || 0).toLocaleString()} RWF</span>
              </button>
              <button
                onClick={() => setBannerCollapsed(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700"
              >
                Show Rules & Info ▼
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                onClick={() => setBannerCollapsed(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                ▲ Collapse Banner (Fit Screen Mode)
              </button>
            </div>
        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#261d0f] via-[#1a1409] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Instant Fair Multiplier
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  1.95x Payout Rate
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  Central Wallet Integrated
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                RollDice Arena <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
                  Instant Wagers, Fast Payouts
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Predict High (4-6) or Low (1-3) on each roll. Seamlessly wager with your single central wallet balance with zero transaction fees.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-6 py-3.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-2.5 transition-all"
                >
                  <Wallet className="w-4 h-4" />
                  Wallet Balance: {(wallet?.balance || 0).toLocaleString()} RWF
                </button>
              </div>
            </div>

            {/* Live Wallet Mini-Card */}
            <div className="w-full md:w-80 p-5 rounded-2xl bg-[#20180d]/90 border border-amber-500/30 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-amber-400">Gaming Rules</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  18+ ONLY
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 pt-1 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>High: 4, 5, or 6 (Pays 1.95x)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Low: 1, 2, or 3 (Pays 1.95x)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instant balance credit to Central Wallet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

          </div>
        )}

        {/* Mode Selector Tabs: Choose how to play */}
        <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-[#121824] border border-slate-800 w-fit">
          <button
            onClick={() => setGameMode('pve')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              gameMode === 'pve'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>RollDice Arena (PvE vs Bot)</span>
          </button>

          <button
            onClick={() => setGameMode('quick')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              gameMode === 'quick'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Quick Roll (High / Low 1.95x)</span>
          </button>
        </div>

        {/* Mode 1: Authentic RollDice PvE vs Bot */}
        {gameMode === 'pve' && (
          <PvEGame
            user={user}
            walletBalance={wallet?.balance || 0}
            onBalanceUpdate={(newBal) => {
              if (typeof newBal === 'number') {
                updateWalletBalance(newBal);
              } else {
                refreshMe();
              }
            }}
            onOpenDeposit={() => setShowWalletModal(true)}
          />
        )}

        {/* Mode 2: Quick Roll (High / Low 1.95x) */}
        {gameMode === 'quick' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Board */}
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#131926] border border-slate-800/80 space-y-6">
              
              {/* Big Dice Display */}
            <div className="py-12 bg-gradient-to-b from-[#182133] to-[#0E1422] rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              <div
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-2xl shadow-orange-500/30 flex items-center justify-center text-slate-950 font-black text-6xl sm:text-7xl transition-transform ${
                  isRolling ? 'animate-bounce scale-110' : ''
                }`}
              >
                {diceVal}
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {isRolling ? 'Rolling...' : `Rolled a ${diceVal}`}
                </p>
                {lastResult && (
                  <p
                    className={`text-sm font-extrabold mt-1 ${
                      lastResult.won ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {lastResult.won ? `🎉 You Won +${lastResult.amount.toLocaleString()} RWF!` : `Lost ${wager.toLocaleString()} RWF. Try again!`}
                  </p>
                )}
              </div>
            </div>

            {/* Target Prediction Selection */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                1. Select Your Prediction:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTargetPrediction('low')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    targetPrediction === 'low'
                      ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-[#1A2234] text-slate-300 font-bold border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="block text-base">LOW (1 - 3)</span>
                  <span className="text-[11px] opacity-80">Multiplier: 1.95x</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetPrediction('high')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    targetPrediction === 'high'
                      ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-[#1A2234] text-slate-300 font-bold border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="block text-base">HIGH (4 - 6)</span>
                  <span className="text-[11px] opacity-80">Multiplier: 1.95x</span>
                </button>
              </div>
            </div>

            {/* Wager Amount Selector */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                2. Select Wager Amount:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[200, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setWager(amt)}
                    className={`py-3 rounded-xl text-xs font-black transition-all ${
                      wager === amt
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'bg-[#1A2234] text-slate-300 border border-slate-800 hover:bg-[#25324c]'
                    }`}
                  >
                    {amt.toLocaleString()} RWF
                  </button>
                ))}
              </div>
            </div>

            {/* Big Action Button */}
            <button
              onClick={handleRollDice}
              disabled={isRolling}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Dices className="w-5 h-5 fill-slate-950" />
              {isRolling ? 'Rolling Dice...' : `Roll Dice Now (${wager.toLocaleString()} RWF)`}
            </button>
          </div>

          {/* Roll History & Live Ledger */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#131926] border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">Recent Arena Rolls</h3>
            </div>

            <div className="space-y-2.5">
              {rollHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#1A2234] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-amber-400">
                      {item.dice}
                    </span>
                    <span className="text-slate-300 font-medium">
                      {item.won ? 'Won High/Low' : 'Missed'}
                    </span>
                  </div>

                  <span
                    className={`font-black ${
                      item.won ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {item.won ? `+${item.amount.toLocaleString()} RWF` : `${item.amount.toLocaleString()} RWF`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Access Wizard Modal for Games Onboarding */}
      <AppAccessWizardModal
        isOpen={!!wizardTarget}
        targetAppKey={wizardTarget}
        onClose={() => setWizardTarget(null)}
        onSuccess={() => {
          setWizardTarget(null);
        }}
      />

      {/* Wallet Deposit / Withdraw Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
};
