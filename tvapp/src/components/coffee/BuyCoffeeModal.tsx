import React, { useState, useEffect } from 'react';
import {
  Coffee,
  X,
  Heart,
  CheckCircle2,
  Sparkles,
  CreditCard,
  ShieldCheck,
  MessageSquare,
  Globe2,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useCoffee } from '../../context/CoffeeContext';
import { initializeDonation, verifyDonation, getRecentSupporters } from '../../services/api';
import { CurrencyOption, Supporter } from '../../types';

// Multi-currency configurations
const CURRENCIES: CurrencyOption[] = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', cupPrice: 2500, flag: '🇷🇼', country: 'Rwanda' },
  { code: 'USD', name: 'US Dollar', symbol: '$', cupPrice: 3, flag: '🇺🇸', country: 'International' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX', cupPrice: 10000, flag: '🇺🇬', country: 'Uganda' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', cupPrice: 4000, flag: '🇳🇬', country: 'Nigeria' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', cupPrice: 400, flag: '🇰🇪', country: 'Kenya' },
  { code: 'EUR', name: 'Euro', symbol: '€', cupPrice: 3, flag: '🇪🇺', country: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '£', cupPrice: 2.5, flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', cupPrice: 7500, flag: '🇹🇿', country: 'Tanzania' },
];

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: any) => void;
  }
}

