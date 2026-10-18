import { CalculatorDefinition } from './types';

export const AGRICULTURE_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'land-area-calculator',
    slug: 'land-area-calculator',
    title: 'Land Area & Hectare / Acre Converter',
    shortTitle: 'Land Area',
    category: 'agriculture',
    description: 'Convert agricultural land measurements between Hectares, Acres, Square Meters, and Square Feet.',
    seoTitle: 'Land Area Calculator – Acre to Hectare Converter | Benix Space',
    metaDescription: 'Free farm land area converter. Convert acres to hectares, hectares to acres, and square meters for agricultural surveying.',
    keywords: ['land area calculator', 'acre to hectare', 'hectare to acre', 'farm area calculator', 'land measurement converter'],
    formula: '1 Hectare = 2.47105 Acres = 10,000 m² = 107,639 sq ft',
    formulaExplanation: 'International land surveying conversion benchmarks.',
    example: {
      title: 'Convert 5 Hectares to Acres',
      inputs: { val: 5, from: 'ha', to: 'ac' },
      output: '12.36 Acres',
      steps: ['5 × 2.47105 = 12.355 Acres'],
    },
    explanation: 'Land measurement conversions are indispensable for farming, property purchases, forestry management, and rural agricultural planning.',
    faqs: [
      {
        question: 'How large is one hectare in meters?',
        answer: 'One hectare is equal to a square of 100 meters by 100 meters, or 10,000 square meters.',
      },
    ],
    inputs: [
      { id: 'val', label: 'Land Area Value', type: 'number', defaultValue: 10, step: 'any' },
      {
        id: 'from_unit',
        label: 'From Unit',
        type: 'select',
        defaultValue: 'ha',
        options: [
          { label: 'Hectares (ha)', value: 'ha' },
          { label: 'Acres (ac)', value: 'ac' },
          { label: 'Square Meters (m²)', value: 'm2' },
          { label: 'Square Feet (sq ft)', value: 'sqft' },
        ],
      },
      {
        id: 'to_unit',
        label: 'To Unit',
        type: 'select',
        defaultValue: 'ac',
        options: [
          { label: 'Acres (ac)', value: 'ac' },
          { label: 'Hectares (ha)', value: 'ha' },
          { label: 'Square Meters (m²)', value: 'm2' },
          { label: 'Square Feet (sq ft)', value: 'sqft' },
        ],
      },
    ],
    calculate: (inputs) => {
      const v = Number(inputs.val);
      const from = inputs.from_unit || 'ha';
      const to = inputs.to_unit || 'ac';

      if (isNaN(v) || v < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a positive area.' };

      const toM2: Record<string, number> = {
        ha: 10000,
        ac: 4046.85642,
        m2: 1,
        sqft: 0.092903,
      };

      const m2 = v * (toM2[from] || 1);
      const res = m2 / (toM2[to] || 1);

      return {
        primary: { label: `Result in ${to}`, value: Number(res.toFixed(4)), unit: to },
        details: [
          { label: 'In Square Meters', value: `${m2.toLocaleString()} m²` },
          { label: 'In Hectares', value: `${(m2 / 10000).toFixed(4)} ha` },
          { label: 'In Acres', value: `${(m2 / 4046.856).toFixed(4)} ac` },
        ],
        summary: `${v} ${from} = ${res.toFixed(4)} ${to}`,
      };
    },
    relatedSlugs: ['fertilizer-calculator', 'plant-population-calculator', 'area-calculator'],
    isPopular: true,
  },
  {
    id: 'fertilizer-calculator',
    slug: 'fertilizer-calculator',
    title: 'Fertilizer Application Calculator',
    shortTitle: 'Fertilizer',
    category: 'agriculture',
    description: 'Calculate pounds or kilograms of commercial fertilizer (NPK) needed per acre or hectare based on soil nutrient recommendations.',
    seoTitle: 'Fertilizer Calculator – NPK Application Rate | Benix Space',
    metaDescription: 'Free agricultural fertilizer calculator. Calculate fertilizer application rates based on Nitrogen, Phosphorus, and Potassium percentages.',
    keywords: ['fertilizer calculator', 'npk calculator', 'fertilizer application rate', 'crop nutrition calculator'],
    formula: 'Fertilizer Needed = (Target Nutrient Rate) / (Nutrient Percentage in Bag / 100)',
    formulaExplanation: 'Divides desired active nutrient weight per area by the guaranteed chemical analysis percentage.',
    example: {
      title: 'Need 50 lbs Nitrogen per acre using 46-0-0 Urea',
      inputs: { target_rate: 50, bag_pct: 46, area: 10 },
      output: '1,087 lbs Fertilizer Total (108.7 lbs/acre)',
      steps: ['50 / 0.46 = 108.7 lbs Urea per acre', '108.7 × 10 acres = 1,087 lbs total'],
    },
    explanation: 'Commercial fertilizers display a 3-number NPK ratio indicating the percentage by weight of Nitrogen (N), Available Phosphate (P2O5), and Soluble Potash (K2O). This tool ensures precise nutrient application avoiding crop burn or fertilizer waste.',
    faqs: [
      {
        question: 'What do the numbers on a fertilizer bag mean?',
        answer: 'They represent the percentage of Nitrogen (N), Phosphorus (P), and Potassium (K). For example, 10-20-10 has 10% N, 20% P, and 10% K.',
      },
    ],
    inputs: [
      { id: 'target_rate', label: 'Desired Nutrient Rate (kg or lbs per unit area)', type: 'number', defaultValue: 50, step: 5 },
      { id: 'bag_pct', label: 'Nutrient % in Fertilizer (e.g. 46 for 46-0-0)', type: 'number', defaultValue: 46, min: 1, max: 100, step: 1 },
      { id: 'area', label: 'Field Size (Acres or Hectares)', type: 'number', defaultValue: 5, step: 1 },
    ],
    calculate: (inputs) => {
      const rate = Number(inputs.target_rate);
      const pct = Number(inputs.bag_pct);
      const area = Number(inputs.area) || 1;

      if (isNaN(rate) || isNaN(pct) || rate <= 0 || pct <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive numbers.' };

      const perArea = rate / (pct / 100);
      const total = perArea * area;

      return {
        primary: { label: 'Total Fertilizer Needed', value: `${total.toFixed(1)} units (kg/lbs)` },
        details: [
          { label: 'Application Rate', value: `${perArea.toFixed(1)} per acre/ha` },
          { label: 'Total Field Area', value: `${area} unit(s)` },
          { label: 'Active Nutrient Delivered', value: `${(rate * area).toFixed(1)} units` },
        ],
        summary: `You need ${total.toFixed(1)} units of fertilizer for ${area} area units to supply ${rate} target nutrient.`,
      };
    },
    relatedSlugs: ['land-area-calculator', 'plant-population-calculator'],
  },
];
