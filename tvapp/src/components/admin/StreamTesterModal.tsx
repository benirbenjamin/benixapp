import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Play, RefreshCw, X, Radio } from 'lucide-react';
import { testStreamDiagnostic } from '../../services/api';

interface StreamTesterModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export const StreamTesterModal: React.FC<StreamTesterModalProps> = ({ url, name, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testedOnce, setTestedOnce] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const diag = await testStreamDiagnostic(url);
      setResult(diag);
      setTestedOnce(true);
    } catch (e: any) {
      setResult({
        reachable: false,
        error: e.message || 'Network request failed',
        message: '✕ Stream test request failed',
      });
      setTestedOnce(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runTest();
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rba-blue" />
            <h3 className="font-extrabold text-slate-900 text-lg">Stream Diagnostic Test</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Station Name</span>
            <span className="font-bold text-slate-900">{name}</span>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Target Stream URL</span>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all select-all">
              {url}
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-rba-blue animate-spin mb-2" />
              <p className="text-xs font-semibold text-slate-600">Pinging stream server and inspecting headers...</p>
            </div>
          ) : result ? (
            <div className="space-y-3 pt-2">
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  result.reachable
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {result.reachable ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {result.reachable ? 'Stream Server Online' : 'Stream Connection Failed'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{result.message}</p>
                </div>
              </div>

              {/* Technical breakdown */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">HTTP Status:</span>
                  <span className="font-mono font-bold">{result.status || 'Connection Error'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Content-Type:</span>
                  <span className="font-mono">{result.contentType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Detected Format:</span>
                  <span className="font-bold text-rba-blue">{result.detectedFormat || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Response Time:</span>
                  <span>{result.responseTimeMs ? `${result.responseTimeMs} ms` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Browser Playback:</span>
                  <span className="font-semibold text-emerald-700">
                    {result.reachable ? '✓ Supported natively / HLS' : '✕ Offline'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={runTest}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-test Stream
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-rba-navy text-white hover:bg-rba-blue font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