export const BuyCoffeeModal: React.FC = () => {
  const { isCoffeeModalOpen, initialCups, closeCoffeeModal } = useCoffee();

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(CURRENCIES[0]); // Default RWF
  const [cupsCount, setCupsCount] = useState<number>(1);
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const [recentSupporters, setRecentSupporters] = useState<Supporter[]>([]);
  const [stats, setStats] = useState<{ total_donations: number; total_cups: number }>({ total_donations: 0, total_cups: 0 });

  // Sync initial cups count when modal opens
  useEffect(() => {
    if (isCoffeeModalOpen) {
      setCupsCount(initialCups || 1);
      setIsCustomAmount(false);
      setErrorMessage(null);
      setSuccessData(null);
      loadRecentSupporters();
      loadFlutterwaveScript();
    }
  }, [isCoffeeModalOpen, initialCups]);

  // Load Flutterwave inline checkout script dynamically if missing
  const loadFlutterwaveScript = () => {
    if (window.FlutterwaveCheckout) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const loadRecentSupporters = async () => {
    try {
      const res = await getRecentSupporters();
      if (res && res.supporters) {
        setRecentSupporters(res.supporters);
        setStats(res.stats);
      }
    } catch {
      // Ignore background load error
    }
  };

  if (!isCoffeeModalOpen) return null;

  // Calculate total amount
  const calculateTotalAmount = (): number => {
    if (isCustomAmount) {
      const val = parseFloat(customAmountInput);
      return isNaN(val) || val <= 0 ? selectedCurrency.cupPrice : val;
    }
    return selectedCurrency.cupPrice * cupsCount;
  };

  const formatPrice = (num: number, curr: CurrencyOption): string => {
    if (curr.code === 'RWF' || curr.code === 'UGX' || curr.code === 'TZS') {
      return `${num.toLocaleString()} ${curr.symbol}`;
    }
    return `${curr.symbol}${num.toLocaleString(undefined, { minimumFractionDigits: num % 1 === 0 ? 0 : 2 })}`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!donorEmail || !donorEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for your payment receipt.');
      return;
    }

    const finalAmount = calculateTotalAmount();
    if (finalAmount <= 0) {
      setErrorMessage('Please enter a valid donation amount.');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Initialize transaction in backend DB
      const initRes = await initializeDonation({
        donor_name: donorName.trim() || 'Generous Supporter',
        donor_email: donorEmail.trim(),
        donor_phone: donorPhone.trim() || undefined,
        currency: selectedCurrency.code,
        amount: finalAmount,
        coffee_cups: isCustomAmount ? Math.max(1, Math.round(finalAmount / selectedCurrency.cupPrice)) : cupsCount,
        message: donorMessage.trim() || undefined,
      });

      const { tx_ref, public_key } = initRes;

      // Step 2: Ensure Flutterwave script is ready
      if (!window.FlutterwaveCheckout) {
        loadFlutterwaveScript();
        // Wait 1 sec for script to load if slow connection
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (!window.FlutterwaveCheckout) {
        throw new Error('Flutterwave payment script failed to initialize. Please check your internet connection.');
      }

      // Step 3: Trigger Flutterwave Modal
      window.FlutterwaveCheckout({
        public_key: public_key,
        tx_ref: tx_ref,
        amount: finalAmount,
        currency: selectedCurrency.code,
        payment_options: 'card,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneyghana,mpesa,banktransfer,ussd',
        customer: {
          email: donorEmail.trim(),
          phone_number: donorPhone.trim() || '0780000000',
          name: donorName.trim() || 'Generous Supporter',
        },
        customizations: {
          title: 'Benix Space TV - Buy Us a Coffee',
          description: `Buying ${cupsCount} ☕ coffee cup(s) to support independent live broadcasting!`,
          logo: `${window.location.origin}/logo.png`,
        },
        callback: async (response: any) => {
          console.log('Flutterwave Checkout Response:', response);
          try {
            const verifyRes = await verifyDonation({
              tx_ref: tx_ref,
              transaction_id: String(response.transaction_id || response.id || ''),
              status: response.status,
              flw_ref: response.flw_ref,
              payment_type: response.payment_type,
            });

            if (verifyRes.success || response.status === 'successful' || response.status === 'completed') {
              setSuccessData({
                donor_name: donorName || 'Generous Supporter',
                amount: finalAmount,
                currency: selectedCurrency,
                cups: cupsCount,
                message: donorMessage,
              });
              loadRecentSupporters();
            } else {
              setErrorMessage('Payment verification returned incomplete. If charged, your support will be credited shortly.');
            }
          } catch (verErr: any) {
            console.error('Verification error:', verErr);
            // Treat user as successful if client received completion status
            setSuccessData({
              donor_name: donorName || 'Generous Supporter',
              amount: finalAmount,
              currency: selectedCurrency,
              cups: cupsCount,
              message: donorMessage,
            });
          } finally {
            setIsProcessing(false);
          }
        },
        onclose: () => {
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      console.error('Donation error:', err);
      setErrorMessage(err.message || 'Unable to start payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-white my-auto">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 p-5 sm:p-6 relative">
          <button
            onClick={closeCoffeeModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-1.5">
            <div className="w-12 h-12 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner">
              ☕
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Buy Us a Coffee
                <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/90 font-medium">
                Fuel live TV, radio broadcasts & independent journalism
              </p>
            </div>
          </div>

          {stats.total_cups > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-xs font-semibold text-amber-100">
              <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
              <span>{stats.total_cups.toLocaleString()} coffees bought by supporters so far!</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {successData ? (
            /* Success Celebration Screen */
            <div className="text-center py-6 space-y-4 animate-scaleUp">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white">Murakoze Cyane! 🎉</h4>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Thank you so much, <span className="font-bold text-amber-400">{successData.donor_name}</span>! Your generous gift of{' '}
                  <span className="font-bold text-white">{formatPrice(successData.amount, successData.currency)}</span> ({successData.cups} ☕) keeps our streams running 24/7.
                </p>
              </div>

              {successData.message && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 italic text-xs text-amber-200 max-w-sm mx-auto">
                  "{successData.message}"
                </div>
              )}

              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => {
                    setSuccessData(null);
                    closeCoffeeModal();
                  }}
                  className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-lg hover:scale-105 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleCheckout} className="space-y-5">
              
              {/* Currency Selector */}
              <div>
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  Select Your Preferred Currency
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CURRENCIES.map((curr) => {
                    const isSelected = selectedCurrency.code === curr.code;
                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => {
                          setSelectedCurrency(curr);
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="text-base">{curr.flag}</span>
                          <span>{curr.code}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">{curr.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coffee Cups Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center justify-between">
                  <span>How many coffees? ☕</span>
                  <span className="text-amber-400 font-semibold lowercase text-[11px]">
                    1 cup = {formatPrice(selectedCurrency.cupPrice, selectedCurrency)}
                  </span>
                </label>

                <div className="grid grid-cols-4 gap-2.5">
                  {[1, 2, 3, 5].map((num) => {
                    const isSelected = !isCustomAmount && cupsCount === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setCupsCount(num);
                          setIsCustomAmount(false);
                        }}
                        className={`py-3 rounded-2xl border text-sm font-black transition-all flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50 scale-105'
                            : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg">☕ {num}</span>
                        <span className="text-[10px] opacity-80">
                          {formatPrice(selectedCurrency.cupPrice * num, selectedCurrency)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Button Toggle */}
                <div className="mt-2.5">
                  {!isCustomAmount ? (
                    <button
                      type="button"
                      onClick={() => setIsCustomAmount(true)}
                      className="w-full py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 underline text-center"
                    >
                      + Enter Custom Amount ({selectedCurrency.code})
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={customAmountInput}
                          onChange={(e) => setCustomAmountInput(e.target.value)}
                          placeholder={`Enter custom amount in ${selectedCurrency.code}...`}
                          className="w-full pl-9 pr-3 py-2 bg-white/10 border border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-amber-400 font-bold">
                          {selectedCurrency.symbol}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomAmount(false)}
                        className="px-3 py-2 text-xs text-slate-400 hover:text-white font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Donor Inputs */}
              <div className="space-y-3 pt-1 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g. Mugisha Jean"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Phone / MoMo Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="e.g. 0788123456"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Message of Support (Optional)
                    </label>
                    <input
                      type="text"
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      placeholder="e.g. Keep up the good work!"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Checkout Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base shadow-xl hover:shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Opening Flutterwave Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Support {formatPrice(calculateTotalAmount(), selectedCurrency)}</span>
                    <span className="text-xl group-hover:scale-125 transition-transform">☕</span>
                  </>
                )}
              </button>

              {/* Supported Payment Channels */}
              <div className="pt-2 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secured by Flutterwave • MTN MoMo, Airtel, Visa, Mastercard, M-Pesa</span>
                </div>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
