import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchUsers, createUser, deleteUser } from '../../services/api';
import { User, UserPlus, Trash2, Shield, Edit3, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor' as 'admin' | 'editor'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenModal = () => {
    setNewUser({ name: '', email: '', password: '', role: 'editor' });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUser.name || !newUser.email || !newUser.password) {
      setFormError('Please fill in Name, Email, and Password.');
      return;
    }

    setSaving(true);
    try {
      const res = await createUser(newUser);
      setFormSuccess(res.message || 'User created successfully!');
      setTimeout(() => {
        setShowModal(false);
        loadUsers();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${name}?`)) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User & Editor Management</h1>
            <p className="text-slate-600 text-sm">Add platform administrators and content editors with article review workflows.</p>
          </div>

          <button
            onClick={handleOpenModal}
            className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add New User / Editor
          </button>
        </div>

        {/* Workflow Info Alert */}
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-3 text-xs text-sky-900">
          <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-slate-900 font-bold">Role & Content Review Workflow:</strong>
            <p>
              • <strong>Editors</strong> can write and edit blog articles. When an editor submits a post, it is set to <span className="font-bold text-amber-700">Pending Review</span>.<br />
              • <strong>Administrators</strong> receive submitted articles in the CMS, review the content, and approve them to be published live on BenixSpace.
            </p>
          </div>
        </div>

        {/* User Datatable */}
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-extrabold border-b border-slate-200">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No users found. Click "Add New User / Editor".</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 font-bold flex items-center justify-center text-xs">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 text-xs font-mono">{u.email}</td>
                      <td className="p-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-extrabold capitalize ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 border border-slate-200 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-900">Add New Platform User</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" /> <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-slate-600 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="editor@nebelurw.com"
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase">Initial Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase">Access Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold"
                  >
                    <option value="editor">Editor (Submits articles for review)</option>
                    <option value="admin">Administrator (Full control & approvals)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md"
                  >
                    {saving ? 'Creating...' : 'Create User'}
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
