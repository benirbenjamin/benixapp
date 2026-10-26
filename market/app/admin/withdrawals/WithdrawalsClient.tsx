"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Clock, Smartphone, AlertCircle } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default function WithdrawalsClient({ initialWithdrawals }: { initialWithdrawals: any[] }) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAction = async (withdrawalId: string, action: "PAID" | "REJECT") => {
    let note = "";
    if (action === "REJECT") {
      const promptNote = prompt("Reason for rejection (this will be displayed to user, and funds refunded):");
      if (promptNote === null) return;
      note = promptNote;
    }

    setUpdatingId(withdrawalId);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, adminNote: note }),
      });

      if (res.ok) {
        setWithdrawals(
          withdrawals.map((w) =>
            w.id === withdrawalId ? { ...w, status: action, adminNote: note } : w
          )
        );
      } else {
        alert("Failed to process withdrawal action");
      }
    } catch {
      alert("Error processing withdrawal");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Withdrawal Requests &amp; Payouts</h1>
        <p className="text-xs text-slate-500">
          Disburse creator and service provider earnings via MTN MoMo, Airtel Money, or Bank Transfer.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Method &amp; Payout Account</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Requested</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{w.user.displayName}</p>
                    <p className="text-[11px] text-slate-400">
                      @{w.user.username} &bull; {w.user.email}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800 block">{w.paymentMethod}</span>
                    <span className="text-[11px] text-slate-600 font-mono">
                      {w.accountDetails?.accountNumber || "-"} ({w.accountDetails?.accountName || "-"})
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-black text-sm text-slate-900">
                    {formatCurrency(w.amount)}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        w.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : w.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {w.status}
                    </span>
                    {w.adminNote && (
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">
                        Note: {w.adminNote}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">{timeAgo(w.createdAt)}</td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    {w.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleAction(w.id, "PAID")}
                          disabled={updatingId === w.id}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                        >
                          Mark as Paid
                        </button>
                        <button
                          onClick={() => handleAction(w.id, "REJECT")}
                          disabled={updatingId === w.id}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold"
                        >
                          Reject &amp; Refund
                        </button>
                      </>
                    )}
                    {w.status !== "PENDING" && (
                      <span className="text-slate-400 text-[11px]">Processed</span>
                    )}
                  </td>
                </tr>
              ))}

              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No withdrawal requests recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
