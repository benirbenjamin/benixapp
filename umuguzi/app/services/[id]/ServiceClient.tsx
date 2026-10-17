"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  MapPin,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Wallet,
  Check,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { formatCurrency } from "@/lib/utils";

export default function ServiceClient({ service }: { service: any }) {
  const router = useRouter();
  const { user, settings } = useApp();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(
    service.packages && service.packages.length > 0 ? service.packages[0] : null
  );
  const [bookingDate, setBookingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("FLUTTERWAVE");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const images = (service.images as string[]) || [];
  const mainImage =
    images.length > 0
      ? images[0]
      : "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80";

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/services/${service.id}`);
      return;
    }
    if (!bookingDate) {
      setError("Please select your desired booking appointment date.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const price = selectedPackage?.price || service.price;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          packageTitle: selectedPackage?.name || "Standard Booking",
          bookingDate,
          totalAmount: price,
          notes,
          paymentMethod,
          paymentReference: paymentRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/orders");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Images & Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainImage} alt={service.title} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {service.category && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                  {service.category.name}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {service.location || "Kigali, Rwanda"}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-500 font-bold ml-auto">
                <Star className="w-4 h-4 fill-current" />
                {service.rating.toFixed(1)} ({service.reviewCount} verified reviews)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {service.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {service.description}
            </p>
          </div>
        </div>

        {/* Right Col: Provider Profile & Booking Action Card */}
        <div className="space-y-6">
          {/* Provider Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Service Provider
            </h3>
            <div className="flex items-center gap-3">
              {service.provider.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.provider.avatar}
                  alt={service.provider.displayName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xl">
                  {service.provider.displayName.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-slate-900">{service.provider.displayName}</span>
                  <CheckCircle2 className="w-4 h-4 text-brand" />
                </div>
                <p className="text-xs text-slate-500">@{service.provider.username}</p>
                {service.provider.phone && (
                  <p className="text-xs text-slate-600 font-mono mt-0.5">{service.provider.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Booking CTA */}
          <div className="p-6 rounded-2xl bg-white border-2 border-blue-600/20 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Standard Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {formatCurrency(service.price)}
                </span>
                <span className="text-xs text-slate-500">/ {service.priceType.toLowerCase()}</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Direct communication with provider</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Pay securely via Flutterwave or MTN/Airtel MoMo</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Protected with Umuguzipro Buyer Guarantee</span>
              </li>
            </ul>

            <button
              onClick={() => setBookingModalOpen(true)}
              className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-extrabold text-sm rounded-xl shadow-lg transition-all text-center block"
            >
              Book Service Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Booking Interactive Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Book Appointment</h3>
                <p className="text-xs text-slate-500">{service.title}</p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
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
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h4 className="text-lg font-bold text-slate-900">Booking Successfully Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Redirecting you to your orders &amp; appointments dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Appointment Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Job Requirements / Client Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe your location, special requests, or instructions for the provider..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("FLUTTERWAVE")}
                      className={`p-3 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === "FLUTTERWAVE"
                          ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Flutterwave
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("MANUAL")}
                      className={`p-3 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === "MANUAL"
                          ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      MoMo / Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("WALLET")}
                      className={`p-3 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === "WALLET"
                          ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      Wallet
                    </button>
                  </div>

                  {/* Manual Instructions Display */}
                  {paymentMethod === "MANUAL" && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <p className="font-bold">Manual Transfer Instructions:</p>
                      <p>{settings.manual_payment_instructions || "Send via MTN MoMo / Bank Transfer"}</p>
                      <div className="pt-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                          Transaction Reference / MoMo Txn ID:
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder="e.g. MP260919.1234.H..."
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900 mb-3">
                    <span>Total Booking Cost:</span>
                    <span className="text-xl text-brand">{formatCurrency(service.price)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? "Processing Booking..." : "Confirm & Book Appointment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
