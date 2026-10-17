import React, { useState } from 'react';
import { useStation } from '../../context/StationContext';
import { ThemeProvider } from '../../components/themes/ThemeProvider';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PersistentPlayerBar } from '../../components/player/PersistentPlayerBar';
import { Phone, Mail, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export function StationContactPage() {
  const { station, branding, settings } = useStation();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate contact message transmission
    setSubmitted(true);
  };

  return (
    <ThemeProvider branding={branding}>
      <div className="min-h-screen flex flex-col justify-between">
        <div>
          <PublicNavbar />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">
                Connect With Us
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-color)] tracking-tight">
                Contact Studio & Team
              </h1>
              <p className="text-sm sm:text-base text-[var(--muted-color)]">
                Have a song request, advertising inquiry, or news tip? We’d love to hear from you.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
              
              {/* Contact Info (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-8 rounded-3xl bg-[var(--surface-color)] border border-slate-200 shadow-sm space-y-6">
                  <h2 className="font-extrabold text-xl text-[var(--text-color)]">Studio Details</h2>

                  <div className="space-y-4 text-sm text-[var(--text-color)]">
                    {settings?.phone && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[var(--primary-color)] flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--muted-color)] uppercase">On-Air Hotline</p>
                          <p className="font-semibold text-sm">{settings.phone}</p>
                        </div>
                      </div>
                    )}

                    {settings?.email && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[var(--primary-color)] flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--muted-color)] uppercase">Direct Email</p>
                          <p className="font-semibold text-sm">{settings.email}</p>
                        </div>
                      </div>
                    )}

                    {settings?.address && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[var(--primary-color)] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--muted-color)] uppercase">Studio Location</p>
                          <p className="font-semibold text-sm">{settings.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-[var(--muted-color)]">
                      Broadcast Timezone: <strong>{settings?.timezone || 'Africa/Kigali'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Form (7 cols) */}
              <div className="lg:col-span-7">
                <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface-color)] border border-slate-200 shadow-sm">
                  {submitted ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-[var(--text-color)]">Message Sent!</h3>
                      <p className="text-xs sm:text-sm text-[var(--muted-color)] max-w-sm mx-auto">
                        Thank you for reaching out to {station?.name}. Our production desk has received your message.
                      </p>
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                        }}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Send Another Note
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <h3 className="font-extrabold text-xl text-[var(--text-color)]">Send Studio a Message</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[var(--text-color)] uppercase tracking-wider">Your Name</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Marie Uwase"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[var(--text-color)] uppercase tracking-wider">Email Address</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="marie@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-color)] uppercase tracking-wider">Subject</label>
                        <input
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Song request, sponsorship, feedback..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-color)] uppercase tracking-wider">Your Message</label>
                        <textarea
                          rows={4}
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Write your note to our radio team..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                        style={{ backgroundColor: branding?.primary_color || '#4F46E5' }}
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit Message</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        <PublicFooter />
        <PersistentPlayerBar />
      </div>
    </ThemeProvider>
  );
}
