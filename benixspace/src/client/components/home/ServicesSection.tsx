import React from 'react';
import {
  Code, TrendingUp, Share2, Music, Video,
  Radio, Camera, Sliders, CheckCircle2
} from 'lucide-react';
import { YoutubeIcon } from '../common/SocialIcons';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: Code,
      title: 'Software & Web Development',
      description: 'Websites, web applications, custom management platforms, streaming portals, and productivity utility apps.',
      features: ['Web Applications', 'Business Platforms', 'Streaming Portals', 'Custom APIs']
    },
    {
      icon: TrendingUp,
      title: 'Digital Marketing & SEO',
      description: 'Search engine optimization, keyword strategy, social media advertising, and online brand promotion.',
      features: ['Search Optimization', 'Content Strategy', 'Digital Ads', 'Brand Visibility']
    },
    {
      icon: Share2,
      title: 'Social Media Management',
      description: 'Full account growth management, promotional campaigns, audience engagement, and visibility strategy.',
      features: ['Account Growth', 'Content Publishing', 'Campaigns', 'Social Strategy']
    },
    {
      icon: YoutubeIcon,
      title: 'YouTube Services',
      description: 'YouTube channel creation, video metadata optimization, publishing strategies, and subscriber growth.',
      features: ['Channel Creation', 'Video Publishing', 'Growth Strategy', 'Channel Audit']
    },
    {
      icon: Music,
      title: 'Audio & Music Production',
      description: 'Professional music recording, audio mixing, studio mastering, and gospel/commercial music projects.',
      features: ['Studio Recording', 'Audio Mixing', 'Gospel Projects', 'Sound Design']
    },
    {
      icon: Video,
      title: 'Video Production',
      description: 'High-quality promotional videos, social media video reels, event coverage, and music videos.',
      features: ['Promotional Videos', 'Social Media Reels', 'Event Coverage', 'Editing']
    },
    {
      icon: Radio,
      title: 'Music Distribution',
      description: 'Worldwide music distribution to major streaming platforms including Spotify, Deezer, Boomplay, and Apple Music.',
      features: ['Spotify & Deezer', 'Boomplay', 'Apple Music', 'Copyright Protection']
    },
    {
      icon: Camera,
      title: 'Photography & Graphic Design',
      description: 'Event photography, promotional artwork, digital flyers, logo creation, and corporate visual branding.',
      features: ['Event Photography', 'Graphic Flyers', 'Digital Branding', 'Logo Design']
    },
    {
      icon: Sliders,
      title: 'Musical Instruments Assistance',
      description: 'Helping musicians, churches, and studios source, select, and purchase quality musical instruments from verified vendors.',
      features: ['Instrument Sourcing', 'Vendor Connection', 'Quality Inspection', 'Consultation']
    },
  ];

  return (
    <section className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/80 px-4 py-1.5 rounded-full border border-sky-200">
            What We Do
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            NebeluRw Co. Ltd Digital Services
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            We combine software engineering, media production, and digital growth strategies to help organizations, artists, and businesses thrive online.
          </p>
        </div>

        {/* Services 3x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="glass-card rounded-3xl p-8 border border-slate-200/80 hover:border-sky-300 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                  {service.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
