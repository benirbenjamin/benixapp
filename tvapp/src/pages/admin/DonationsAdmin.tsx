import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { getRecentSupporters } from '../../services/api';
import { Supporter } from '../../types';
import { Coffee, Heart, MessageSquare, Phone, Send, Search, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

export const DonationsAdminPage: React.FC = () => {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [stats, setStats] = useState<{ total_donations: number; total_cups: number }>({ total_donations: 0, total_cups: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const res = await getRecentSupporters();
      if (res) {
        setSupporters(res.supporters || []);
        setStats(res.stats || { total_donations: 0, total_cups: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch coffee donations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const filteredSupporters = supporters.filter((sup) => {
    const q = searchQuery.toLowerCase();
    return (
      sup.donor_name.toLowerCase().includes(q) ||
      (sup.donor_email && sup.donor_email.toLowerCase().includes(q)) ||
      (sup.donor_phone && sup.donor_phone.includes(q)) ||
      (sup.message && sup.message.toLowerCase().includes(q))
    );
  });

  const generateWhatsAppLink = (sup: Supporter) => {
    // Format phone number (e.g. 0788123456 -> 250788123456)
    let rawPhone = sup.donor_phone ? sup.donor_phone.replace(/\D/g, '') : '';
    if (rawPhone.startsWith('0')) {
      rawPhone = '250' + rawPhone.slice(1);
    }
    if (!rawPhone) {
      // Default admin WhatsApp
      rawPhone = '250783987223';
    }

    const messageText = `Hello ${sup.donor_name}! ☕\n\nThank you so much for blessing Benix Space TV with ${sup.amount.toLocaleString()} ${sup.currency} (${sup.coffee_cups} coffee cups)!\n\nYour support fuels our 24/7 independent live TV & radio broadcasting. We truly appreciate your generosity. God bless you! 🙏✨`;

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(messageText)}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-2 text-amber-100 font-bold text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-yellow-200" />
              Coffee Blessings & Donations Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              Coffee Supporters & Blessings
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium max-w-xl mt-1">
              Check who supported your live broadcasts and send them personalized WhatsApp thank-you notes!
            </p>
          </div>

          <div className="flex items-center gap-2 z-10">
            <button
              onClick={fetchDonations}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-black/25 hover:bg-black/40 text-white text-xs font-bold flex items-center gap-2 transition-all border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Coffee Cups
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                ☕ {stats.total_cups.toLocaleString()} Cups
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
              ☕
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Supporters
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {stats.total_donations.toLocaleString()} Blessings
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Security & Privacy
              </span>
              <span className="text-sm font-bold text-emerald-600 mt-1 block flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Admin Confidential Access
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, or message..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredSupporters.length} of {supporters.length} supporters
          </span>
        </div>

        {/* Supporters List Table / Cards */}
        {isLoading ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading supporter blessings...</p>
          </div>
        ) : filteredSupporters.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-3xl">☕</span>
            <h4 className="text-base font-bold text-slate-800">No Supporter Records Found</h4>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'No supporters match your search filter.' : 'Supporter contributions will appear here confidentially.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSupporters.map((sup, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar: Name & Cups */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {sup.donor_name}
                      </h3>
                      {sup.donor_email && (
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {sup.donor_email}
                        </p>
                      )}
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 font-black text-xs shrink-0 flex items-center gap-1">
                      <span>☕</span>
                      <span>{sup.coffee_cups} Cups</span>
                    </span>
                  </div>

                  {/* Amount Pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                    <span>Contribution:</span>
                    <span className="text-amber-600 font-black">
                      {sup.amount.toLocaleString()} {sup.currency}
                    </span>
                  </div>

                  {/* Donor Message */}
                  {sup.message && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-slate-700 italic flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>"{sup.message}"</span>
                    </div>
                  )}

                  {/* Donor Phone */}
                  {sup.donor_phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone / MoMo: <strong>{sup.donor_phone}</strong></span>
                    </div>
                  )}
                </div>

                {/* WhatsApp Action Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {sup.created_at ? new Date(sup.created_at).toLocaleDateString() : 'Recent'}
                  </span>

                  <a
                    href={generateWhatsAppLink(sup)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Thank on WhatsApp</span>
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
