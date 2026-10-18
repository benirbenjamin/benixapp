import { CalculatorDefinition } from './types';

export const CONVERTER_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'unit-converter',
    slug: 'unit-converter',
    title: 'Universal Unit Converter',
    shortTitle: 'Universal Converter',
    category: 'converters',
    description: 'Convert between any metric and imperial units across length, mass, temperature, area, volume, speed, and digital data.',
    seoTitle: 'Unit Converter – Free Universal Online Unit Conversion | Benix Space',
    metaDescription: 'Universal online unit converter. Convert length, weight, temperature, speed, area, volume, and digital data instantly with Benix Space Easy Calc.',
    keywords: ['unit converter', 'online unit converter', 'measurement converter', 'metric to imperial', 'converter tool'],
    aliases: ['unit', 'converter', 'convert', 'measurements', 'metric imperial'],
    formula: 'Target = (Value × Source to Base Factor) / Target to Base Factor',
    formulaExplanation: 'Normalizes input to SI base unit, then converts directly into the requested target unit.',
    example: {
      title: 'Convert 10 Kilometers to Miles',
      inputs: { type: 'length', val: 10, from: 'km', to: 'mi' },
      output: '6.2137 Miles',
      steps: ['10 km = 10,000 meters', '1 mile = 1,609.344 meters', '10,000 / 1609.344 = 6.2137 miles'],
    },
    explanation: 'The Universal Unit Converter is a multi-dimensional measurement converter that supports real-time translation between SI Metric standards and US/Imperial customary measurement systems.',
    faqs: [
      {
        question: 'Are conversions calculated to exact international standards?',
        answer: 'Yes! International standards (such as the 1959 international yard and pound agreement defining 1 inch = exactly 25.4 mm) are strictly followed.',
      },
    ],
    inputs: [
      {
        id: 'category',
        label: 'Measurement Type',
        type: 'select',
        defaultValue: 'length',
        options: [
          { label: 'Length & Distance', value: 'length' },
          { label: 'Weight & Mass', value: 'weight' },
          { label: 'Temperature', value: 'temp' },
          { label: 'Speed', value: 'speed' },
          { label: 'Digital Storage', value: 'digital' },
        ],
      },
      { id: 'value', label: 'Value to Convert', type: 'number', defaultValue: 10, step: 'any' },
      {
        id: 'unit_pair',
        label: 'Conversion Direction',
        type: 'select',
        defaultValue: 'km_to_mi',
        options: [
          { label: 'Kilometers to Miles (km → mi)', value: 'km_to_mi' },
          { label: 'Miles to Kilometers (mi → km)', value: 'mi_to_km' },
          { label: 'Meters to Feet (m → ft)', value: 'm_to_ft' },
          { label: 'Feet to Meters (ft → m)', value: 'ft_to_m' },
          { label: 'Inches to Centimeters (in → cm)', value: 'in_to_cm' },
          { label: 'Centimeters to Inches (cm → in)', value: 'cm_to_in' },
          { label: 'Kilograms to Pounds (kg → lbs)', value: 'kg_to_lbs' },
          { label: 'Pounds to Kilograms (lbs → kg)', value: 'lbs_to_kg' },
          { label: 'Grams to Ounces (g → oz)', value: 'g_to_oz' },
          { label: 'Celsius to Fahrenheit (°C → °F)', value: 'c_to_f' },
          { label: 'Fahrenheit to Celsius (°F → °C)', value: 'f_to_c' },
          { label: 'Kilometers/h to Miles/h (km/h → mph)', value: 'kmh_to_mph' },
          { label: 'Gigabytes to Megabytes (GB → MB)', value: 'gb_to_mb' },
        ],
      },
    ],
    calculate: (inputs) => {
      const val = Number(inputs.value);
      const pair = inputs.unit_pair || 'km_to_mi';

      if (isNaN(val)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid number.' };

      let res = 0;
      let fromUnit = '';
      let toUnit = '';

      switch (pair) {
        case 'km_to_mi':
          res = val * 0.621371;
          fromUnit = 'km';
          toUnit = 'miles';
          break;
        case 'mi_to_km':
          res = val * 1.60934;
          fromUnit = 'miles';
          toUnit = 'km';
          break;
        case 'm_to_ft':
          res = val * 3.28084;
          fromUnit = 'meters';
          toUnit = 'feet';
          break;
        case 'ft_to_m':
          res = val * 0.3048;
          fromUnit = 'feet';
          toUnit = 'meters';
          break;
        case 'in_to_cm':
          res = val * 2.54;
          fromUnit = 'inches';
          toUnit = 'cm';
          break;
        case 'cm_to_in':
          res = val / 2.54;
          fromUnit = 'cm';
          toUnit = 'inches';
          break;
        case 'kg_to_lbs':
          res = val * 2.20462;
          fromUnit = 'kg';
          toUnit = 'lbs';
          break;
        case 'lbs_to_kg':
          res = val / 2.20462;
          fromUnit = 'lbs';
          toUnit = 'kg';
          break;
        case 'g_to_oz':
          res = val * 0.035274;
          fromUnit = 'grams';
          toUnit = 'ounces';
          break;
        case 'c_to_f':
          res = (val * 9) / 5 + 32;
          fromUnit = '°C';
          toUnit = '°F';
          break;
        case 'f_to_c':
          res = ((val - 32) * 5) / 9;
          fromUnit = '°F';
          toUnit = '°C';
          break;
        case 'kmh_to_mph':
          res = val * 0.621371;
          fromUnit = 'km/h';
          toUnit = 'mph';
          break;
        case 'gb_to_mb':
          res = val * 1024;
          fromUnit = 'GB';
          toUnit = 'MB';
          break;
        default:
          res = val;
      }

      return {
        primary: { label: `Converted Value`, value: Number(res.toFixed(4)), unit: toUnit },
        details: [
          { label: 'Original Value', value: `${val} ${fromUnit}` },
          { label: 'Conversion Unit', value: `${fromUnit} to ${toUnit}` },
        ],
        summary: `${val} ${fromUnit} = ${res.toFixed(4)} ${toUnit}`,
      };
    },
    relatedSlugs: ['length-converter', 'weight-converter', 'temperature-converter'],
    isPopular: true,
    isFeatured: true,
  },
  {
    id: 'length-converter',
    slug: 'length-converter',
    title: 'Length & Distance Converter',
    shortTitle: 'Length Converter',
    category: 'converters',
    description: 'Convert length measurements between meters, kilometers, centimeters, millimeters, feet, inches, yards, and miles.',
    seoTitle: 'Length Converter – Meters, Feet, Miles, Inches | Benix Space',
    metaDescription: 'Free length and distance converter. Convert between meters, feet, inches, kilometers, miles, centimeters, and yards.',
    keywords: ['length converter', 'distance converter', 'meters to feet', 'feet to meters', 'km to miles', 'inches to cm'],
    aliases: ['length', 'distance', 'meters', 'feet', 'inches', 'miles', 'km to miles'],
    formula: 'Length in Base Meters = Value × Factor',
    formulaExplanation: '1 m = 3.28084 ft = 39.3701 in = 0.001 km = 0.000621371 mi = 1.09361 yd.',
    example: {
      title: 'Convert 100 meters to feet',
      inputs: { val: 100, from: 'm', to: 'ft' },
      output: '328.08 Feet',
      steps: ['1 meter = 3.28084 feet', '100 × 3.28084 = 328.08 ft'],
    },
    explanation: 'Length conversion is necessary across international manufacturing, carpentry, architecture, athletics, maps, and travel planning.',
    faqs: [
      {
        question: 'How many feet are in a mile?',
        answer: 'There are exactly 5,280 feet in one international mile.',
      },
    ],
    inputs: [
      { id: 'val', label: 'Length Value', type: 'number', defaultValue: 100, step: 'any' },
      {
        id: 'from_unit',
        label: 'From Unit',
        type: 'select',
        defaultValue: 'm',
        options: [
          { label: 'Meters (m)', value: 'm' },
          { label: 'Kilometers (km)', value: 'km' },
          { label: 'Centimeters (cm)', value: 'cm' },
          { label: 'Millimeters (mm)', value: 'mm' },
          { label: 'Feet (ft)', value: 'ft' },
          { label: 'Inches (in)', value: 'in' },
          { label: 'Yards (yd)', value: 'yd' },
          { label: 'Miles (mi)', value: 'mi' },
        ],
      },
      {
        id: 'to_unit',
        label: 'To Unit',
        type: 'select',
        defaultValue: 'ft',
        options: [
          { label: 'Feet (ft)', value: 'ft' },
          { label: 'Meters (m)', value: 'm' },
          { label: 'Kilometers (km)', value: 'km' },
          { label: 'Centimeters (cm)', value: 'cm' },
          { label: 'Millimeters (mm)', value: 'mm' },
          { label: 'Inches (in)', value: 'in' },
          { label: 'Yards (yd)', value: 'yd' },
          { label: 'Miles (mi)', value: 'mi' },
        ],
      },
    ],
    calculate: (inputs) => {
      const v = Number(inputs.val);
      const from = inputs.from_unit || 'm';
      const to = inputs.to_unit || 'ft';

      if (isNaN(v)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid number.' };

      const toMeters: Record<string, number> = {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        ft: 0.3048,
        in: 0.0254,
        yd: 0.9144,
        mi: 1609.344,
      };

      const meters = v * (toMeters[from] || 1);
      const res = meters / (toMeters[to] || 1);

      return {
        primary: { label: `Result in ${to}`, value: Number(res.toFixed(6)), unit: to },
        details: [
          { label: 'Base Value (Meters)', value: `${meters.toFixed(4)} m` },
          { label: 'Formula', value: `Multiply by ${(toMeters[from] / toMeters[to]).toFixed(6)}` },
        ],
        summary: `${v} ${from} = ${res.toFixed(4)} ${to}`,
      };
    },
    relatedSlugs: ['unit-converter', 'weight-converter', 'area-converter'],
    isPopular: true,
  },
  {
    id: 'weight-converter',
    slug: 'weight-converter',
    title: 'Weight & Mass Converter',
    shortTitle: 'Weight Converter',
    category: 'converters',
    description: 'Convert mass and weight between kilograms, grams, milligrams, pounds (lbs), ounces (oz), and metric tons.',
    seoTitle: 'Weight Converter – Kilograms, Pounds, Grams, Ounces | Benix Space',
    metaDescription: 'Convert kg to lbs, lbs to kg, grams to ounces, and metric tons with our fast online weight converter.',
    keywords: ['weight converter', 'mass converter', 'kg to lbs', 'lbs to kg', 'grams to ounces', 'pounds to kilograms'],
    aliases: ['weight', 'mass', 'kg to lbs', 'lbs to kg', 'pounds to kg', 'kilograms'],
    formula: 'Weight in Base kg = Value × Factor',
    formulaExplanation: '1 kg = 2.20462262 lbs = 35.27396 oz = 1,000 g = 0.001 metric ton.',
    example: {
      title: 'Convert 70 kg to pounds',
      inputs: { val: 70, from: 'kg', to: 'lbs' },
      output: '154.32 Pounds',
      steps: ['70 × 2.20462 = 154.32 lbs'],
    },
    explanation: 'Weight conversion is essential in cooking recipes, fitness tracking, airport luggage limits, and shipping freight logistics.',
    faqs: [
      {
        question: 'How many pounds are in one kilogram?',
        answer: 'One kilogram is equal to approximately 2.20462 pounds.',
      },
    ],
    inputs: [
      { id: 'val', label: 'Weight Value', type: 'number', defaultValue: 70, step: 'any' },
      {
        id: 'from_unit',
        label: 'From Unit',
        type: 'select',
        defaultValue: 'kg',
        options: [
          { label: 'Kilograms (kg)', value: 'kg' },
          { label: 'Pounds (lbs)', value: 'lbs' },
          { label: 'Grams (g)', value: 'g' },
          { label: 'Ounces (oz)', value: 'oz' },
          { label: 'Milligrams (mg)', value: 'mg' },
          { label: 'Metric Tons (t)', value: 'ton' },
        ],
      },
      {
        id: 'to_unit',
        label: 'To Unit',
        type: 'select',
        defaultValue: 'lbs',
        options: [
          { label: 'Pounds (lbs)', value: 'lbs' },
          { label: 'Kilograms (kg)', value: 'kg' },
          { label: 'Grams (g)', value: 'g' },
          { label: 'Ounces (oz)', value: 'oz' },
          { label: 'Milligrams (mg)', value: 'mg' },
          { label: 'Metric Tons (t)', value: 'ton' },
        ],
      },
    ],
    calculate: (inputs) => {
      const v = Number(inputs.val);
      const from = inputs.from_unit || 'kg';
      const to = inputs.to_unit || 'lbs';

      if (isNaN(v)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid number.' };

      const toKg: Record<string, number> = {
        kg: 1,
        lbs: 0.45359237,
        g: 0.001,
        oz: 0.02834952,
        mg: 0.000001,
        ton: 1000,
      };

      const kg = v * (toKg[from] || 1);
      const res = kg / (toKg[to] || 1);

      return {
        primary: { label: `Result in ${to}`, value: Number(res.toFixed(6)), unit: to },
        details: [
          { label: 'In Kilograms', value: `${kg.toFixed(4)} kg` },
          { label: 'In Pounds', value: `${(kg / 0.45359237).toFixed(2)} lbs` },
        ],
        summary: `${v} ${from} = ${res.toFixed(4)} ${to}`,
      };
    },
    relatedSlugs: ['unit-converter', 'length-converter', 'bmi-calculator'],
    isPopular: true,
  },
  {
    id: 'temperature-converter',
    slug: 'temperature-converter',
    title: 'Temperature Converter',
    shortTitle: 'Temperature',
    category: 'converters',
    description: 'Convert temperatures between Celsius (°C), Fahrenheit (°F), and Kelvin (K) with instant formula steps.',
    seoTitle: 'Temperature Converter – Celsius, Fahrenheit & Kelvin | Benix Space',
    metaDescription: 'Free online temperature converter. Easily convert Celsius to Fahrenheit, Fahrenheit to Celsius, and Kelvin.',
    keywords: ['temperature converter', 'celsius to fahrenheit', 'fahrenheit to celsius', 'kelvin converter'],
    aliases: ['temperature', 'celsius', 'fahrenheit', 'c to f', 'f to c', 'kelvin'],
    formula: '°F = (°C × 9/5) + 32 | °C = (°F - 32) × 5/9 | K = °C + 273.15',
    formulaExplanation: 'Linear temperature scale transformations accounting for relative degree increments and varying zero reference points.',
    example: {
      title: 'Convert 100°C (boiling point of water)',
      inputs: { temp: 100, scale: 'C' },
      output: '212°F (373.15 K)',
      steps: ['(100 × 9/5) + 32 = 180 + 32 = 212°F', '100 + 273.15 = 373.15 K'],
    },
    explanation: 'Celsius is standard in science and most of the world; Fahrenheit is used primarily in the United States. Kelvin is the absolute thermodynamic temperature scale used in physics.',
    faqs: [
      {
        question: 'At what temperature are Celsius and Fahrenheit equal?',
        answer: 'Celsius and Fahrenheit are exactly equal at -40° (-40°C = -40°F).',
      },
    ],
    inputs: [
      { id: 'temp', label: 'Temperature Value', type: 'number', defaultValue: 37, step: 'any' },
      {
        id: 'scale',
        label: 'Input Temperature Scale',
        type: 'select',
        defaultValue: 'C',
        options: [
          { label: 'Celsius (°C)', value: 'C' },
          { label: 'Fahrenheit (°F)', value: 'F' },
          { label: 'Kelvin (K)', value: 'K' },
        ],
      },
    ],
    calculate: (inputs) => {
      const t = Number(inputs.temp);
      const scale = inputs.scale || 'C';

      if (isNaN(t)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid temperature.' };

      let c = 0;
      let f = 0;
      let k = 0;

      if (scale === 'C') {
        c = t;
        f = (c * 9) / 5 + 32;
        k = c + 273.15;
      } else if (scale === 'F') {
        f = t;
        c = ((f - 32) * 5) / 9;
        k = c + 273.15;
      } else {
        k = t;
        c = k - 273.15;
        f = (c * 9) / 5 + 32;
      }

      if (k < 0) {
        return { primary: { label: 'Result', value: 'Below Absolute Zero' }, error: 'Temperature cannot be below Absolute Zero (0 Kelvin).' };
      }

      return {
        primary: {
          label: scale === 'C' ? 'In Fahrenheit' : 'In Celsius',
          value: scale === 'C' ? `${f.toFixed(2)} °F` : `${c.toFixed(2)} °C`,
        },
        details: [
          { label: 'Celsius (°C)', value: `${c.toFixed(2)} °C` },
          { label: 'Fahrenheit (°F)', value: `${f.toFixed(2)} °F` },
          { label: 'Kelvin (K)', value: `${k.toFixed(2)} K` },
        ],
        summary: `${t}°${scale} = ${c.toFixed(2)}°C = ${f.toFixed(2)}°F = ${k.toFixed(2)}K`,
      };
    },
    relatedSlugs: ['unit-converter', 'speed-converter'],
    isPopular: true,
  },
];
