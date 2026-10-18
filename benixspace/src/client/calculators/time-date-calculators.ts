import { CalculatorDefinition } from './types';

export const TIME_DATE_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'age-calculator',
    slug: 'age-calculator',
    title: 'Age Calculator',
    shortTitle: 'Age',
    category: 'time-date',
    description: 'Calculate your exact age in years, months, days, hours, and minutes based on your date of birth.',
    seoTitle: 'Age Calculator – Calculate Your Exact Age | Benix Space',
    metaDescription: 'Calculate your exact age from your date of birth with Benix Space Easy Calc. Discover age in years, months, days, weeks, and total days lived.',
    keywords: ['age calculator', 'online age calculator', 'calculate age', 'how old am I', 'exact age calculator', 'birthday age calculator'],
    aliases: ['age', 'how old am i', 'birthday', 'years old', 'birth date'],
    formula: 'Age = Target Date - Date of Birth',
    formulaExplanation: 'Decomposes the chronological span between birth date and target date into completed calendar years, months, and remaining days.',
    example: {
      title: 'Born May 15, 1998 on Sept 10, 2026',
      inputs: { birth_date: '1998-05-15', as_of: '2026-09-10' },
      output: '28 years, 3 months, 26 days',
      steps: ['2026 - 1998 = 28 years', 'September - May = 4 months (adjusting for days gives 3 months)', 'Remaining days = 26 days'],
    },
    explanation: 'The Age Calculator provides an exact breakdown of a person’s age in years, months, and days. It accurately accounts for leap years, variable days per calendar month, and time elapsed. You can also view your age expressed entirely in total days, weeks, or hours lived.',
    faqs: [
      {
        question: 'Does the age calculator factor in leap years?',
        answer: 'Yes, leap years (February 29th) are fully factored into the calculation so your total days lived is 100% accurate.',
      },
      {
        question: 'Can I calculate my age on a future date?',
        answer: 'Yes! Simply modify the "Calculate Age As Of" date to any future date to find how old you will be then.',
      },
    ],
    inputs: [
      { id: 'birth_date', label: 'Date of Birth', type: 'date', defaultValue: '1998-05-15' },
      { id: 'as_of', label: 'Calculate Age As Of', type: 'date', defaultValue: '2026-09-10' },
    ],
    calculate: (inputs) => {
      const bStr = String(inputs.birth_date);
      const aStr = String(inputs.as_of);

      if (!bStr) return { primary: { label: 'Result', value: 'Please enter birth date' }, error: 'Please choose your date of birth.' };

      const bDate = new Date(bStr);
      const asOfDate = aStr ? new Date(aStr) : new Date();

      if (isNaN(bDate.getTime()) || isNaN(asOfDate.getTime())) {
        return { primary: { label: 'Result', value: 'Invalid Date' }, error: 'Please enter valid calendar dates.' };
      }

      if (bDate > asOfDate) {
        return { primary: { label: 'Result', value: 'Future Date' }, error: 'Birth date cannot be in the future relative to the target date.' };
      }

      let y = asOfDate.getFullYear() - bDate.getFullYear();
      let m = asOfDate.getMonth() - bDate.getMonth();
      let d = asOfDate.getDate() - bDate.getDate();

      if (d < 0) {
        m -= 1;
        // Days in previous month
        const prevMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 0);
        d += prevMonth.getDate();
      }
      if (m < 0) {
        y -= 1;
        m += 12;
      }

      const diffMs = asOfDate.getTime() - bDate.getTime();
      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(totalDays / 7);
      const totalHours = totalDays * 24;

      // Next birthday countdown
      let nextBday = new Date(asOfDate.getFullYear(), bDate.getMonth(), bDate.getDate());
      if (nextBday < asOfDate) {
        nextBday = new Date(asOfDate.getFullYear() + 1, bDate.getMonth(), bDate.getDate());
      }
      const daysToNextBday = Math.ceil((nextBday.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        primary: { label: 'Your Exact Age', value: `${y} Years, ${m} Months, ${d} Days`, badge: `${y} Years Old` },
        details: [
          { label: 'Total Days Lived', value: totalDays.toLocaleString() },
          { label: 'Total Weeks Lived', value: totalWeeks.toLocaleString() },
          { label: 'Total Hours Lived', value: totalHours.toLocaleString() },
          { label: 'Days to Next Birthday', value: `${daysToNextBday} days` },
        ],
        summary: `You are ${y} years, ${m} months, and ${d} days old. Next birthday in ${daysToNextBday} days!`,
      };
    },
    relatedSlugs: ['date-difference-calculator', 'business-days-calculator', 'time-duration-calculator'],
    isPopular: true,
    isFeatured: true,
  },
  {
    id: 'date-difference-calculator',
    slug: 'date-difference-calculator',
    title: 'Date Difference & Days Between Dates',
    shortTitle: 'Date Difference',
    category: 'time-date',
    description: 'Calculate the total number of days, weeks, months, and years between any two calendar dates.',
    seoTitle: 'Date Difference Calculator – Days Between Dates | Benix Space',
    metaDescription: 'Find the exact number of days, weeks, and months between two dates with Benix Space Easy Calc. Fast, free date duration solver.',
    keywords: ['date difference calculator', 'days between dates', 'date duration', 'how many days between', 'calendar days calculator'],
    formula: 'Difference = |Date2 - Date1| in Days',
    formulaExplanation: 'Subtract the earlier timestamp from the later timestamp and convert milliseconds into days.',
    example: {
      title: 'January 1, 2026 to December 31, 2026',
      inputs: { start_date: '2026-01-01', end_date: '2026-12-31', include_end: true },
      output: '365 Days',
      steps: ['364 days difference + 1 inclusive end day = 365 days (52 weeks and 1 day)'],
    },
    explanation: 'The date difference calculator is essential for planning project milestones, event countdowns, lease agreements, and tracking anniversary milestones.',
    faqs: [
      {
        question: 'Does this tool include the end date in the total count?',
        answer: 'You can toggle the "Include End Date" switch to choose between exclusive and inclusive day counting.',
      },
    ],
    inputs: [
      { id: 'start_date', label: 'Start Date', type: 'date', defaultValue: '2026-01-01' },
      { id: 'end_date', label: 'End Date', type: 'date', defaultValue: '2026-12-31' },
      { id: 'include_end', label: 'Include End Day in Count (+1 day)', type: 'select', defaultValue: 'no', options: [{ label: 'No (Exclusive)', value: 'no' }, { label: 'Yes (Inclusive)', value: 'yes' }] },
    ],
    calculate: (inputs) => {
      const s = String(inputs.start_date);
      const e = String(inputs.end_date);
      const inc = inputs.include_end === 'yes';

      if (!s || !e) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please choose both start and end dates.' };

      const d1 = new Date(s);
      const d2 = new Date(e);

      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return { primary: { label: 'Result', value: 'Invalid Date' }, error: 'Please enter valid dates.' };

      let diffMs = Math.abs(d2.getTime() - d1.getTime());
      let days = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (inc) days += 1;

      const weeks = Math.floor(days / 7);
      const remDays = days % 7;
      const hours = days * 24;

      return {
        primary: { label: 'Total Duration', value: `${days} Days`, unit: inc ? '(Inclusive)' : '' },
        details: [
          { label: 'In Weeks and Days', value: `${weeks} weeks, ${remDays} days` },
          { label: 'Total Hours', value: `${hours.toLocaleString()} hours` },
          { label: 'Percentage of Year', value: `${((days / 365) * 100).toFixed(1)}%` },
        ],
        summary: `There are ${days} days between ${s} and ${e}.`,
      };
    },
    relatedSlugs: ['age-calculator', 'business-days-calculator', 'time-duration-calculator'],
    isPopular: true,
  },
  {
    id: 'business-days-calculator',
    slug: 'business-days-calculator',
    title: 'Business Days Calculator',
    shortTitle: 'Business Days',
    category: 'time-date',
    description: 'Calculate working business days (excluding Saturdays and Sundays) between two dates.',
    seoTitle: 'Business Days Calculator – Working Days Between Dates | Benix Space',
    metaDescription: 'Free business days calculator. Calculate working days between two calendar dates, excluding weekends.',
    keywords: ['business days calculator', 'working days calculator', 'work days between dates', 'business calendar'],
    formula: 'Working Days = Total Days - Saturdays - Sundays',
    formulaExplanation: 'Iterates through the date range counting Monday through Friday.',
    example: {
      title: 'Monday to Next Friday',
      inputs: { start: '2026-09-01', end: '2026-09-15' },
      output: '11 Working Days',
      steps: ['Total days: 15', 'Weekend days: 4', 'Work days: 11'],
    },
    explanation: 'Business days calculations are necessary in project management, contract delivery deadlines, shipping timelines, legal turnaround windows, and employee payroll tracking.',
    faqs: [
      {
        question: 'Are public bank holidays excluded?',
        answer: 'This standard calculator excludes Saturdays and Sundays. Specific public holidays vary by jurisdiction.',
      },
    ],
    inputs: [
      { id: 'start_date', label: 'Start Date', type: 'date', defaultValue: '2026-09-01' },
      { id: 'end_date', label: 'End Date', type: 'date', defaultValue: '2026-09-30' },
    ],
    calculate: (inputs) => {
      const s = String(inputs.start_date);
      const e = String(inputs.end_date);
      if (!s || !e) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please choose both dates.' };

      let cur = new Date(s);
      const end = new Date(e);
      if (cur > end) {
        const temp = cur;
        cur = end;
        end.setTime(temp.getTime());
      }

      let workDays = 0;
      let weekendDays = 0;

      while (cur <= end) {
        const day = cur.getDay();
        if (day === 0 || day === 6) {
          weekendDays++;
        } else {
          workDays++;
        }
        cur.setDate(cur.getDate() + 1);
      }

      return {
        primary: { label: 'Working Business Days', value: `${workDays} Days` },
        details: [
          { label: 'Weekend Days (Sat & Sun)', value: `${weekendDays} days` },
          { label: 'Total Calendar Days', value: `${workDays + weekendDays} days` },
          { label: 'Estimated Work Hours (8h/day)', value: `${workDays * 8} hours` },
        ],
        summary: `Between the selected dates, there are ${workDays} business days.`,
      };
    },
    relatedSlugs: ['date-difference-calculator', 'work-hours-calculator', 'age-calculator'],
  },
  {
    id: 'time-duration-calculator',
    slug: 'time-duration-calculator',
    title: 'Time Duration & Difference Calculator',
    shortTitle: 'Time Duration',
    category: 'time-date',
    description: 'Calculate time elapsed between two clock times (hours and minutes), or add and subtract time durations.',
    seoTitle: 'Time Duration Calculator – Hours and Minutes Difference | Benix Space',
    metaDescription: 'Calculate elapsed time between two clock times. Fast, free online hours and minutes calculator with decimal conversion.',
    keywords: ['time duration calculator', 'time difference calculator', 'hours between times', 'clock calculator'],
    formula: 'Duration = End Time - Start Time (mod 24h)',
    formulaExplanation: 'Converts both times to minutes from midnight, computes delta, and converts back to hours:minutes.',
    example: {
      title: '08:30 AM to 05:15 PM',
      inputs: { start: '08:30', end: '17:15' },
      output: '8 hours, 45 minutes (8.75 hours)',
      steps: ['Start: 510 minutes', 'End: 1035 minutes', 'Difference: 525 minutes = 8h 45m'],
    },
    explanation: 'A time duration calculator simplifies tracking shift lengths, meeting times, flight itineraries, and sports workout duration without mental clock math.',
    faqs: [
      {
        question: 'Does this handle times that cross midnight?',
        answer: 'Yes! If the end time is numerically smaller than the start time, the calculator assumes overnight progression past midnight.',
      },
    ],
    inputs: [
      { id: 'start_time', label: 'Start Time (HH:MM)', type: 'text', defaultValue: '09:00' },
      { id: 'end_time', label: 'End Time (HH:MM)', type: 'text', defaultValue: '17:30' },
    ],
    calculate: (inputs) => {
      const s = String(inputs.start_time || '').trim();
      const e = String(inputs.end_time || '').trim();

      const parseMins = (t: string): number => {
        const parts = t.split(':').map(Number);
        if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
        return parts[0] * 60 + parts[1];
      };

      const m1 = parseMins(s);
      const m2 = parseMins(e);

      if (m1 < 0 || m2 < 0) return { primary: { label: 'Result', value: 'Invalid Time' }, error: 'Please enter time in HH:MM format (e.g. 09:30).' };

      let diff = m2 - m1;
      if (diff < 0) diff += 24 * 60; // Overnight

      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      const decHours = diff / 60;

      return {
        primary: { label: 'Time Elapsed', value: `${hours}h ${mins}m` },
        details: [
          { label: 'Decimal Hours', value: `${decHours.toFixed(2)} hours` },
          { label: 'Total Minutes', value: `${diff} minutes` },
          { label: 'Total Seconds', value: `${(diff * 60).toLocaleString()} seconds` },
        ],
        summary: `Elapsed time from ${s} to ${e} is ${hours} hours and ${mins} minutes.`,
      };
    },
    relatedSlugs: ['work-hours-calculator', 'business-days-calculator', 'date-difference-calculator'],
    isPopular: true,
  },
  {
    id: 'unix-timestamp-converter',
    slug: 'unix-timestamp-converter',
    title: 'Unix Timestamp Converter',
    shortTitle: 'Unix Timestamp',
    category: 'time-date',
    description: 'Convert Unix epoch timestamps to human-readable date and time, and convert any date to Unix seconds or milliseconds.',
    seoTitle: 'Unix Timestamp Converter – Epoch Time to Human Date | Benix Space',
    metaDescription: 'Free Unix timestamp converter. Convert epoch seconds to UTC/local dates and timestamps instantly.',
    keywords: ['unix timestamp converter', 'epoch converter', 'unix time', 'epoch timestamp'],
    formula: 'Epoch = Seconds since January 1, 1970 00:00:00 UTC',
    formulaExplanation: 'Standard POSIX timestamp representation used across computer operating systems and databases.',
    example: {
      title: 'Timestamp 1700000000',
      inputs: { timestamp: 1700000000 },
      output: 'Tue, 14 Nov 2023 22:13:20 GMT',
      steps: ['Multiply by 1000 for milliseconds', 'Format into UTC ISO-8601 string'],
    },
    explanation: 'Unix timestamp (also known as Epoch time) is the count of elapsed seconds since midnight UTC on January 1, 1970. It provides an unambiguous, timezone-agnostic representation of time used by databases, APIs, and servers worldwide.',
    faqs: [
      {
        question: 'What is the Year 2038 Problem?',
        answer: 'On 32-bit systems, signed 32-bit integers will overflow on January 19, 2038. Modern 64-bit systems handle timestamps safely for billions of years.',
      },
    ],
    inputs: [
      { id: 'timestamp', label: 'Unix Timestamp (Seconds)', type: 'number', defaultValue: 1789034400, step: 1 },
    ],
    calculate: (inputs) => {
      const ts = Number(inputs.timestamp);
      if (isNaN(ts)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid numeric timestamp.' };

      // Check if user entered milliseconds (> 1e11)
      const isMs = ts > 1e11;
      const ms = isMs ? ts : ts * 1000;
      const date = new Date(ms);

      if (isNaN(date.getTime())) return { primary: { label: 'Result', value: 'Invalid Date' }, error: 'Invalid timestamp value.' };

      return {
        primary: { label: 'UTC Date & Time', value: date.toUTCString() },
        details: [
          { label: 'ISO 8601 String', value: date.toISOString() },
          { label: 'Unix Seconds', value: Math.floor(ms / 1000) },
          { label: 'Unix Milliseconds', value: ms },
        ],
        summary: `Unix timestamp ${ts} corresponds to ${date.toUTCString()}.`,
      };
    },
    relatedSlugs: ['date-difference-calculator', 'time-duration-calculator'],
  },
];
