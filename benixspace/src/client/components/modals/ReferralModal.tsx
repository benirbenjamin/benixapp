import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Gift, Copy, Check, Users, Award, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch(() => {});
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const referralCode = stats?.referral_code || user?.referral_code || 'BENIX-VIP';
  const referralLink = stats?.referral_link || `https://benix.space/?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const savedSettings = localStorage.getItem('benix_platform_settings');
  let referralRewardAmount = 500;
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      if (parsed.referral_reward_rwf) referralRewardAmount = Number(parsed.referral_reward_rwf);
    } catch (e) {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F1420] rounded-3xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden flex flex-col text-white font-sans">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#131926]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Platform Referral Program</h3>
              <p className="text-[11px] text-slate-400">Earn {referralRewardAmount.toLocaleString()} RWF for every invited friend</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-[#161D2E] border border-slate-800">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-black text-white">{stats?.total_referrals || 0}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invited</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#161D2E] border border-slate-800">
              <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-lg font-black text-white">{stats?.approved_referrals || 0}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#161D2E] border border-slate-800">
              <DollarSign className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-lg font-black text-emerald-400">{Number(stats?.total_earnings || 0).toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RWF Earned</div>
            </div>
          </div>

          {/* Referral Link Card */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Your Personal Referral Link
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-700 bg-[#161D2E]">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent px-3 text-xs font-semibold text-white outline-none select-all font-mono"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-2xl bg-[#161D2E] border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>How Referral Rewards Work:</span>
            </div>
            <p className="text-[11px] text-slate-400">
              When friends sign up through your referral link, their accounts are automatically linked to you. Once they engage on the platform, <strong className="text-emerald-400 font-bold">{referralRewardAmount.toLocaleString()} RWF</strong> is instantly credited to your central wallet!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
