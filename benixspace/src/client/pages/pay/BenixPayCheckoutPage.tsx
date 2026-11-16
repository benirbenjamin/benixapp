import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Smartphone,
  CreditCard,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lock
} from 'lucide-react';

interface CheckoutData {
  id: string;
  merchant_name: string;
  mode: 'sandbox' | 'live';
  order_reference: string;
  amount: number;
  customer_charged_amount: number;
  fee_amount: number;
  currency: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  redirect_url?: string;
  settled_at?: string;
  created_at: string;
}

export const BenixPayCheckoutPage: React.FC = () => {
  const { txnId } = useParams<{ txnId: string }>();
  const navigate = useNavigate();

  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment form states
  const [paymentMethod, setPaymentMethod] = useState<'momo_mtn' | 'momo_airtel' | 'card'>('momo_mtn');
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState('');
  const [payError, setPayError] = useState('');

  // Simulator state
  const [simulating, setSimulating] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const fetchCheckoutData = async () => {
    if (!txnId) return;
    try {
      const res = await fetch(`/api/v1/benixpay/checkout/${txnId}`);
      const data = await res.json();
      if (data.success && data.checkout) {
        setCheckout(data.checkout);
        if (data.checkout.customer_phone) {
          setPhone(data.checkout.customer_phone);
        }
      } else {
        setError(data.error || 'Checkout session not found.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load checkout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutData();
  }, [txnId]);

  // Handle automatic redirect countdown when transaction completes
  useEffect(() => {
    if (checkout?.status === 'successful' && checkout.redirect_url && redirectCountdown === null) {
      setRedirectCountdown(4);
    }
  }, [checkout]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0 && checkout?.redirect_url) {
      window.location.href = checkout.redirect_url;
    }
  }, [redirectCountdown, checkout]);

  const handleSimulate = async (outcome: 'successful' | 'failed' | 'cancelled', reason?: string) => {
    if (!txnId) return;
    setSimulating(true);
    setPayError('');
    setPayMessage('');

    try {
      const res = await fetch(`/api/v1/benixpay/checkout/${txnId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, payment_method: paymentMethod, reason })
      });
      const data = await res.json();

      if (data.success) {
        setCheckout((prev) => (prev ? { ...prev, status: data.status } : null));
        if (outcome === 'successful') {
          setPayMessage('🎉 Test payment simulated successfully! In-app, push, and email receipts dispatched.');
        } else {
          setPayError(`Simulation: Transaction marked ${data.status} (${reason || 'Simulated failure'}).`);
        }
      } else {
        setPayError(data.error || 'Simulation failed.');
      }
    } catch (e: any) {
      setPayError(e.message || 'Simulation network error.');
    } finally {
      setSimulating(false);
    }
  };

  const handleLivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnId) return;
    setPaying(true);
    setPayError('');
    setPayMessage('');

    try {
      const res = await fetch(`/api/v1/benixpay/checkout/${txnId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, payment_method: paymentMethod })
      });
      const data = await res.json();

      if (data.success) {
        setPayMessage(data.message || 'Payment prompt sent to your phone. Approve on your handset.');
        // Poll status every 3 seconds
        const pollInterval = setInterval(async () => {
          const checkRes = await fetch(`/api/v1/benixpay/checkout/${txnId}`);
          const checkData = await checkRes.json();
          if (checkData.success && checkData.checkout) {
            if (checkData.checkout.status !== 'pending') {
              clearInterval(pollInterval);
              setCheckout(checkData.checkout);
            }
          }
        }, 3000);
      } else {
        setPayError(data.error || 'Payment initiation failed.');
      }
    } catch (e: any) {
      setPayError(e.message || 'Payment error.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B11] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-xs font-medium">Securing connection to Benix Pay...</p>
        </div>
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <div className="min-h-screen bg-[#080B11] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111726] border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Payment Session Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error || 'This checkout session is invalid or has expired.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
          >
            Return to BenixSpace Home
          </button>
        </div>
      </div>
    );
  }

  const isSandbox = checkout.mode === 'sandbox';
  const isCompleted = checkout.status === 'successful';
  const isFailed = checkout.status === 'failed' || checkout.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-600">
      {/* Top Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <span className="font-black text-sm">B</span>
          </div>
          <span className="font-black tracking-tight text-base">Benix Pay</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold bg-[#131926] px-3 py-1 rounded-full border border-slate-800">
            <Lock className="w-3 h-3 text-emerald-400" /> 256-bit Encrypted
          </span>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center">
        {/* Sandbox Notice Banner */}
        {isSandbox && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <strong className="font-extrabold uppercase tracking-wide">Sandbox Simulator Active</strong>
            </div>
            <span className="text-[10px] text-amber-200/80 font-mono">No Real Money Charged</span>
          </div>
        )}

        {/* Card Frame */}
        <div className="bg-[#101624] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Order Summary Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Paying to Merchant</span>
              <h2 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <Building className="w-4 h-4 text-blue-400" />
                <span>{checkout.merchant_name}</span>
                <span title="Verified Merchant">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Order #{checkout.order_reference}</span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Due</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {Number(checkout.customer_charged_amount || checkout.amount).toLocaleString()} {checkout.currency}
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {payMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{payMessage}</span>
            </div>
          )}

          {payError && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{payError}</span>
            </div>
          )}

          {/* State 1: Transaction Successful */}
          {isCompleted && (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Payment Completed!</h3>
                <p className="text-xs text-slate-400">
                  {Number(checkout.customer_charged_amount || checkout.amount).toLocaleString()} {checkout.currency} successfully authorized.
                </p>
                <p className="text-[11px] font-mono text-slate-400">Ref: {checkout.id}</p>
              </div>

              {checkout.redirect_url ? (
                <div className="pt-3">
                  <a
                    href={checkout.redirect_url}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95"
                  >
                    <span>Return to Merchant</span>
                    {redirectCountdown !== null && <span>({redirectCountdown}s)</span>}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Done
                </button>
              )}
            </div>
          )}

          {/* State 2: Transaction Failed / Cancelled */}
          {isFailed && (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto text-red-400 shadow-xl">
                <XCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Payment {checkout.status.toUpperCase()}</h3>
                <p className="text-xs text-slate-400">The transaction could not be completed.</p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCheckout((prev) => (prev ? { ...prev, status: 'pending' } : null))}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                {checkout.redirect_url && (
                  <a
                    href={checkout.redirect_url}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel & Return
                  </a>
                )}
              </div>
            </div>
          )}

          {/* State 3: Pending Payment Form / Simulator */}
          {!isCompleted && !isFailed && (
            <div className="space-y-5">
              {/* Payment Method Selector */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Select Payment Method</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo_mtn')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'momo_mtn'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-[#151D2E] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo_airtel')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'momo_airtel'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-md'
                        : 'bg-[#151D2E] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-rose-400" />
                    <span>Airtel Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-md'
                        : 'bg-[#151D2E] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Credit Card</span>
                  </button>
                </div>
              </div>

              {/* Sandbox Simulator Controls */}
              {isSandbox ? (
                <div className="p-5 rounded-2xl bg-[#162032] border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sandbox Payment Simulator</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Merchant Test Mode</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Test your integration without moving real funds. Choose an outcome below to trigger real webhook payloads and instant multi-channel notifications.
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={simulating}
                      onClick={() => handleSimulate('successful')}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{simulating ? 'Processing...' : `Simulate Payment Success (${Number(checkout.customer_charged_amount || checkout.amount).toLocaleString()} ${checkout.currency})`}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={simulating}
                        onClick={() => handleSimulate('failed', 'Insufficient customer MoMo balance')}
                        className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Simulate Insufficient Funds</span>
                      </button>

                      <button
                        type="button"
                        disabled={simulating}
                        onClick={() => handleSimulate('cancelled', 'Customer rejected prompt on handset')}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Simulate User Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Live Payment Form */
                <form onSubmit={handleLivePayment} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {paymentMethod === 'card' ? 'Cardholder Phone Number' : `${paymentMethod === 'momo_mtn' ? 'MTN' : 'Airtel'} Phone Number`}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 078XXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141B2A] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">A payment authorization prompt will be pushed to this number.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{paying ? 'Initiating Secure Payment...' : `Pay ${Number(checkout.customer_charged_amount || checkout.amount).toLocaleString()} ${checkout.currency}`}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto text-center pt-6 text-[11px] text-slate-400 space-y-1">
        <p>Protected by Benix Pay Fraud Shield & Master Settlement Aggregation.</p>
        <p>© 2026 Benix.Space. All rights reserved.</p>
      </footer>
    </div>
  );
};
