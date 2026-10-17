'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface GooglePayButtonProps {
  planId: string;
  planName: string;
  priceMonthly: number;
  choirId: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GooglePayButton({
  planId,
  planName,
  priceMonthly,
  choirId,
  onSuccess,
}: GooglePayButtonProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const googlePayMerchantId = process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || '12345678901234567890';
  const googlePayEnv = (process.env.NEXT_PUBLIC_GOOGLE_PAY_ENV as 'TEST' | 'PRODUCTION') || 'TEST';

  useEffect(() => {
    // Dynamically load Google Pay JS SDK if not present
    if (window.google?.payments?.api?.PaymentsClient) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load Google Pay SDK. Please check your network connection.');
    };
    document.body.appendChild(script);
  }, []);

  const getGooglePaymentDataRequest = () => {
    const baseRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
    };

    const allowedCardNetworks = ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'];
    const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

    const tokenizationSpecification = {
      type: 'PAYMENT_GATEWAY',
      parameters: {
        gateway: 'example',
        gatewayMerchantId: 'exampleGatewayMerchantId',
      },
    };

    const baseCardPaymentMethod = {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks,
      },
    };

    const cardPaymentMethod = Object.assign({}, baseCardPaymentMethod, {
      tokenizationSpecification,
    });

    const transactionInfo = {
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: priceMonthly.toFixed(2),
      currencyCode: 'USD',
      countryCode: 'US',
    };

    const merchantInfo = {
      merchantName: 'Voxify Space Choir SaaS',
      merchantId: googlePayMerchantId,
    };

    return Object.assign({}, baseRequest, {
      allowedPaymentMethods: [cardPaymentMethod],
      transactionInfo,
      merchantInfo,
    });
  };

  const handleGooglePayClick = async () => {
    if (!sdkLoaded && !window.google?.payments?.api) {
      setError('Google Pay is initializing. Please try again in a moment.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: googlePayEnv,
      });

      const paymentDataRequest = getGooglePaymentDataRequest();
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      const paymentToken = paymentData?.paymentMethodData?.tokenizationData?.token || 'mock_gpay_token_' + Date.now();

      const res = await fetch('/api/payments/google-pay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choirId,
          planId,
          priceMonthly,
          paymentToken,
          paymentMethod: 'google_pay',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Google Pay Payment Verified! ${planName} Plan activated ($${priceMonthly}/mo).`);
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Failed to complete Google Pay transaction.');
      }
    } catch (err: any) {
      if (err?.statusCode === 'CANCELED') {
        setError(null);
      } else {
        console.error('Google Pay error:', err);
        setError(err.message || 'Google Pay transaction failed.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGooglePayClick}
        disabled={processing}
        className="w-full bg-black hover:bg-slate-900 border border-slate-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span className="text-xs">Processing Google Pay...</span>
          </>
        ) : (
          <>
            <span className="text-xs font-semibold text-slate-200">
              Pay ${priceMonthly.toFixed(2)} with
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-white text-sm">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Pay</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
