// Calculate Now On Air and Coming Next from a list of program records
export function calculateOnAirPrograms(programs, timezone = 'Africa/Kigali') {
  if (!programs || programs.length === 0) {
    return { nowOnAir: null, comingNext: null };
  }

  // Determine current day of week and time in station's timezone
  let now;
  try {
    const nowString = new Date().toLocaleString('en-US', { timeZone: timezone });
    now = new Date(nowString);
  } catch (e) {
    now = new Date();
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter active programs that broadcast on currentDay
  const todaysPrograms = programs.filter(p => {
    if (p.status !== 'active') return false;
    let days = [];
    try {
      days = typeof p.days_of_week === 'string' ? JSON.parse(p.days_of_week) : p.days_of_week;
    } catch (e) {
      days = [];
    }
    return Array.isArray(days) && days.includes(currentDay);
  });

  const parseMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  let nowOnAir = null;
  let comingNext = null;

  // Find program currently on air
  for (const prog of todaysPrograms) {
    const startM = parseMinutes(prog.start_time);
    let endM = parseMinutes(prog.end_time);

    // Overnight show (e.g. 22:00 to 02:00)
    if (endM < startM) {
      if (currentMinutes >= startM || currentMinutes < endM) {
        nowOnAir = prog;
        break;
      }
    } else {
      if (currentMinutes >= startM && currentMinutes < endM) {
        nowOnAir = prog;
        break;
      }
    }
  }

  // Find next upcoming show today
  const upcomingToday = todaysPrograms
    .map(p => ({ ...p, startM: parseMinutes(p.start_time) }))
    .filter(p => p.startM > currentMinutes)
    .sort((a, b) => a.startM - b.startM);

  if (upcomingToday.length > 0) {
    comingNext = upcomingToday[0];
  } else if (todaysPrograms.length > 0) {
    // Wrap around to earliest show of tomorrow or today
    comingNext = todaysPrograms.sort((a, b) => parseMinutes(a.start_time) - parseMinutes(b.start_time))[0];
  }

  // If no show on air right now, fallback to default or upcoming
  if (!nowOnAir && todaysPrograms.length > 0) {
    nowOnAir = todaysPrograms[0];
  }

  return { nowOnAir, comingNext };
}
