import { CalculatorDefinition } from './types';

const HEALTH_DISCLAIMER = 'Disclaimer: This calculator is provided for informational and educational purposes only. It is not intended to serve as medical advice, diagnosis, or treatment. Always consult with a qualified physician or healthcare professional regarding personal health decisions.';

export const HEALTH_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'bmi-calculator',
    slug: 'bmi-calculator',
    title: 'BMI Calculator (Body Mass Index)',
    shortTitle: 'BMI Calculator',
    category: 'health',
    description: 'Calculate your Body Mass Index (BMI) and discover whether you fall within underweight, normal, overweight, or obese ranges according to WHO standards.',
    seoTitle: 'BMI Calculator – Calculate Your Body Mass Index | Benix Space',
    metaDescription: 'Free BMI calculator for adults. Calculate Body Mass Index using metric or imperial units with WHO classification categories and healthy weight guidance.',
    keywords: ['bmi calculator', 'body mass index', 'calculate bmi', 'bmi chart', 'healthy weight calculator'],
    aliases: ['bmi', 'body mass index', 'weight status', 'am i overweight', 'obesity calculator'],
    formula: 'Metric: BMI = weight (kg) / [height (m)]² | Imperial: BMI = 703 × weight (lbs) / [height (in)]²',
    formulaExplanation: 'Divide body weight in kilograms by height in meters squared (or use the 703 multiplier for pounds and inches).',
    example: {
      title: 'Height 175 cm (5 ft 9 in), Weight 70 kg (154 lbs)',
      inputs: { unit: 'metric', height_cm: 175, weight_kg: 70 },
      output: 'BMI 22.86 (Normal Weight)',
      steps: ['Height in meters: 1.75 m', '1.75² = 3.0625', '70 / 3.0625 = 22.86 kg/m²'],
    },
    explanation: 'Body Mass Index (BMI) is a screening tool used by healthcare professionals worldwide to estimate body fatness based on an individual’s height and weight. The World Health Organization (WHO) classifies BMI into Underweight (< 18.5), Normal weight (18.5 – 24.9), Overweight (25 – 29.9), and Obese (≥ 30).',
    faqs: [
      {
        question: 'What is considered a healthy BMI range?',
        answer: 'For most adults, a healthy BMI falls between 18.5 and 24.9 kg/m².',
      },
      {
        question: 'Does BMI distinguish between muscle mass and body fat?',
        answer: 'BMI does not directly measure muscle mass. Athletes and muscular individuals may register high BMIs despite having low body fat percentages.',
      },
    ],
    inputs: [
      { id: 'unit', label: 'Measurement System', type: 'select', defaultValue: 'metric', options: [{ label: 'Metric (cm, kg)', value: 'metric' }, { label: 'Imperial (in, lbs)', value: 'imperial' }] },
      { id: 'height', label: 'Height (cm or inches)', type: 'number', defaultValue: 175, min: 50, max: 250, step: 1 },
      { id: 'weight', label: 'Weight (kg or lbs)', type: 'number', defaultValue: 70, min: 20, max: 500, step: 0.5 },
    ],
    calculate: (inputs) => {
      const isMetric = inputs.unit !== 'imperial';
      const h = Number(inputs.height);
      const w = Number(inputs.weight);

      if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive height and weight.' };
      }

      let bmi = 0;
      let minHealthyWeight = 0;
      let maxHealthyWeight = 0;

      if (isMetric) {
        const hm = h / 100;
        bmi = w / (hm * hm);
        minHealthyWeight = 18.5 * (hm * hm);
        maxHealthyWeight = 24.9 * (hm * hm);
      } else {
        bmi = (703 * w) / (h * h);
        minHealthyWeight = (18.5 * (h * h)) / 703;
        maxHealthyWeight = (24.9 * (h * h)) / 703;
      }

      let category = 'Normal';
      let badge = 'Normal Weight';
      if (bmi < 18.5) {
        category = 'Underweight';
        badge = 'Underweight';
      } else if (bmi < 25) {
        category = 'Normal weight';
        badge = 'Normal Weight';
      } else if (bmi < 30) {
        category = 'Overweight';
        badge = 'Overweight';
      } else {
        category = 'Obese';
        badge = 'Obesity Range';
      }

      const weightUnit = isMetric ? 'kg' : 'lbs';

      return {
        primary: { label: 'Your BMI', value: Number(bmi.toFixed(1)), unit: 'kg/m²', badge },
        details: [
          { label: 'Category', value: category },
          { label: 'Healthy Weight Range', value: `${minHealthyWeight.toFixed(1)} – ${maxHealthyWeight.toFixed(1)} ${weightUnit}` },
          { label: 'BMI Prime', value: (bmi / 25).toFixed(2) },
          { label: 'Ponderal Index', value: (w / Math.pow(isMetric ? h / 100 : h * 0.0254, 3)).toFixed(1) },
        ],
        summary: `Your BMI is ${bmi.toFixed(1)}, which falls in the ${category} category.`,
      };
    },
    relatedSlugs: ['bmr-calculator', 'calorie-calculator', 'ideal-weight-calculator', 'water-intake-calculator'],
    isPopular: true,
    isFeatured: true,
    disclaimer: HEALTH_DISCLAIMER,
  },
  {
    id: 'bmr-calculator',
    slug: 'bmr-calculator',
    title: 'BMR Calculator (Basal Metabolic Rate)',
    shortTitle: 'BMR Calculator',
    category: 'health',
    description: 'Calculate your Basal Metabolic Rate (BMR) – the number of calories your body burns at complete rest using the Mifflin-St Jeor equation.',
    seoTitle: 'BMR Calculator – Basal Metabolic Rate | Benix Space',
    metaDescription: 'Free BMR calculator. Find your basal metabolic rate and daily resting calorie expenditure using Mifflin-St Jeor formula.',
    keywords: ['bmr calculator', 'basal metabolic rate', 'resting calories', 'metabolism calculator'],
    aliases: ['bmr', 'basal metabolism', 'resting calories', 'metabolic rate'],
    formula: 'Men: 10×w(kg) + 6.25×h(cm) - 5×age + 5 | Women: 10×w(kg) + 6.25×h(cm) - 5×age - 161',
    formulaExplanation: 'The Mifflin-St Jeor equation estimates energy expenditure required to sustain vital organ functions at rest.',
    example: {
      title: 'Male, 30 years, 180 cm, 80 kg',
      inputs: { gender: 'male', age: 30, height: 180, weight: 80 },
      output: '1,780 Calories / day',
      steps: ['10 × 80 = 800', '6.25 × 180 = 1,125', '5 × 30 = 150', '800 + 1125 - 150 + 5 = 1,780 kcal'],
    },
    explanation: 'Basal Metabolic Rate (BMR) is the minimum amount of energy your body expends while at rest in a temperate environment. It accounts for approximately 60% to 75% of your total daily calorie burn, fueling respiration, blood circulation, cellular reproduction, and brain activity.',
    faqs: [
      {
        question: 'How is BMR different from TDEE?',
        answer: 'BMR is calories burned at total rest in bed. Total Daily Energy Expenditure (TDEE) adds physical movement, exercise, and digestion calories to your BMR.',
      },
    ],
    inputs: [
      { id: 'gender', label: 'Biological Sex', type: 'select', defaultValue: 'male', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
      { id: 'age', label: 'Age (Years)', type: 'number', defaultValue: 28, min: 15, max: 100, step: 1 },
      { id: 'height', label: 'Height (cm)', type: 'number', defaultValue: 175, min: 100, max: 240, step: 1 },
      { id: 'weight', label: 'Weight (kg)', type: 'number', defaultValue: 72, min: 30, max: 300, step: 0.5 },
    ],
    calculate: (inputs) => {
      const g = inputs.gender || 'male';
      const age = Number(inputs.age);
      const h = Number(inputs.height);
      const w = Number(inputs.weight);

      if (isNaN(age) || isNaN(h) || isNaN(w) || age <= 0 || h <= 0 || w <= 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid age, height, and weight.' };
      }

      // Mifflin-St Jeor
      let bmr = 10 * w + 6.25 * h - 5 * age;
      if (g === 'male') bmr += 5;
      else bmr -= 161;

      // Harris-Benedict revised
      let hb = 0;
      if (g === 'male') hb = 13.397 * w + 4.799 * h - 5.677 * age + 88.362;
      else hb = 9.247 * w + 3.098 * h - 4.33 * age + 447.593;

      return {
        primary: { label: 'Your BMR', value: Math.round(bmr), unit: 'Calories / day' },
        details: [
          { label: 'Mifflin-St Jeor Formula', value: `${Math.round(bmr)} kcal` },
          { label: 'Harris-Benedict Formula', value: `${Math.round(hb)} kcal` },
          { label: 'Hourly Calorie Burn at Rest', value: `${(bmr / 24).toFixed(1)} kcal/hr` },
        ],
        summary: `Your body burns approximately ${Math.round(bmr)} calories per day just staying alive at rest.`,
      };
    },
    relatedSlugs: ['calorie-calculator', 'bmi-calculator', 'ideal-weight-calculator'],
    isPopular: true,
    disclaimer: HEALTH_DISCLAIMER,
  },
  {
    id: 'calorie-calculator',
    slug: 'calorie-calculator',
    title: 'Calorie & TDEE Calculator',
    shortTitle: 'Calorie Needs',
    category: 'health',
    description: 'Calculate daily calorie needs to maintain, lose weight, or gain muscle based on activity levels.',
    seoTitle: 'Calorie Calculator – Daily Calorie Needs & TDEE | Benix Space',
    metaDescription: 'Calculate daily calories for weight loss, maintenance, or muscle gain. Accurate TDEE calculations with Benix Space Easy Calc.',
    keywords: ['calorie calculator', 'tdee calculator', 'daily calories', 'calories to lose weight', 'macro calories'],
    formula: 'TDEE = BMR × Activity Multiplier',
    formulaExplanation: 'Multiplies baseline BMR by physical activity level (1.2 sedentary to 1.9 extreme athlete).',
    example: {
      title: 'BMR 1,700 kcal with Moderate Exercise (3-5 days/wk)',
      inputs: { bmr: 1700, activity: '1.55' },
      output: '2,635 Calories / day',
      steps: ['TDEE: 1,700 × 1.55 = 2,635 kcal', 'Weight Loss (-500 kcal): 2,135 kcal', 'Weight Gain (+500 kcal): 3,135 kcal'],
    },
    explanation: 'Total Daily Energy Expenditure (TDEE) is the total number of calories you burn each day. To lose roughly 1 lb (0.45 kg) of fat per week, consume 500 calories below your TDEE; to gain weight, consume 500 calories above your TDEE.',
    faqs: [
      {
        question: 'What is a safe calorie deficit for weight loss?',
        answer: 'A deficit of 300 to 500 calories per day produces healthy, sustainable weight loss of about 0.5 to 1 lb per week.',
      },
    ],
    inputs: [
      { id: 'age', label: 'Age', type: 'number', defaultValue: 28, step: 1 },
      { id: 'gender', label: 'Gender', type: 'select', defaultValue: 'male', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
      { id: 'height', label: 'Height (cm)', type: 'number', defaultValue: 175, step: 1 },
      { id: 'weight', label: 'Weight (kg)', type: 'number', defaultValue: 74, step: 0.5 },
      {
        id: 'activity',
        label: 'Activity Level',
        type: 'select',
        defaultValue: '1.375',
        options: [
          { label: 'Sedentary (Little or no exercise)', value: '1.2' },
          { label: 'Lightly Active (Exercise 1-3 days/week)', value: '1.375' },
          { label: 'Moderately Active (Exercise 3-5 days/week)', value: '1.55' },
          { label: 'Very Active (Hard exercise 6-7 days/week)', value: '1.725' },
          { label: 'Extra Active (Intense training / physical job)', value: '1.9' },
        ],
      },
    ],
    calculate: (inputs) => {
      const g = inputs.gender || 'male';
      const age = Number(inputs.age);
      const h = Number(inputs.height);
      const w = Number(inputs.weight);
      const act = Number(inputs.activity) || 1.2;

      let bmr = 10 * w + 6.25 * h - 5 * age;
      if (g === 'male') bmr += 5;
      else bmr -= 161;

      const tdee = Math.round(bmr * act);
      const mildLoss = Math.round(tdee - 250);
      const weightLoss = Math.round(tdee - 500);
      const weightGain = Math.round(tdee + 500);

      return {
        primary: { label: 'Maintenance Calories', value: tdee.toLocaleString(), unit: 'kcal / day' },
        details: [
          { label: 'Mild Weight Loss (-0.25 kg/wk)', value: `${mildLoss.toLocaleString()} kcal` },
          { label: 'Weight Loss (-0.5 kg/wk)', value: `${weightLoss.toLocaleString()} kcal` },
          { label: 'Weight Gain (+0.5 kg/wk)', value: `${weightGain.toLocaleString()} kcal` },
          { label: 'Basal Metabolic Rate (BMR)', value: `${Math.round(bmr).toLocaleString()} kcal` },
        ],
        summary: `Your maintenance calorie requirement is ${tdee.toLocaleString()} kcal/day.`,
      };
    },
    relatedSlugs: ['bmr-calculator', 'bmi-calculator', 'ideal-weight-calculator'],
    isPopular: true,
    disclaimer: HEALTH_DISCLAIMER,
  },
  {
    id: 'ideal-weight-calculator',
    slug: 'ideal-weight-calculator',
    title: 'Ideal Body Weight Calculator',
    shortTitle: 'Ideal Weight',
    category: 'health',
    description: 'Calculate your healthy ideal body weight range using Devine, Robinson, Miller, and Hamwi formulas.',
    seoTitle: 'Ideal Body Weight Calculator – Healthy Weight Range | Benix Space',
    metaDescription: 'Find your ideal weight based on height and gender using clinical formulas (Devine, Robinson, Miller, WHO BMI).',
    keywords: ['ideal weight calculator', 'ideal body weight', 'healthy weight', 'devine formula'],
    formula: 'Devine Male: 50 kg + 2.3 kg per inch over 5ft | Female: 45.5 kg + 2.3 kg per inch over 5ft',
    formulaExplanation: 'Standard medical benchmark established by Dr. B.J. Devine for pharmaceutical dosing and nutritional planning.',
    example: {
      title: 'Male, 5 ft 10 in (178 cm)',
      inputs: { gender: 'male', height_cm: 178 },
      output: '73.0 kg (161 lbs)',
      steps: ['10 inches over 5 feet', '50 kg + (10 × 2.3) = 73.0 kg'],
    },
    explanation: 'Ideal Body Weight (IBW) was originally formulated for clinical pharmacology to calculate clearance rates and drug dosages. It provides a reliable benchmark for healthy target weights when combined with WHO BMI healthy boundaries.',
    faqs: [
      {
        question: 'Which formula is most widely recognized by doctors?',
        answer: 'The Devine formula is the most universally referenced in medical literature and pharmaceutical prescribing.',
      },
    ],
    inputs: [
      { id: 'gender', label: 'Gender', type: 'select', defaultValue: 'male', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
      { id: 'height_cm', label: 'Height (cm)', type: 'number', defaultValue: 178, min: 140, max: 230, step: 1 },
    ],
    calculate: (inputs) => {
      const g = inputs.gender || 'male';
      const hCm = Number(inputs.height_cm);

      if (isNaN(hCm) || hCm <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid height.' };

      const hInches = hCm / 2.54;
      const inchesOver5ft = Math.max(0, hInches - 60);

      // Devine Formula
      let devine = g === 'male' ? 50 + 2.3 * inchesOver5ft : 45.5 + 2.3 * inchesOver5ft;
      // Robinson Formula
      let robinson = g === 'male' ? 52 + 1.9 * inchesOver5ft : 49 + 1.7 * inchesOver5ft;
      // Miller Formula
      let miller = g === 'male' ? 56.2 + 1.41 * inchesOver5ft : 53.1 + 1.36 * inchesOver5ft;

      // BMI 18.5 - 24.9 range
      const hm = hCm / 100;
      const bmiMin = 18.5 * (hm * hm);
      const bmiMax = 24.9 * (hm * hm);

      return {
        primary: { label: 'Ideal Weight (Devine)', value: `${devine.toFixed(1)} kg`, unit: `(${(devine * 2.20462).toFixed(1)} lbs)` },
        details: [
          { label: 'Robinson Formula', value: `${robinson.toFixed(1)} kg (${(robinson * 2.20462).toFixed(1)} lbs)` },
          { label: 'Miller Formula', value: `${miller.toFixed(1)} kg (${(miller * 2.20462).toFixed(1)} lbs)` },
          { label: 'Healthy BMI Range (WHO)', value: `${bmiMin.toFixed(1)} – ${bmiMax.toFixed(1)} kg` },
        ],
        summary: `Your estimated ideal weight is approximately ${devine.toFixed(1)} kg (${(devine * 2.2).toFixed(0)} lbs).`,
      };
    },
    relatedSlugs: ['bmi-calculator', 'bmr-calculator', 'calorie-calculator'],
    disclaimer: HEALTH_DISCLAIMER,
  },
  {
    id: 'water-intake-calculator',
    slug: 'water-intake-calculator',
    title: 'Water Intake Calculator',
    shortTitle: 'Water Intake',
    category: 'health',
    description: 'Calculate daily hydration and water drinking requirements based on body weight, climate, and exercise level.',
    seoTitle: 'Water Intake Calculator – Daily Hydration Needs | Benix Space',
    metaDescription: 'Calculate how much water you should drink daily based on your weight and activity level with Benix Space Easy Calc.',
    keywords: ['water intake calculator', 'daily water intake', 'how much water to drink', 'hydration calculator'],
    formula: 'Water (L) = Weight (kg) × 0.033 + Exercise (hrs) × 0.5',
    formulaExplanation: 'Base hydration requires ~33ml per kg of body weight, plus an additional 500ml per hour of physical exertion.',
    example: {
      title: '70 kg person, 45 min exercise daily',
      inputs: { weight: 70, exercise_mins: 45 },
      output: '2.7 Liters (11 cups)',
      steps: ['Base: 70 × 0.033 = 2.31 L', 'Exercise addition: (45/60) × 0.5 = 0.38 L', 'Total: 2.69 Liters'],
    },
    explanation: 'Adequate hydration is critical for cognitive performance, kidney filtration, joint lubrication, temperature regulation, and digestive health. Individual needs fluctuate according to physical sweat rate, ambient humidity, and diet.',
    faqs: [
      {
        question: 'Do tea and coffee count toward daily water intake?',
        answer: 'Yes, moderate consumption of caffeinated beverages contributes positively to your net daily fluid intake.',
      },
    ],
    inputs: [
      { id: 'weight_kg', label: 'Body Weight (kg)', type: 'number', defaultValue: 70, min: 20, max: 250, step: 1 },
      { id: 'exercise_mins', label: 'Daily Exercise / Activity (Minutes)', type: 'number', defaultValue: 30, min: 0, max: 300, step: 15 },
      { id: 'climate', label: 'Climate Environment', type: 'select', defaultValue: 'temperate', options: [{ label: 'Temperate / Normal', value: 'temperate' }, { label: 'Hot or Dry / Tropical', value: 'hot' }] },
    ],
    calculate: (inputs) => {
      const w = Number(inputs.weight_kg);
      const ex = Number(inputs.exercise_mins);
      const clim = inputs.climate || 'temperate';

      if (isNaN(w) || w <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid weight.' };

      let liters = w * 0.033;
      liters += (ex / 60) * 0.5;
      if (clim === 'hot') liters *= 1.15;

      const cups = liters / 0.25; // 250ml cup
      const flOz = liters * 33.814;

      return {
        primary: { label: 'Daily Water Need', value: `${liters.toFixed(2)} Liters`, unit: `(~${Math.round(cups)} cups)` },
        details: [
          { label: 'Fluid Ounces', value: `${flOz.toFixed(1)} fl oz` },
          { label: 'Standard 250ml Glasses', value: `${Math.round(cups)} glasses` },
          { label: '500ml Water Bottles', value: `${(liters / 0.5).toFixed(1)} bottles` },
        ],
        summary: `You should drink approximately ${liters.toFixed(2)} liters (${Math.round(cups)} cups) of water per day.`,
      };
    },
    relatedSlugs: ['calorie-calculator', 'bmi-calculator'],
    disclaimer: HEALTH_DISCLAIMER,
  },
];
