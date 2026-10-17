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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Platform Referral Program</h3>
              <p className="text-[11px] text-slate-500">Earn 500 RWF for every invited friend</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Users className="w-4 h-4 text-sky-600 mx-auto mb-1" />
              <div className="text-lg font-black text-slate-900">{stats?.total_referrals || 0}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Invited</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <div className="text-lg font-black text-slate-900">{stats?.approved_referrals || 0}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Approved</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <DollarSign className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <div className="text-lg font-black text-slate-900">{stats?.total_earnings || 0}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RWF Earned</div>
            </div>
          </div>

          {/* Referral Link Card */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your Personal Referral Link
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200 bg-slate-50">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent px-3 text-xs font-semibold text-slate-700 outline-none select-all"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-sky-900 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>How Referral Rewards Work:</span>
            </div>
            <p className="text-[11px] text-sky-700">
              When friends sign up through your referral link, their accounts are automatically linked to you. Once they engage on the platform (play games, book a service, or deposit), 500 RWF is instantly credited to your central wallet!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
