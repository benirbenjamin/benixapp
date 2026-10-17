import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { updateAdminProfile, changeAdminPassword } from '../../services/api';
import { User, Lock, Save, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminProfilePage: React.FC = () => {
  const [name, setName] = useState('Benir Benjamin');
  const [email, setEmail] = useState('benirabok@gmail.com');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);

    try {
      await updateAdminProfile(name, email);
      setProfileSuccess('Profile details updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword !== confirmPassword) {
      setPassError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    setSavingPass(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setPassSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Profile & Security</h1>
          <p className="text-slate-600 text-sm">Update your administrator details and security credentials.</p>
        </div>

        {/* Profile Info Card */}
        <div className="glass-card rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <User className="w-5 h-5 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Personal Profile Settings</h2>
          </div>

          {profileError && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm font-normal"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm font-normal"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                {savingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-card rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <KeyRound className="w-5 h-5 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
          </div>

          {passError && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{passSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold">
            <div className="space-y-1">
              <label className="text-slate-600 uppercase">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm font-normal"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-600 uppercase">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm font-normal"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm font-normal"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingPass}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                {savingPass ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
};
