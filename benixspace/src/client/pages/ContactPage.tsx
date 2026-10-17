import React, { useState, useEffect } from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { submitContactForm } from '../services/api';
import { trackPageView } from '../analytics/tracker';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from '../components/common/SocialIcons';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trackPageView(window.location.href, 'contact');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all form fields.');
      return;
    }

    setLoading(true);
    try {
      await submitContactForm(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Contact Us — NebeluRw Co. Ltd & Benir Benjamin"
        description="Get in touch with Benir Benjamin at NebeluRw Co. Ltd. Email: benirabok@gmail.com, Phone: 0783987223."
      />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/80 px-4 py-1.5 rounded-full border border-sky-200">
              Get In Touch
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Contact NebeluRw Co. Ltd
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Have a project inquiry, software development need, media distribution question, or consultation request? We would love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Direct Contact Info Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="glass-card rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
                <h3 className="text-2xl font-extrabold text-slate-900">Company Information</h3>
                
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-slate-900">Email Address</strong>
                      <a href="mailto:benirabok@gmail.com" className="hover:text-sky-600 font-medium">
                        benirabok@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-slate-900">Phone Number</strong>
                      <a href="tel:0783987223" className="hover:text-sky-600 font-medium">
                        0783987223
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-slate-900">Location</strong>
                      <span>Kigali, Rwanda</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Social Accounts</h4>
                  <div className="flex items-center gap-3">
                    <a href="https://facebook.com/benir.thegeneral" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white transition-colors">
                      <FacebookIcon className="w-5 h-5" />
                    </a>
                    <a href="https://instagram.com/benirbenjamin" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white transition-colors">
                      <InstagramIcon className="w-5 h-5" />
                    </a>
                    <a href="https://x.com/benirbenjamin" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white transition-colors">
                      <TwitterIcon className="w-5 h-5" />
                    </a>
                    <a href="https://youtube.com/@nebelurw" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white transition-colors">
                      <YoutubeIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Send Us a Message</h3>

                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-100">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2 border border-emerald-100">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Thank you! Your message has been sent successfully. We will reply shortly.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase text-slate-600">Your Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Benir Benjamin"
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase text-slate-600">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="benirabok@gmail.com"
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-slate-600">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Software Inquiry / Digital Media Consultation"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-slate-600">Message</label>
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Write your detailed inquiry here..."
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold text-base shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
};
