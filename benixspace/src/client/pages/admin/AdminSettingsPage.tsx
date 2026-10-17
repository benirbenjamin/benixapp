import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchCompanySettings, updateCompanySettings } from '../../services/api';
import { CompanySettings } from '../../types';
import { Settings, Save, CheckCircle2, AlertCircle, Building2, User, Mail, Phone, MapPin } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [company, setCompany] = useState<Partial<CompanySettings>>({
    company_name: 'NebeluRw Co. Ltd',
    company_description: 'NebeluRw Co. Ltd is a technology and digital services company developing digital platforms and web apps.',
    history: 'Founded by Benir Benjamin...',
    founder_name: 'Benir Benjamin',
    founder_bio: 'Founder and lead developer of NebeluRw Co. Ltd...',
    email: 'benirabok@gmail.com',
    phone: '0783987223',
    address: 'Kigali, Rwanda'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchCompanySettings();
        if (data.company && data.company.company_name) {
          setCompany(data.company);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await updateCompanySettings(company);
      setSuccess('Company settings updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Company Settings</h1>
            <p className="text-slate-600 text-sm">Manage NebeluRw Co. Ltd profile, founder leadership info, and contact shortcuts.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Settings
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="glass-card rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-sky-600" /> NebeluRw Entity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Company Name</label>
                <input
                  type="text"
                  value={company.company_name || ''}
                  onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Founder / Contact Person</label>
                <input
                  type="text"
                  value={company.founder_name || ''}
                  onChange={(e) => setCompany({ ...company, founder_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-xs font-semibold">
              <label className="text-slate-600 uppercase">Company Description</label>
              <textarea
                rows={3}
                value={company.company_description || ''}
                onChange={(e) => setCompany({ ...company, company_description: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-5 h-5 text-sky-600" /> Contact & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Primary Email</label>
                <input
                  type="email"
                  value={company.email || ''}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Primary Phone</label>
                <input
                  type="text"
                  value={company.phone || ''}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Address / Location</label>
                <input
                  type="text"
                  value={company.address || ''}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-sky-600" /> Benir Benjamin Founder Biography
            </h3>

            <div className="space-y-1 text-xs font-semibold">
              <textarea
                rows={3}
                value={company.founder_bio || ''}
                onChange={(e) => setCompany({ ...company, founder_bio: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 font-normal text-sm leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-all"
            >
              Save Company Settings
            </button>
          </div>

        </form>

      </div>
    </AdminLayout>
  );
};
