import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ServicesSection } from '../components/home/ServicesSection';
import { SeoHead } from '../components/common/SeoHead';
import { AdSenseUnit } from '../components/common/AdSenseUnit';
import { trackPageView } from '../analytics/tracker';
import { ArrowRight, Phone, Mail } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  useEffect(() => {
    trackPageView(window.location.href, 'services');
  }, []);

  return (
    <>
      <SeoHead
        title="Services — NebeluRw Co. Ltd Technology & Digital Solutions"
        description="Discover NebeluRw services: Web Development, Digital Marketing, SEO, Social Media, YouTube Growth, Audio/Music Production, Video Production, and Music Distribution."
      />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/80 px-4 py-1.5 rounded-full border border-sky-200">
              NebeluRw Capabilities
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Technology & Media Digital Services
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Empowering organizations, startups, and artists with custom software solutions, digital streaming platforms, audio-visual production, and growth strategies.
            </p>
          </div>

          <ServicesSection />

          {/* Consultation CTA */}
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl text-center max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Need a Custom Web Application or Digital Service?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
              Contact Benir Benjamin at NebeluRw Co. Ltd to discuss your software project, streaming portal, or marketing strategy.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-all"
              >
                <span>Request a Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="tel:0783987223"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-slate-800 font-semibold text-sm border border-slate-200 shadow-sm hover:bg-slate-100 transition-all"
              >
                <Phone className="w-4 h-4 text-sky-600" />
                <span>Call 0783987223</span>
              </a>
            </div>
          </div>

          {/* AdSense Unit */}
          <div className="pt-4">
            <AdSenseUnit className="w-full" />
          </div>

        </div>
      </div>
    </>
  );
};
