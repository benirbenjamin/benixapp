import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RotateCw, AlertCircle, ArrowLeft } from 'lucide-react';

export const AppLiveViewPage: React.FC = () => {
  const { appName, deploymentId } = useParams<{ appName?: string; deploymentId?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployment, setDeployment] = useState<any>(null);
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
        if (json.deployment.name) {
          document.title = `${json.deployment.name}`;
        }
      } else {
        setError(json.error || `Application "${appName || deploymentId}" not found or is currently stopped.`);
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

  useEffect(() => {
    if (deployment?.name) {
      document.title = `${deployment.name}`;
    }
  }, [deployment]);

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#0a0d14] flex flex-col items-center justify-center p-4 text-white z-50">
        <RotateCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <h2 className="text-base font-bold">Launching {appName || 'Application'}...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Benix Cloud edge proxy</p>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#0a0d14] flex flex-col items-center justify-center p-4 text-white z-50">
        <div className="bg-[#121620] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Application Offline or Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || `No running deployment found for "${appName || deploymentId}".`}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Benix Space</span>
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

  const rawAppUrl = deployment?.name
    ? `/api/cloud/deployments/by-name/${encodeURIComponent(deployment.name)}/raw-app`
    : `/api/cloud/deployments/${encodeURIComponent(deploymentId || '')}/raw-app`;

  return (
    <div className="fixed inset-0 w-screen h-screen m-0 p-0 border-0 overflow-hidden bg-[#0a0d14] z-50">
      {/* 100% Fullscreen Independent Web App Frame - No Embedding Chrome */}
      <iframe
        key={iframeKey}
        src={rawAppUrl}
        title={deployment?.name || 'Benix Space App'}
        className="w-full h-full border-0 block m-0 p-0 bg-[#0a0d14]"
        allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; popups; popups-to-escape-sandbox; screen-wake-lock; web-share"
      />

      {/* Subtle Floating Benix Space Portal Badge */}
      <div className="fixed bottom-3 right-3 z-50 opacity-20 hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-1 bg-black/85 border border-white/15 rounded-full p-1 backdrop-blur-md shadow-2xl">
          <Link
            to="/"
            className="px-2.5 py-0.5 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 no-underline transition"
            title="Benix Space Platform"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>benix.space</span>
          </Link>
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Reload App"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppLiveViewPage;
