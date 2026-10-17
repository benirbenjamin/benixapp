import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Tv, Radio, ShoppingBag, Newspaper, ExternalLink, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'tv': return <Tv className="w-4 h-4 text-sky-500" />;
      case 'radio': return <Radio className="w-4 h-4 text-emerald-500" />;
      case 'marketplace': return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      default: return <Newspaper className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[75vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search TV videos, radio stations, products, articles..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1">
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {loading && (
            <div className="text-center py-8 text-xs text-slate-400 animate-pulse">
              Searching unified Benix.Space ecosystem...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No results found for "<span className="text-slate-700 font-semibold">{query}</span>"
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-8 text-xs text-slate-400 space-y-1">
              <div>Type to search across all integrated platforms:</div>
              <div className="text-[11px] text-slate-500">Live TV • Radio Streams • Marketplace • Voxify Music • Calculators</div>
            </div>
          )}

          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => handleSelect(r.url)}
              className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getModuleIcon(r.module)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                      {r.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase shrink-0">
                      {r.category || r.module}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {r.description}
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition-colors shrink-0 ml-2" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
