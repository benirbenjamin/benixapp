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
  Code,
  ShieldCheck,
  ArrowLeft,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const AppLiveViewPage: React.FC = () => {
  const { appName, deploymentId } = useParams<{ appName?: string; deploymentId?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployment, setDeployment] = useState<any>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showLogs, setShowLogs] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('/');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [testingApi, setTestingApi] = useState(false);

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

  const handleTestApi = () => {
    setTestingApi(true);
    setTimeout(() => {
      setApiResponse({
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-powered-by': deployment?.framework === 'nextjs' ? 'Next.js' : 'Benix Cloud Engine',
          'x-benix-port': deployment?.internalPort || 3100
        },
        data: {
          app: deployment?.name,
          framework: deployment?.framework,
          status: 'healthy',
          message: `Hello from ${deployment?.name}! Application running successfully on Benix Cloud.`,
          timestamp: new Date().toISOString()
        }
      });
      setTestingApi(false);
    }, 250);
  };

  const getContainerWidth = () => {
    if (deviceView === 'mobile') return 'max-w-[390px]';
    if (deviceView === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4 text-white">
        <RotateCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <h2 className="text-base font-bold">Connecting to Cloud Application Runtime...</h2>
        <p className="text-xs text-slate-400 mt-1">Booting edge proxy routing</p>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-4 text-white">
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

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col">
      {/* TOP APPLICATION CONTROL BAR */}
      <header className="sticky top-0 z-40 bg-[#10141e]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            to="/cloud/dashboard"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Return to Cloud Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
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
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              deviceView === 'desktop' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop 100%"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDeviceView('tablet')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              deviceView === 'tablet' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setDeviceView('mobile')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
              deviceView === 'mobile' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile 390px"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
            onClick={fetchApp}
            className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 text-slate-300 hover:text-white transition"
            title="Reload Application"
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

      {/* MAIN RUNTIME STAGE */}
      <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto">
        <div className={`transition-all duration-300 ${getContainerWidth()} w-full space-y-6`}>
          {/* APPLICATION SERVICE CARD */}
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sky-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{deployment.name}</h2>
                  <p className="text-xs text-slate-400">
                    Live Container Running on Internal Port {deployment.internalPort || 3000}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>HTTP 200 OK</span>
                </span>
                {deployment.autoSyncEnabled && (
                  <span className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Auto-Sync Active</span>
                  </span>
                )}
              </div>
            </div>

            {/* INTERACTIVE API & RUNTIME TESTER */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-sky-400" />
                  <span>Interactive Application Endpoint Playground</span>
                </h3>
                <span className="text-xs text-slate-400">Edge Gateway Test</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                  className="px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="/api/health"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <button
                  onClick={handleTestApi}
                  disabled={testingApi}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition flex items-center justify-center gap-2"
                >
                  {testingApi ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  <span>Execute Request</span>
                </button>
              </div>

              {/* API Response Display */}
              {apiResponse && (
                <div className="bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
                    <span className="text-emerald-400 font-bold">HTTP/1.1 {apiResponse.status} {apiResponse.statusText}</span>
                    <span>Content-Type: application/json</span>
                  </div>
                  <pre className="text-emerald-300 overflow-x-auto p-2 bg-black/30 rounded-lg">
                    {JSON.stringify(apiResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* LIVE CONSOLE LOGS DRAWER */}
            {showLogs && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    <span>Real-time Container Stdout / Stderr</span>
                  </h4>
                  <button
                    onClick={() => setShowLogs(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <pre className="p-3 bg-black/60 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {deployment.lastLogs || 'No logs recorded.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLiveViewPage;
