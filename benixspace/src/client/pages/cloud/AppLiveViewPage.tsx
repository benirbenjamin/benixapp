import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Globe,
  Terminal,
  RotateCw,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Activity,
  Sparkles,
  Maximize2
} from 'lucide-react';

export const AppLiveViewPage: React.FC = () => {
  const { appName, deploymentId } = useParams<{ appName?: string; deploymentId?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployment, setDeployment] = useState<any>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showLogs, setShowLogs] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const fetchApp = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = appName
        ? `/api/cloud/deployments/by-name/${encodeURIComponent(appName)}`
        : `/api/cloud/deployments/${encodeURIComponent(deploymentId || '')}`;
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success && json.deployment) {
        setDeployment(json.deployment);
      } else {
        setError(json.error || 'Application not found or is currently stopped.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to application runtime.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [appName, deploymentId]);

  const handleReloadFrame = () => {
    setIframeKey((k) => k + 1);
  };

  const getContainerWidth = () => {
    if (deviceView === 'mobile') return 'max-w-[420px] mx-auto';
    if (deviceView === 'tablet') return 'max-w-[820px] mx-auto';
    return 'w-full';
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-white">
        <RotateCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <h2 className="text-base font-bold">Connecting to Cloud Application Runtime...</h2>
        <p className="text-xs text-slate-400 mt-1">Booting edge proxy routing & container stream</p>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-[#121620] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Application Offline or Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || `No running deployment found for "${appName}".`}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/cloud/dashboard"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={fetchApp}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rawAppUrl = `/api/cloud/deployments/by-name/${encodeURIComponent(deployment.name)}/raw-app`;

  return (
    <div className="flex-1 bg-[#0a0d14] text-white flex flex-col overflow-hidden">
      {/* TOP APPLICATION RUNNER CONTROL BAR */}
      <header className="bg-[#10141e]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/cloud/dashboard"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Return to Cloud Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs uppercase">
              {deployment.name.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-white tracking-wide">{deployment.name}</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>RUNNING</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono">
                  PORT {deployment.internalPort || 3000}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{deployment.framework?.toUpperCase()} Runtime</span>
                {deployment.gitRepoUrl && (
                  <>
                    <span>•</span>
                    <a
                      href={deployment.gitRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-sky-400 transition inline-flex items-center gap-1"
                    >
                      <span>Branch: {deployment.gitBranch || 'main'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Device Viewport Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setDeviceView('desktop')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              deviceView === 'desktop' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop 100%"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDeviceView('tablet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              deviceView === 'tablet' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setDeviceView('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              deviceView === 'mobile' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile 390px"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={rawAppUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition"
            title="Launch application full-screen in a separate browser tab"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Fullscreen</span>
          </a>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
              showLogs ? 'bg-white/15 border-white/20 text-white' : 'bg-black/30 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Console Logs</span>
          </button>

          <button
            onClick={handleReloadFrame}
            className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 text-slate-300 hover:text-white transition"
            title="Reload Application Frame"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* SUBDOMAIN DNS NOTICE BANNER */}
      <div className="bg-sky-950/40 border-b border-sky-500/20 px-4 py-2 text-xs text-sky-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Direct Benix Space URL: <strong className="text-white">https://benix.space/apps/{deployment.name}</strong> (Resolves instantly).
          </span>
        </div>
        <div className="text-[11px] text-sky-300/80">
          To enable <strong>https://{deployment.assignedSubdomain || `${deployment.name}.apps.benix.space`}</strong>, add wildcard CNAME <code>*.apps</code> pointing to <code>benix.space</code> in your DNS registrar.
        </div>
      </div>

      {/* LIVE APPLICATION STAGE (PURE APPLICATION RENDERING) */}
      <main className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 overflow-hidden w-full">
        <div className={`transition-all duration-300 ${getContainerWidth()} w-full h-[calc(100vh-175px)] min-h-[580px] flex flex-col`}>
          {/* Real Application Browser Chrome */}
          <div className="bg-[#121620] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Browser Header Bar */}
            <div className="bg-[#161c28] border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              <div className="flex-1 max-w-xl mx-auto bg-black/50 border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-semibold">https://</span>
                <span className="text-white font-medium truncate">benix.space/apps/{deployment.name}</span>
                <span className="ml-auto text-emerald-400 font-sans text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-500/10 rounded">LIVE APP</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={rawAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                  title="Open live web app without container wrapper"
                >
                  <span>Raw View</span>
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                </a>
              </div>
            </div>

            {/* REAL RUNNING APPLICATION VIEWPORT */}
            <div className="flex-1 relative bg-black">
              <iframe
                key={iframeKey}
                src={rawAppUrl}
                title={deployment.name}
                className="w-full h-full border-0 bg-slate-950"
                allow="clipboard-read; clipboard-write; fullscreen"
              />
            </div>
          </div>
        </div>
      </main>

      {/* LIVE CONSOLE LOGS DRAWER */}
      {showLogs && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d111a]/98 backdrop-blur-xl border-t border-white/15 p-4 shadow-2xl max-h-72 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h4 className="font-bold text-xs text-white">Application Runtime Stdout & Stderr</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Container Active
              </span>
            </div>
            <button
              onClick={() => setShowLogs(false)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white transition"
            >
              Close Drawer
            </button>
          </div>
          <pre className="p-3 bg-black/80 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap flex-1 overflow-y-auto leading-relaxed">
            {deployment.lastLogs || 'No logs recorded.'}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AppLiveViewPage;
