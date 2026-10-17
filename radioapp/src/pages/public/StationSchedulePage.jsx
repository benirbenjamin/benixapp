import React, { useState } from 'react';
import { useStation } from '../../context/StationContext';
import { ThemeProvider } from '../../components/themes/ThemeProvider';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PersistentPlayerBar } from '../../components/player/PersistentPlayerBar';
import { Calendar, Clock, User, Mic, Sparkles } from 'lucide-react';

export function StationSchedulePage() {
  const { station, branding, programs, nowOnAir } = useStation();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Determine today's day of week
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(todayName);

  // Filter programs for selectedDay
  const filteredPrograms = programs.filter(p => {
    if (p.status !== 'active') return false;
    let days = [];
    try {
      days = typeof p.days_of_week === 'string' ? JSON.parse(p.days_of_week) : p.days_of_week;
    } catch (e) {
      days = [];
    }
    return Array.isArray(days) && days.includes(selectedDay);
  }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  return (
    <ThemeProvider branding={branding}>
      <div className="min-h-screen flex flex-col justify-between">
        <div>
          <PublicNavbar />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">
                Broadcast Schedule
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-color)] tracking-tight">
                Weekly Show Timetable
              </h1>
              <p className="text-sm sm:text-base text-[var(--muted-color)]">
                Tune in to your favorite presenters and shows on {station?.name}.
              </p>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {daysOfWeek.map((day) => {
                const isSelected = selectedDay === day;
                const isToday = todayName === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex-shrink-0 transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[var(--primary-color)] text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{day}</span>
                    {isToday && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'}`}>
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Program Timeline Cards */}
            {filteredPrograms.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-[var(--surface-color)] border border-slate-200 p-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-color)]">No scheduled shows for {selectedDay}</h3>
                <p className="text-xs text-[var(--muted-color)] mt-1">Our automated 24/7 non-stop music broadcast is active.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {filteredPrograms.map((prog) => {
                  const isOnAirNow = nowOnAir?.id === prog.id && todayName === selectedDay;

                  return (
                    <div
                      key={prog.id}
                      className={`relative rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-200 border ${
                        isOnAirNow
                          ? 'bg-gradient-to-r from-red-500/10 via-slate-50 to-transparent border-red-300 shadow-md ring-1 ring-red-200'
                          : 'bg-[var(--surface-color)] border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-5 min-w-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0 relative">
                          {prog.image_url ? (
                            <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white">
                              <Mic className="w-8 h-8" />
                            </div>
                          )}
                          {isOnAirNow && (
                            <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-red-600 border-2 border-white animate-ping"></span>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--primary-color)]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{prog.start_time} - {prog.end_time}</span>
                            </span>

                            {isOnAirNow && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider animate-pulse">
                                Live On Air Now
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg sm:text-xl font-black text-[var(--text-color)]">
                            {prog.title}
                          </h3>

                          <p className="text-xs sm:text-sm font-semibold text-[var(--primary-color)] flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>Host: {prog.presenter}</span>
                          </p>

                          {prog.description && (
                            <p className="text-xs text-[var(--muted-color)] leading-relaxed pt-1">
                              {prog.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        <PublicFooter />
        <PersistentPlayerBar />
      </div>
    </ThemeProvider>
  );
}
