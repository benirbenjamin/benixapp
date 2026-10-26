import React from 'react';
import {
  X,
  CheckCircle2,
  Receipt,
  Printer,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export const DashboardReceiptModal: React.FC<Props> = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const isCredit = transaction.type === 'credit';
  const txDate = transaction.created_at ? new Date(transaction.created_at) : new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0e1420] border-2 border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Receipt Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Receipt className="w-6 h-6" />
          </div>

          <h3 className="text-base font-black tracking-tight uppercase">Official Transaction Receipt</h3>
          <p className="text-[11px] text-blue-200 mt-0.5">Benix.Space Central Wallet Settlement</p>
        </div>

        {/* Amount Hero */}
        <div className="p-6 text-center border-b border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Settled Amount</span>
          <div className="flex items-center justify-center gap-1.5">
            <span
              className={`text-3xl font-black ${
                isCredit ? 'text-emerald-400' : 'text-slate-100'
              }`}
            >
              {isCredit ? '+' : '-'}{Number(transaction.amount).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">RWF</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Settled & Confirmed in Ledger</span>
          </div>
        </div>

        {/* Receipt Line Items Breakdown */}
        <div className="p-6 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Transaction ID</span>
            <span className="font-mono text-slate-200 font-semibold">{String(transaction.id || 'N/A').slice(0, 16)}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Date & Time</span>
            <span className="text-slate-200 font-medium">
              {txDate.toLocaleDateString()} at {txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Category</span>
            <span className="text-slate-200 capitalize font-medium">{transaction.category || 'Central Settlement'}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Description / Note</span>
            <span className="text-white font-semibold text-right max-w-[200px] truncate">
              {transaction.description || 'Unified cross-module transaction'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400">Balance After Transaction</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {Number(transaction.balance_after || 0).toLocaleString()} RWF
            </span>
          </div>
        </div>

        {/* Security Seal & Print/Close Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Cryptographically Audited</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
