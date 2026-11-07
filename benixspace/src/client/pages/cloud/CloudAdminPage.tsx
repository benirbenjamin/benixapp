import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Cloud,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Plus,
  ArrowLeft,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Edit2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

export const CloudAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deposits' | 'servers' | 'plans'>('deposits');
  const [loading, setLoading] = useState(true);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // Modals & Forms
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [serverProvider, setServerProvider] = useState('Ubuntu VPS');
  const [serverCoolifyUrl, setServerCoolifyUrl] = useState('');
  const [serverCoolifyToken, setServerCoolifyToken] = useState('');
  const [addingServer, setAddingServer] = useState(false);

  // Edit Plan Modal
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [planTrialDays, setPlanTrialDays] = useState<number>(60);
  const [planStorageGb, setPlanStorageGb] = useState<number>(5);
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${getAuthToken()}` };
      const [depRes, srvRes, plansRes] = await Promise.all([
        fetch('/api/cloud/admin/deposits/pending', { headers }).then((r) => r.json()),
        fetch('/api/cloud/admin/servers', { headers }).then((r) => r.json()),
        fetch('/api/cloud/plans').then((r) => r.json())
      ]);

      if (depRes.success) setPendingDeposits(depRes.deposits || []);
      if (srvRes.success) setServers(srvRes.servers || []);
      if (plansRes.success) setPlans(plansRes.plans || []);
    } catch (err) {
      console.warn('Error fetching admin cloud data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveDeposit = async (id: string, amount: number, ref: string) => {
    if (!window.confirm(`Are you sure you want to approve this deposit of ${amount.toLocaleString()} RWF (Ref: ${ref})? This will immediately credit the customer's wallet.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cloud/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchAdminData();
      } else {
        alert(json.error || 'Failed to approve deposit.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    const reason = window.prompt('Enter rejection reason for customer:', 'Transaction reference could not be verified in MTN MoMo statements.');
    if (!reason) return;

    try {
      const res = await fetch(`/api/cloud/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchAdminData();
      } else {
        alert(json.error || 'Failed to reject deposit.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingServer(true);

    try {
      const res = await fetch('/api/cloud/admin/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: serverName,
          provider: serverProvider,
          publicIp: serverIp,
          coolifyApiUrl: serverCoolifyUrl,
          coolifyApiToken: serverCoolifyToken
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowAddServerModal(false);
        setServerName('');
        setServerIp('');
        setServerCoolifyUrl('');
        setServerCoolifyToken('');
        await fetchAdminData();
      } else {
        alert(json.error || 'Failed to register server.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingServer(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);

    try {
      const res = await fetch(`/api/cloud/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          priceRwf: planPrice,
          trialDurationDays: planTrialDays,
          storageGb: planStorageGb
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditingPlan(null);
        await fetchAdminData();
      } else {
        alert(json.error || 'Failed to update plan.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/60 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/cloud/dashboard"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            title="Back to Customer Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h1 className="font-extrabold text-base tracking-tight text-white">
              Benix Cloud Administrator Infrastructure
            </h1>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5 bg-slate-950/20 px-4 sm:px-8 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
            activeTab === 'deposits' ? 'border-amber-500 text-white' : 'border-transparent text-slate-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Pending MoMo Deposits ({pendingDeposits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('servers')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
            activeTab === 'servers' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span>Multi-VPS Cluster ({servers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
            activeTab === 'plans' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Plan & Trial Configurator</span>
        </button>
      </div>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* PENDING MOMO DEPOSITS TAB */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-slate-300">
              <strong className="text-amber-300 font-bold block mb-1">
                Strict Admin Verification Required:
              </strong>
              These customers sent money to <strong>0783987223</strong>. Check your MTN Mobile Money SMS statement. Clicking <strong>Approve</strong> will immediately credit the customer's wallet balance.
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
              {pendingDeposits.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  🎉 No pending manual deposits awaiting approval. All requests are up to date!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {pendingDeposits.map((dep) => (
                    <div key={dep.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-white">
                            {Number(dep.amount).toLocaleString()} RWF
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase animate-pulse">
                            Pending Review
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                          User: <strong>{dep.user_name}</strong> ({dep.user_email})
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">
                          Sender Phone: <strong className="text-white">{dep.sender_phone}</strong> • MTN MoMo Ref:{' '}
                          <strong className="text-emerald-400">{dep.transaction_reference}</strong>
                        </div>
                        {dep.proof_image_url && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => setViewingProofUrl(dep.proof_image_url)}
                              className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/50 transition-colors text-left"
                            >
                              <img
                                src={dep.proof_image_url}
                                alt="Payment Proof"
                                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                              <div>
                                <span className="text-xs font-bold text-emerald-400 block">
                                  View Uploaded Screenshot 🔍
                                </span>
                                <span className="text-[10px] text-slate-400">Click to inspect receipt</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveDeposit(dep.id, Number(dep.amount), dep.transaction_reference)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Credit Wallet</span>
                        </button>
                        <button
                          onClick={() => handleRejectDeposit(dep.id)}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MULTI-VPS CLUSTER TAB */}
        {activeTab === 'servers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Registered VPS Nodes</h3>
                <p className="text-xs text-slate-400">Manage connected Ubuntu VPS servers running Coolify & Docker.</p>
              </div>
              <button
                onClick={() => setShowAddServerModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Register VPS Server</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servers.map((srv) => (
                <div key={srv.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{srv.name}</h4>
                        <div className="text-[11px] text-slate-400">{srv.region} • IP: {srv.public_ip}</div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                      ● {srv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[10px]">CPU Cores</div>
                      <div className="font-bold text-white text-sm mt-0.5">{srv.cpu_cores} vCPU</div>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[10px]">RAM Capacity</div>
                      <div className="font-bold text-white text-sm mt-0.5">{srv.ram_total_mb / 1024} GB</div>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[10px]">Disk Space</div>
                      <div className="font-bold text-white text-sm mt-0.5">{srv.disk_total_gb} GB</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span>Active Containers: <strong>{srv.hosted_apps_count || 0}</strong></span>
                    <span>Engine: <strong className="uppercase">{srv.deployment_engine}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAN & TRIAL CONFIGURATOR TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Dynamic Hosting Tiers & Free Trial Configurator</h3>
              <p className="text-xs text-slate-400">Adjust the Free Trial duration (e.g. 60 or 90 days), storage limits, and monthly prices.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {plans.map((p) => (
                <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      {p.is_trial && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold uppercase">
                          Free Trial Tier
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Price: <strong className="text-white">{p.price_rwf === 0 ? 'FREE' : `${p.price_rwf.toLocaleString()} RWF/mo`}</strong> • Storage: <strong className="text-white">{p.storage_gb} GB</strong> • Max DBs: <strong className="text-white">{p.max_databases === -1 ? 'Unlimited' : p.max_databases}</strong>
                    </div>
                    {p.is_trial && (
                      <div className="text-xs text-purple-300 mt-0.5">
                        Trial Duration: <strong>{p.trial_duration_days} Days</strong>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingPlan(p);
                      setPlanPrice(p.price_rwf);
                      setPlanTrialDays(p.trial_duration_days || 60);
                      setPlanStorageGb(p.storage_gb);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit Tier</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ADD SERVER MODAL */}
      {showAddServerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Register VPS Server</h3>
              <button onClick={() => setShowAddServerModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddServerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Server Name</label>
                <input
                  type="text"
                  required
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. VPS Node 2 (Frankfurt)"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Public IP Address</label>
                  <input
                    type="text"
                    required
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    placeholder="194.xxx.xxx.xxx"
                    className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Provider</label>
                  <input
                    type="text"
                    value={serverProvider}
                    onChange={(e) => setServerProvider(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coolify API URL</label>
                <input
                  type="url"
                  value={serverCoolifyUrl}
                  onChange={(e) => setServerCoolifyUrl(e.target.value)}
                  placeholder="http://194.xxx.xxx.xxx:8000"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coolify API Bearer Token</label>
                <input
                  type="password"
                  value={serverCoolifyToken}
                  onChange={(e) => setServerCoolifyToken(e.target.value)}
                  placeholder="Bearer token from Coolify security settings"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddServerModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingServer}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white disabled:opacity-50"
                >
                  {addingServer ? 'Registering...' : 'Register Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Edit Plan: {editingPlan.name}</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Price (RWF)</label>
                <input
                  type="number"
                  required
                  value={planPrice}
                  onChange={(e) => setPlanPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {editingPlan.is_trial && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trial Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min={7}
                    max={365}
                    value={planTrialDays}
                    onChange={(e) => setPlanTrialDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SSD Storage Allowance (GB)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={planStorageGb}
                  onChange={(e) => setPlanStorageGb(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white disabled:opacity-50"
                >
                  {savingPlan ? 'Saving...' : 'Save Plan Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* PROOF SCREENSHOT LIGHTBOX MODAL */}
      {viewingProofUrl && (
        <div
          onClick={() => setViewingProofUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121620] border border-white/10 rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <h4 className="font-bold text-sm text-white">Payment Proof Screenshot</h4>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/60 rounded-xl p-2">
              <img
                src={viewingProofUrl}
                alt="Uploaded Payment Receipt"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
