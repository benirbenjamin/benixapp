import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, ShieldAlert, Key, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { User } from '../../types';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';

export const UsersAdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'ADMIN',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { user: currentUser } = useAuth();

  const fetchUserList = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, []);

  const handleOpenAdd = () => {
    setIsNew(true);
    setFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'ADMIN',
    });
    setEditingUser({} as User);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      if (isNew) {
        await createUser(formData);
      } else if (editingUser?.id) {
        await updateUser(editingUser.id, {
          full_name: formData.full_name,
          role: formData.role as any,
          password: formData.password || undefined,
        });
      }
      setEditingUser(null);
      await fetchUserList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save administrator.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (target: User) => {
    if (target.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      await updateUser(target.id, { is_active: !target.is_active });
      await fetchUserList();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const handleDelete = async (target: User) => {
    if (target.id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete administrator "${target.full_name}"?`)) return;

    try {
      await deleteUser(target.id);
      await fetchUserList();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Administrator Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Super Admin control panel: manage staff accounts, roles, and password resets
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Admin
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Loading admin users...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 block text-sm">
                          {u.full_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {u.id.slice(0, 8)}...
                        </span>
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-700">{u.email}</td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role === 'SUPER_ADMIN' ? <ShieldAlert className="w-3 h-3 text-amber-600" /> : <Shield className="w-3 h-3 text-slate-500" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          } disabled:opacity-50`}
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setIsNew(false);
                            setEditingUser(u);
                            setFormData({
                              email: u.email,
                              full_name: u.full_name,
                              password: '',
                              role: u.role,
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rba-blue hover:bg-slate-100 transition-colors"
                          title="Edit User"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Add / Edit User */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                {isNew ? 'Create New Administrator' : `Edit Account: ${editingUser.full_name}`}
              </h2>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. John Bosco"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                </div>

                {isNew && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@rba.co.rw"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isNew ? 'Initial Password *' : 'New Password (leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    required={isNew}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Access Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN (Stations, Videos, Analytics)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control & Users)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Administrator'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
