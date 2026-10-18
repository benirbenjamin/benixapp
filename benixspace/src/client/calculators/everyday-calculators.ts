import { CalculatorDefinition } from './types';

export const EVERYDAY_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'fuel-cost-calculator',
    slug: 'fuel-cost-calculator',
    title: 'Fuel Cost & Gas Mileage Calculator',
    shortTitle: 'Fuel Cost',
    category: 'everyday',
    description: 'Calculate fuel expenditure, gallons/liters needed, and travel cost per passenger for any road trip.',
    seoTitle: 'Fuel Cost Calculator – Gas Mileage & Road Trip Cost | Benix Space',
    metaDescription: 'Calculate fuel cost for any road trip. Find total gas expense, fuel volume needed, and cost per mile/km.',
    keywords: ['fuel cost calculator', 'gas cost calculator', 'road trip gas calculator', 'gas mileage cost', 'mpg calculator'],
    formula: 'Cost = (Distance / Fuel Efficiency) × Fuel Price',
    formulaExplanation: 'Divides trip distance by vehicle fuel efficiency (MPG or L/100km) to find fuel volume, then multiplies by fuel price.',
    example: {
      title: '300 miles at 28 MPG with $3.50/gallon gas',
      inputs: { distance: 300, efficiency: 28, price: 3.5 },
      output: '$37.50 Total (10.71 Gallons)',
      steps: ['300 / 28 = 10.71 gallons', '10.71 × $3.50 = $37.50'],
    },
    explanation: 'A fuel cost calculator helps drivers budget accurately for road trips, compare travel modes, and split highway travel costs fairly among carpool members.',
    faqs: [
      {
        question: 'Does highway driving improve fuel efficiency?',
        answer: 'Yes, highway driving without frequent stops usually yields 15% to 25% better fuel economy than stop-and-go city traffic.',
      },
    ],
    inputs: [
      { id: 'distance', label: 'Trip Distance (Miles or Km)', type: 'number', defaultValue: 250, step: 10 },
      { id: 'efficiency', label: 'Fuel Economy (MPG or km/L)', type: 'number', defaultValue: 25, step: 1 },
      { id: 'price', label: 'Fuel Price per Gallon / Liter ($)', type: 'number', defaultValue: 3.6, step: 0.05 },
      { id: 'passengers', label: 'Number of Passengers (Split Cost)', type: 'number', defaultValue: 1, min: 1, max: 10, step: 1 },
    ],
    calculate: (inputs) => {
      const dist = Number(inputs.distance);
      const eff = Number(inputs.efficiency);
      const price = Number(inputs.price);
      const pass = Number(inputs.passengers) || 1;

      if (isNaN(dist) || isNaN(eff) || isNaN(price) || dist <= 0 || eff <= 0 || price <= 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive numbers.' };
      }

      const fuelNeeded = dist / eff;
      const totalCost = fuelNeeded * price;
      const perPerson = totalCost / pass;
      const costPerDistance = totalCost / dist;

      return {
        primary: { label: 'Total Trip Fuel Cost', value: `$${totalCost.toFixed(2)}` },
        details: [
          { label: 'Fuel Volume Needed', value: `${fuelNeeded.toFixed(2)} units (gal/L)` },
          { label: 'Cost Per Passenger', value: `$${perPerson.toFixed(2)}` },
          { label: 'Cost Per Distance Unit', value: `$${costPerDistance.toFixed(3)} / unit` },
        ],
        summary: `For ${dist} miles/km, you need ${fuelNeeded.toFixed(1)} gal/L of fuel costing $${totalCost.toFixed(2)}.`,
      };
    },
    relatedSlugs: ['tip-calculator', 'unit-converter'],
    isPopular: true,
  },
  {
    id: 'paint-calculator',
    slug: 'paint-calculator',
    title: 'Paint Quantity Calculator',
    shortTitle: 'Paint Calculator',
    category: 'everyday',
    description: 'Calculate how many gallons or liters of paint you need to cover walls, factoring in doors, windows, and coats.',
    seoTitle: 'Paint Calculator – How Much Paint Do I Need? | Benix Space',
    metaDescription: 'Free paint calculator. Determine gallons or liters of paint needed for room walls, factoring in coats, windows, and doors.',
    keywords: ['paint calculator', 'how much paint do i need', 'room paint calculator', 'gallons of paint'],
    formula: 'Paint (Gal) = (Total Wall Area - Openings) × Coats / Coverage per Gallon (~350 sq ft)',
    formulaExplanation: 'Calculates net paintable square footage and divides by typical 350 sq ft/gal coverage rating.',
    example: {
      title: 'Room 12×14 ft with 8 ft ceiling, 2 coats',
      inputs: { length: 14, width: 12, height: 8, coats: 2 },
      output: '2.4 Gallons (Purchase 3 Gal)',
      steps: ['Perimeter = 2×(14+12) = 52 ft', 'Wall area = 52 × 8 = 416 sq ft', '2 coats = 832 sq ft', '832 / 350 = 2.38 gal'],
    },
    explanation: 'Avoid running out of paint mid-project or overbuying costly leftover cans. A standard gallon of wall paint typically covers approximately 350 to 400 square feet with one coat.',
    faqs: [
      {
        question: 'Do I always need two coats of paint?',
        answer: 'Two coats provide richer color depth, better hide, and longer durability, especially when transitioning between contrasting colors.',
      },
    ],
    inputs: [
      { id: 'length', label: 'Room Length (ft)', type: 'number', defaultValue: 14, step: 1 },
      { id: 'width', label: 'Room Width (ft)', type: 'number', defaultValue: 12, step: 1 },
      { id: 'height', label: 'Ceiling Height (ft)', type: 'number', defaultValue: 8, step: 0.5 },
      { id: 'doors', label: 'Doors Count (approx 20 sq ft each)', type: 'number', defaultValue: 1, step: 1 },
      { id: 'windows', label: 'Windows Count (approx 15 sq ft each)', type: 'number', defaultValue: 2, step: 1 },
      { id: 'coats', label: 'Number of Coats', type: 'select', defaultValue: '2', options: [{ label: '1 Coat', value: '1' }, { label: '2 Coats (Recommended)', value: '2' }, { label: '3 Coats', value: '3' }] },
    ],
    calculate: (inputs) => {
      const l = Number(inputs.length);
      const w = Number(inputs.width);
      const h = Number(inputs.height);
      const doors = Number(inputs.doors) || 0;
      const windows = Number(inputs.windows) || 0;
      const coats = Number(inputs.coats) || 2;

      if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive room dimensions.' };
      }

      const grossArea = 2 * (l + w) * h;
      const openingArea = doors * 20 + windows * 15;
      const netArea = Math.max(0, grossArea - openingArea);
      const totalAreaToPaint = netArea * coats;
      const gallonsNeeded = totalAreaToPaint / 350;
      const cansToBuy = Math.ceil(gallonsNeeded);

      return {
        primary: { label: 'Paint Needed', value: `${gallonsNeeded.toFixed(1)} Gallons`, badge: `Buy ${cansToBuy} Gallon Cans` },
        details: [
          { label: 'Net Paintable Wall Area', value: `${netArea} sq ft` },
          { label: 'Total Coverage with Coats', value: `${totalAreaToPaint} sq ft` },
          { label: 'Liters Equivalent', value: `${(gallonsNeeded * 3.78541).toFixed(1)} Liters` },
        ],
        summary: `You need ${gallonsNeeded.toFixed(1)} gallons of paint for ${coats} coats (recommend purchasing ${cansToBuy} 1-gallon cans).`,
      };
    },
    relatedSlugs: ['area-calculator', 'volume-calculator'],
  },
  {
    id: 'sleep-calculator',
    slug: 'sleep-calculator',
    title: 'Sleep Cycle Calculator',
    shortTitle: 'Sleep Calculator',
    category: 'everyday',
    description: 'Calculate ideal bedtimes and wake-up times aligned with human 90-minute REM sleep cycles to wake up feeling refreshed.',
    seoTitle: 'Sleep Calculator – Optimal Bedtime & 90-Min Sleep Cycles | Benix Space',
    metaDescription: 'Free sleep cycle calculator. Find the best times to fall asleep or wake up based on natural 90-minute REM sleep cycles.',
    keywords: ['sleep calculator', 'sleep cycle calculator', 'best time to sleep', 'rem sleep cycle', 'bedtime calculator'],
    aliases: ['sleep', 'bedtime', 'wake up', 'rem sleep', 'tired'],
    formula: 'Target Time = Base Time ± (n × 90 minutes) + 15 minutes to fall asleep',
    formulaExplanation: 'Humans sleep in 90-minute cycles alternating between light sleep, deep sleep, and REM. Waking at the end of a cycle avoids grogginess.',
    example: {
      title: 'Need to wake up at 7:00 AM',
      inputs: { wake_time: '07:00' },
      output: 'Bedtime: 10:00 PM (6 cycles) or 11:30 PM (5 cycles)',
      steps: ['Count back 90-minute increments from 7:00 AM', 'Add 15 minutes average time to fall asleep'],
    },
    explanation: 'Waking up in the middle of a deep sleep cycle triggers sleep inertia, leaving you feeling exhausted and groggy throughout the morning. Aligning your alarm with the completion of a full 90-minute cycle ensures effortless waking.',
    faqs: [
      {
        question: 'How long does an average human sleep cycle last?',
        answer: 'A standard complete sleep cycle lasts approximately 90 minutes.',
      },
    ],
    inputs: [
      { id: 'wake_time', label: 'What time do you want to wake up? (HH:MM)', type: 'text', defaultValue: '07:00' },
    ],
    calculate: (inputs) => {
      const raw = String(inputs.wake_time || '07:00').trim();
      const parts = raw.split(':').map(Number);

      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return { primary: { label: 'Result', value: 'Invalid Time' }, error: 'Please enter time in HH:MM format (e.g. 07:00).' };
      }

      const wakeMins = parts[0] * 60 + parts[1];
      const cycles = [6, 5, 4]; // 9h, 7.5h, 6h

      const formatTime = (mins: number) => {
        let m = ((mins % 1440) + 1440) % 1440;
        const h = Math.floor(m / 60);
        const min = m % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}:${min < 10 ? '0' : ''}${min} ${ampm}`;
      };

      const bedTimes = cycles.map((c) => {
        const sleepDuration = c * 90 + 15; // 15 mins to fall asleep
        const bedMins = wakeMins - sleepDuration;
        return { cycles: c, hours: (c * 1.5).toFixed(1), time: formatTime(bedMins) };
      });

      return {
        primary: { label: 'Recommended Bedtime (5 Cycles / 7.5 hrs)', value: bedTimes[1].time, badge: 'Optimal 7.5h Sleep' },
        details: [
          { label: '6 Cycles (9.0 hrs sleep)', value: bedTimes[0].time },
          { label: '5 Cycles (7.5 hrs sleep)', value: bedTimes[1].time },
          { label: '4 Cycles (6.0 hrs sleep)', value: bedTimes[2].time },
          { label: 'Time to Fall Asleep Factored', value: '15 minutes' },
        ],
        summary: `To wake at ${raw} refreshed, go to bed at ${bedTimes[1].time} (5 cycles) or ${bedTimes[0].time} (6 cycles).`,
      };
    },
    relatedSlugs: ['time-duration-calculator', 'calorie-calculator'],
    isPopular: true,
  },
];
