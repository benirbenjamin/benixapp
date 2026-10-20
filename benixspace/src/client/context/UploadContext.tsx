import React, { createContext, useContext, useState, useCallback } from 'react';
import { notificationSound } from '../utils/notificationSound';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

export interface UploadTask {
  id: string;
  title: string;
  type: 'story' | 'video' | 'media';
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadContextType {
  activeUploads: UploadTask[];
  startUpload: (
    title: string,
    type: 'story' | 'video' | 'media',
    taskFn: (updateProgress: (p: number) => void) => Promise<any>
  ) => Promise<any>;
  dismissUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUploads, setActiveUploads] = useState<UploadTask[]>([]);

  const dismissUpload = useCallback((id: string) => {
    setActiveUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const startUpload = useCallback(
    async (
      title: string,
      type: 'story' | 'video' | 'media',
      taskFn: (updateProgress: (p: number) => void) => Promise<any>
    ) => {
      const id = `upl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const newTask: UploadTask = {
        id,
        title,
        type,
        progress: 5,
        status: 'uploading'
      };

      setActiveUploads((prev) => [...prev, newTask]);

      const updateProgress = (p: number) => {
        setActiveUploads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, progress: Math.min(99, Math.max(t.progress, p)) } : t))
        );
      };

      try {
        const result = await taskFn(updateProgress);
        setActiveUploads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, progress: 100, status: 'completed' } : t))
        );
        notificationSound.playNotificationChime();
        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          dismissUpload(id);
        }, 6000);
        return result;
      } catch (err: any) {
        setActiveUploads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: 'error', error: err?.message || 'Upload failed' } : t))
        );
        throw err;
      }
    },
    [dismissUpload]
  );

  return (
    <UploadContext.Provider value={{ activeUploads, startUpload, dismissUpload }}>
      {children}
      {/* Global Floating Background Upload Banner */}
      {activeUploads.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {activeUploads.map((task) => (
            <div
              key={task.id}
              className="pointer-events-auto bg-[#0F1420]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-white font-sans animate-in slide-in-from-bottom duration-300"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {task.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
                  {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {task.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span className="text-xs font-bold truncate">
                    {task.status === 'uploading'
                      ? `Uploading: ${task.title}`
                      : task.status === 'completed'
                      ? `Uploaded: ${task.title}`
                      : `Upload failed: ${task.title}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">
                    {task.status === 'uploading' ? `${task.progress}%` : task.status === 'completed' ? '100%' : 'Error'}
                  </span>
                  <button
                    onClick={() => dismissUpload(task.id)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    task.status === 'completed'
                      ? 'bg-emerald-500'
                      : task.status === 'error'
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>

              {task.status === 'uploading' && (
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>Uploading in background...</span>
                  <span className="text-blue-400">You can keep browsing</span>
                </p>
              )}
              {task.status === 'completed' && (
                <p className="text-[10px] text-emerald-400 mt-1.5 font-semibold">
                  Published and live across Benix.Space!
                </p>
              )}
              {task.status === 'error' && (
                <p className="text-[10px] text-rose-400 mt-1.5">{task.error || 'Please retry upload.'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};
