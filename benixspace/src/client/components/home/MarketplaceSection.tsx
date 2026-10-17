import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Tag, Star, CheckCircle2 } from 'lucide-react';

export const MarketplaceSection: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/modules/marketplace/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});

    fetch('/api/modules/marketplace/services')
      .then((res) => res.json())
      .then((data) => setServices(data.services || []))
      .catch(() => {});
  }, []);

  return (
    <section className="py-12 bg-white border-y border-slate-100 my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 w-fit">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
              Umuguzi Marketplace
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Digital Products & Professional Services
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Pay seamlessly using your Benix.Space wallet
          </div>
        </div>

        {/* Products & Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between bg-slate-50/30"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  Digital Product
                </span>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{p.description || 'Verified product on Umuguzi platform.'}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">
                  {Number(p.price || 0).toLocaleString()} <span className="text-xs text-purple-600 font-bold">RWF</span>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-sm transition-colors">
                  Buy Now
                </button>
              </div>
            </div>
          ))}

          {/* If products are empty, display sample verified services from NebeluRw */}
          {products.length === 0 && (
            [
              { title: 'Full-Stack Software Development', price: '250,000', cat: 'Tech Service' },
              { title: 'Audio Mixing & Music Mastering', price: '45,000', cat: 'Audio Production' },
              { title: 'Search Engine Optimization (SEO)', price: '80,000', cat: 'Marketing' },
              { title: 'Graphic Design & Brand Identity', price: '35,000', cat: 'Creative Design' }
            ].map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    {s.cat}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-500">Verified NebeluRw Co. Ltd service delivery.</p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900">{s.price} <span className="text-xs text-purple-600 font-bold">RWF</span></div>
                  <button className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-purple-600 transition-colors">
                    Book Service
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};
