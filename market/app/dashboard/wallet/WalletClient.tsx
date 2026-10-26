"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  History,
  Filter,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default function WalletClient({
  initialWallet,
  initialTransactions,
  initialWithdrawals,
}: {
  initialWallet: any;
  initialTransactions: any[];
  initialWithdrawals: any[];
}) {
  const [wallet, setWallet] = useState(initialWallet);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [filterType, setFilterType] = useState<string>("ALL");

  // Withdrawal Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"MTN_MOMO" | "AIRTEL_MONEY" | "BANK_TRANSFER" | "PAYPAL">("MTN_MOMO");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Saved payout details state
  const [savedMethod, setSavedMethod] = useState<any>(null);
  const [useSavedMethod, setUseSavedMethod] = useState(true);

  // Deposit Modal State
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState("");

  // Load saved payout details on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("umuguzi_saved_payout_details");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedMethod(parsed);
        setPaymentMethod(parsed.paymentMethod || "MTN_MOMO");
        setAccountName(parsed.accountName || "");
        setAccountNumber(parsed.accountNumber || "");
      } else if (initialWithdrawals && initialWithdrawals.length > 0) {
        const last = initialWithdrawals[0];
        const lastDetails = {
          paymentMethod: last.paymentMethod,
          accountName: last.accountDetails?.accountName || "",
          accountNumber: last.accountDetails?.accountNumber || "",
        };
        setSavedMethod(lastDetails);
        setPaymentMethod(lastDetails.paymentMethod);
        setAccountName(lastDetails.accountName);
        setAccountNumber(lastDetails.accountNumber);
      }
    } catch {
      // Ignore
    }
  }, [initialWithdrawals]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const withdrawNum = Number(amount);
    if (!withdrawNum || withdrawNum <= 0) {
      setError("Please enter a valid withdrawal amount.");
      return;
    }

    if (withdrawNum > (wallet?.availableBalance || 0)) {
      setError("Withdrawal amount cannot exceed available balance.");
      return;
    }

    if (withdrawNum < 1000) {
      setError("Minimum withdrawal amount is 1,000 RWF.");
      return;
    }

    const effectiveMethod = useSavedMethod && savedMethod ? savedMethod.paymentMethod : paymentMethod;
    const effectiveName = useSavedMethod && savedMethod ? savedMethod.accountName : accountName;
    const effectiveNumber = useSavedMethod && savedMethod ? savedMethod.accountNumber : accountNumber;

    if (!effectiveNumber.trim()) {
      setError("Please provide an account or phone number for the payout.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawNum,
          paymentMethod: effectiveMethod,
          accountDetails: { accountName: effectiveName, accountNumber: effectiveNumber },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal request failed");

      // Save method for subsequent withdrawals
      const newSaved = {
        paymentMethod: effectiveMethod,
        accountName: effectiveName,
        accountNumber: effectiveNumber,
      };
      setSavedMethod(newSaved);
      localStorage.setItem("umuguzi_saved_payout_details", JSON.stringify(newSaved));

      // Update balances locally
      setWallet((prev: any) => ({
        ...prev,
        availableBalance: prev.availableBalance - withdrawNum,
      }));

      // Add to withdrawals list
      setWithdrawals([data.withdrawal, ...withdrawals]);

      // Add to transaction ledger
      const newTx = {
        id: "tx-" + Date.now(),
        type: "WITHDRAWAL",
        amount: -withdrawNum,
        status: "PENDING",
        description: `Withdrawal via ${effectiveMethod} (${effectiveNumber})`,
        createdAt: new Date().toISOString(),
      };
      setTransactions([newTx, ...transactions]);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setModalOpen(false);
        setAmount("");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError("");

    const depNum = Number(depositAmount);
    if (!depNum || depNum < 500) {
      setDepositError("Minimum deposit amount is 500 RWF.");
      return;
    }

    setDepositing(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depNum,
          paymentMethod: "FLUTTERWAVE",
          reference: `FLW-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deposit failed");

      // Update balance locally
      setWallet((prev: any) => ({
        ...prev,
        availableBalance: (prev.availableBalance || 0) + depNum,
        totalEarnings: (prev.totalEarnings || 0) + depNum,
      }));

      // Add to transaction ledger
      const newTx = {
        id: "tx-dep-" + Date.now(),
        type: "SALE",
        amount: depNum,
        status: "COMPLETED",
        description: `Wallet Deposit via Flutterwave`,
        createdAt: new Date().toISOString(),
      };
      setTransactions([newTx, ...transactions]);

      setDepositSuccess(true);
      setTimeout(() => {
        setDepositSuccess(false);
        setDepositModalOpen(false);
        setDepositAmount("");
      }, 1500);
    } catch (err: any) {
      setDepositError(err.message);
    } finally {
      setDepositing(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === "ALL") return true;
    if (filterType === "WITHDRAWAL") return tx.type === "WITHDRAWAL";
    if (filterType === "ADS") return tx.description?.toLowerCase().includes("ad revenue") || tx.description?.toLowerCase().includes("creator");
    if (filterType === "AFFILIATE") return tx.type === "REFERRAL_COMMISSION" || tx.description?.toLowerCase().includes("referral") || tx.description?.toLowerCase().includes("affiliate");
    if (filterType === "SALES") return tx.type === "SALE" && !tx.description?.toLowerCase().includes("ad revenue");
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Wallet &amp; Immutable Ledger</h1>
          <p className="text-xs text-slate-500">
            Internal financial balance, ad revenue, product sales, affiliate commissions, and mobile money payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDepositModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Deposit (Flutterwave)
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCurrency(wallet?.availableBalance || 0)}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">Ready to withdraw</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Balance</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCurrency(wallet?.pendingBalance || 0)}
          </span>
          <span className="text-[11px] text-slate-400">In clearance</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Earnings</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
            {formatCurrency(wallet?.totalEarnings || 0)}
          </span>
          <span className="text-[11px] text-slate-400">All revenues earned</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Withdrawn</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
            {formatCurrency(wallet?.totalWithdrawn || 0)}
          </span>
          <span className="text-[11px] text-slate-400">Paid to MoMo / Bank</span>
        </div>
      </div>

      {/* Pending / Processed Withdrawals Table */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Recent Withdrawal Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Account Details</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">{timeAgo(w.createdAt)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{w.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {w.accountDetails?.accountNumber || "-"} ({w.accountDetails?.accountName || "-"})
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{formatCurrency(w.amount)}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          w.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : w.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Immutable Ledger Table with Filter Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900">Immutable Transaction Ledger</h3>

          {/* Activity Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("ADS")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === "ADS"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Ad Revenue
            </button>
            <button
              onClick={() => setFilterType("AFFILIATE")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === "AFFILIATE"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Affiliates
            </button>
            <button
              onClick={() => setFilterType("SALES")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === "SALES"
                  ? "bg-brand text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setFilterType("WITHDRAWAL")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === "WITHDRAWAL"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Withdrawals
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{timeAgo(tx.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800">{tx.type}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{tx.description}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : tx.status === "CANCELLED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-black ${
                      tx.amount >= 0 ? "text-emerald-600" : "text-slate-900"
                    }`}
                  >
                    {tx.amount >= 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No transactions found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Request Modal with Saved Payment Method Memory */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Request Withdrawal</h3>
                <p className="text-xs text-slate-500">
                  Available: <strong>{formatCurrency(wallet?.availableBalance || 0)}</strong>
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Withdrawal Request Dispatched!</h4>
                <p className="text-xs text-slate-500">Finance team will process your payout and alert you.</p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Saved Payout Method Card */}
                {savedMethod && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Payout Destination</span>
                      <button
                        type="button"
                        onClick={() => setUseSavedMethod(!useSavedMethod)}
                        className="text-[11px] text-brand hover:underline font-semibold"
                      >
                        {useSavedMethod ? "Change / Use New Details" : "Switch to Saved Method"}
                      </button>
                    </div>

                    {useSavedMethod ? (
                      <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 block">{savedMethod.paymentMethod}</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {savedMethod.accountNumber} ({savedMethod.accountName})
                          </span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                          Saved
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 block">
                        Enter new payout details below. They will be saved for future withdrawals.
                      </span>
                    )}
                  </div>
                )}

                {/* Method selector if not using saved method */}
                {(!savedMethod || !useSavedMethod) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Choose Payout Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("MTN_MOMO")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          paymentMethod === "MTN_MOMO"
                            ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        MTN MoMo 🇷🇼
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("AIRTEL_MONEY")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          paymentMethod === "AIRTEL_MONEY"
                            ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        Airtel Money 🇷🇼
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("BANK_TRANSFER")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          paymentMethod === "BANK_TRANSFER"
                            ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        Bank Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("PAYPAL")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          paymentMethod === "PAYPAL"
                            ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        PayPal
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (RWF) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={wallet?.availableBalance || 0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Min: 1,000 RWF &bull; Max: {formatCurrency(wallet?.availableBalance || 0)}
                  </span>
                </div>

                {(!savedMethod || !useSavedMethod) && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Account Holder Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Name registered on account / MoMo"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone / Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 0788123456 or Bank IBAN"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Submitting Request..." : "Confirm Withdrawal"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Deposit Modal (Flutterwave) */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Deposit Funds</h3>
                <p className="text-xs text-slate-500">
                  Instant deposit via Flutterwave (MTN MoMo, Airtel, Cards)
                </p>
              </div>
              <button
                onClick={() => setDepositModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {depositError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{depositError}</span>
              </div>
            )}

            {depositSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Deposit Complete!</h4>
                <p className="text-xs text-slate-500">Funds have been credited to your available balance.</p>
              </div>
            ) : (
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deposit Amount (RWF) *
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Min: 500 RWF &bull; Instant credit
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supported Channels</span>
                  </div>
                  <p className="text-[11px]">
                    MTN Mobile Money, Airtel Money, Visa, Mastercard, and Bank Wire powered by Flutterwave.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={depositing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {depositing ? "Processing Deposit..." : "Proceed with Flutterwave"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
