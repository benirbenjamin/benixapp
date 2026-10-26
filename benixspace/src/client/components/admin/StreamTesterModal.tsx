import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Play, RefreshCw, X, Radio, Activity, Zap } from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface StreamTesterModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export const StreamTesterModal: React.FC<StreamTesterModalProps> = ({ url, name, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/stations/test-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({
        reachable: false,
        error: e.message || 'Network request failed',
        message: '✕ Stream test request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#131926] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h3 className="font-black text-white text-base">Stream Live Diagnostic</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Station Info */}
        <div className="space-y-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Station</span>
            <span className="font-black text-white text-sm">{name}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Target Stream URL</span>
            <div className="p-2.5 bg-[#0B0E14] rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 break-all select-all">
              {url}
            </div>
          </div>
        </div>

        {/* Test Result or Loader */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-xs font-bold text-slate-300">Pinging stream server and inspecting protocol headers...</p>
          </div>
        ) : result ? (
          <div className="space-y-3 pt-1">
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                result.reachable
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {result.reachable ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-black text-sm">
                  {result.reachable ? 'Stream Server Online' : 'Stream Connection Failed'}
                </h4>
                <p className="text-xs mt-0.5 opacity-90">{result.message}</p>
              </div>
            </div>

            {/* Technical Diagnostic Details */}
            <div className="bg-[#0B0E14] p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">HTTP Status:</span>
                <span className="font-mono font-bold text-white">{result.status || 'Connection Error'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latency:</span>
                <span className="font-mono font-bold text-amber-400">{result.latencyMs ? `${result.latencyMs} ms` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Detected Format:</span>
                <span className="font-mono font-bold text-blue-400">{result.detectedFormat || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MIME Content-Type:</span>
                <span className="font-mono font-bold text-slate-300 truncate max-w-[200px]">{result.contentType || 'N/A'}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={runTest}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Test Stream</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
