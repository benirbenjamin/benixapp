import React from 'react';
import { ExternalLink, CheckCircle2, Image as ImageIcon, Copy, X } from 'lucide-react';

export function PostimagesGuideModal({
  isOpen,
  onClose,
  title = "How to Host & Add an Image",
  subject = "image",
  description = null
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <ImageIcon className="w-6 h-6" />
            <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow steps */}
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <p className="text-xs text-slate-500">
            {description || (
              <>
                To keep your station fast and reliable without bloating the database, {subject}s can be hosted for free on <strong>Postimages.org</strong>. Follow these 5 easy steps:
              </>
            )}
          </p>

          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-semibold text-slate-800">Open Postimages</p>
                <p className="text-xs text-slate-500">Click the button below to open Postimages.org in a new tab.</p>
                <a
                  href="https://postimages.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <span>Open Postimages.org</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-semibold text-slate-800">Upload your image</p>
                <p className="text-xs text-slate-500">Choose your image file from your computer or phone and upload it.</p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-semibold text-slate-800">Copy the "Direct Link"</p>
                <p className="text-xs text-slate-500">
                  After uploading, look for the box titled <strong className="text-indigo-600 font-bold">Direct Link</strong> (ends in .jpg, .png, etc.) and click Copy.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex-shrink-0 mt-0.5">4</span>
              <div>
                <p className="font-semibold text-slate-800">Paste into Image URL field</p>
                <p className="text-xs text-slate-500">Paste the copied URL into the article's "Image URL" field.</p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex-shrink-0 mt-0.5">5</span>
              <div>
                <p className="font-semibold text-slate-800">Preview & Publish</p>
                <p className="text-xs text-slate-500">You will immediately see the live image preview below the input box. Then save your article!</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Got it!
          </button>
        </div>

      </div>
    </div>
  );
}
