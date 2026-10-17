import { CalculatorDefinition } from './types';

export const MATH_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'percentage-calculator',
    slug: 'percentage-calculator',
    title: 'Percentage Calculator',
    shortTitle: 'Percentage',
    category: 'math',
    description: 'Calculate percentages, percentage change, and proportions instantly with our free online percentage calculator.',
    seoTitle: 'Percentage Calculator – Calculate Percentages Online | Benix Space',
    metaDescription: 'Calculate what is X% of Y, find percentage increase/decrease, or find the percentage ratio between two numbers instantly with Benix Space Easy Calc.',
    keywords: ['percentage calculator', 'percent calculator', 'calculate percentage', 'how to calculate percentage', 'online percentage calculator'],
    aliases: ['percent', 'percentages', 'pct', '% of', 'discount pct'],
    formula: 'P = (Part / Whole) × 100',
    formulaExplanation: 'Multiply the fraction of the part over the whole by 100 to obtain the percentage value.',
    example: {
      title: 'Finding 25% of 240',
      inputs: { type: 'pct_of', val1: 25, val2: 240 },
      output: '60',
      steps: ['Convert 25% to decimal: 25 / 100 = 0.25', 'Multiply by 240: 0.25 × 240 = 60'],
    },
    explanation: 'A percentage represents a number or ratio expressed as a fraction of 100. It is widely used in finance, discounts, statistics, academic grading, and everyday calculations. This calculator allows you to solve three common percentage problems: finding X% of a number, determining what percentage one number is of another, and calculating the base total when given a percentage.',
    faqs: [
      {
        question: 'How do you calculate a percentage of a number?',
        answer: 'To calculate a percentage of a number, divide the percentage by 100 to convert it into a decimal, then multiply the result by the target number. For instance, 20% of 150 is 0.20 × 150 = 30.',
      },
      {
        question: 'What is the formula to find the percentage of two numbers?',
        answer: 'Divide the part by the total whole and multiply by 100: (Part / Whole) × 100 = Percentage (%).',
      },
    ],
    inputs: [
      {
        id: 'calc_type',
        label: 'Calculation Type',
        type: 'select',
        defaultValue: 'what_is_p_of_x',
        options: [
          { label: 'What is X% of Y?', value: 'what_is_p_of_x' },
          { label: 'X is what % of Y?', value: 'x_is_what_pct_of_y' },
          { label: 'X is Y% of what?', value: 'x_is_p_pct_of_what' },
        ],
      },
      { id: 'val1', label: 'Value X', type: 'number', defaultValue: 15, step: 'any' },
      { id: 'val2', label: 'Value Y', type: 'number', defaultValue: 200, step: 'any' },
    ],
    calculate: (inputs) => {
      const type = inputs.calc_type || 'what_is_p_of_x';
      const x = Number(inputs.val1);
      const y = Number(inputs.val2);

      if (isNaN(x) || isNaN(y)) {
        return { primary: { label: 'Result', value: 'Invalid Input' }, error: 'Please enter valid numerical values.' };
      }

      if (type === 'what_is_p_of_x') {
        const res = (x / 100) * y;
        return {
          primary: { label: `${x}% of ${y}`, value: Number(res.toFixed(4)), unit: '' },
          details: [
            { label: 'Formula', value: `(${x} / 100) × ${y}` },
            { label: 'Decimal Multiplier', value: (x / 100).toString() },
          ],
          summary: `${x}% of ${y} is ${res}`,
        };
      } else if (type === 'x_is_what_pct_of_y') {
        if (y === 0) return { primary: { label: 'Result', value: 'Division by zero' }, error: 'The denominator (Y) cannot be zero.' };
        const pct = (x / y) * 100;
        return {
          primary: { label: 'Percentage', value: Number(pct.toFixed(4)), unit: '%' },
          details: [
            { label: 'Part', value: x },
            { label: 'Whole', value: y },
            { label: 'Fraction', value: `${x} / ${y}` },
          ],
          summary: `${x} is ${pct.toFixed(2)}% of ${y}`,
        };
      } else {
        if (y === 0) return { primary: { label: 'Result', value: 'Zero percentage' }, error: 'Percentage (Y) cannot be zero.' };
        const whole = (x / (y / 100));
        return {
          primary: { label: 'Base Whole', value: Number(whole.toFixed(4)), unit: '' },
          details: [
            { label: 'Formula', value: `${x} ÷ (${y} / 100)` },
            { label: 'Original Value', value: whole.toFixed(2) },
          ],
          summary: `${x} is ${y}% of ${whole.toFixed(2)}`,
        };
      }
    },
    relatedSlugs: ['percentage-increase-calculator', 'percentage-decrease-calculator', 'percentage-difference-calculator', 'discount-calculator'],
    isPopular: true,
  },
  {
    id: 'percentage-increase-calculator',
    slug: 'percentage-increase-calculator',
    title: 'Percentage Increase Calculator',
    shortTitle: 'Percentage Increase',
    category: 'math',
    description: 'Calculate the percentage increase from an initial starting value to a final value easily.',
    seoTitle: 'Percentage Increase Calculator – Fast & Free | Benix Space',
    metaDescription: 'Find the percentage growth or increase between an initial value and a final value with Benix Space Easy Calc.',
    keywords: ['percentage increase calculator', 'percent increase', 'calculate percentage growth', 'growth rate calculator'],
    formula: 'Increase (%) = ((Final - Initial) / Initial) × 100',
    formulaExplanation: 'Subtract the initial value from the final value, divide by the absolute initial value, and multiply by 100.',
    example: {
      title: 'Increase from 50 to 75',
      inputs: { initial: 50, final: 75 },
      output: '50% Increase',
      steps: ['Difference: 75 - 50 = 25', 'Divide by initial: 25 / 50 = 0.5', 'Multiply by 100: 50%'],
    },
    explanation: 'A percentage increase measures the proportional growth of a quantity relative to its starting value. It is essential in monitoring salary raises, investment appreciation, business revenue expansion, population growth, and inflation.',
    faqs: [
      {
        question: 'What if the final value is smaller than the initial value?',
        answer: 'If the final value is smaller, the result is negative, indicating a percentage decrease rather than an increase.',
      },
    ],
    inputs: [
      { id: 'initial', label: 'Initial Value', type: 'number', defaultValue: 100, step: 'any' },
      { id: 'final', label: 'Final Value', type: 'number', defaultValue: 135, step: 'any' },
    ],
    calculate: (inputs) => {
      const init = Number(inputs.initial);
      const fin = Number(inputs.final);
      if (isNaN(init) || isNaN(fin)) return { primary: { label: 'Result', value: 'Invalid input' }, error: 'Please enter valid numbers.' };
      if (init === 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'Initial value cannot be zero because growth from zero is mathematically undefined.' };
      const diff = fin - init;
      const pct = (diff / Math.abs(init)) * 100;
      return {
        primary: { label: 'Percentage Increase', value: Number(pct.toFixed(2)), unit: '%', badge: pct >= 0 ? 'Increase' : 'Decrease' },
        details: [
          { label: 'Absolute Difference', value: diff.toFixed(2) },
          { label: 'Initial Value', value: init },
          { label: 'Final Value', value: fin },
        ],
        summary: `From ${init} to ${fin} is an increase of ${pct.toFixed(2)}%`,
      };
    },
    relatedSlugs: ['percentage-calculator', 'percentage-decrease-calculator', 'percentage-difference-calculator'],
    isPopular: true,
  },
  {
    id: 'percentage-decrease-calculator',
    slug: 'percentage-decrease-calculator',
    title: 'Percentage Decrease Calculator',
    shortTitle: 'Percentage Decrease',
    category: 'math',
    description: 'Calculate the percentage reduction or decline from an original value to a lower value.',
    seoTitle: 'Percentage Decrease Calculator – Calculate Price Drops & Decline | Benix Space',
    metaDescription: 'Quickly find the percentage decrease from an initial number to a smaller number. Ideal for discounts, losses, and reductions.',
    keywords: ['percentage decrease calculator', 'percent decrease', 'discount percent', 'percentage drop calculator'],
    formula: 'Decrease (%) = ((Initial - Final) / Initial) × 100',
    formulaExplanation: 'Subtract the final value from the initial value, divide by the initial value, and multiply by 100.',
    example: {
      title: 'Price drop from $80 to $60',
      inputs: { initial: 80, final: 60 },
      output: '25% Decrease',
      steps: ['Difference: 80 - 60 = 20', 'Divide by initial: 20 / 80 = 0.25', 'Multiply by 100: 25%'],
    },
    explanation: 'Percentage decrease measures how much a value drops relative to its starting point. It is widely used in retail discount sales, budget cuts, weight loss tracking, and depreciation calculations.',
    faqs: [
      {
        question: 'How is percentage decrease different from discount?',
        answer: 'They use the exact same formula. A price drop from $100 to $80 represents a 20% discount or a 20% decrease.',
      },
    ],
    inputs: [
      { id: 'initial', label: 'Initial Value', type: 'number', defaultValue: 80, step: 'any' },
      { id: 'final', label: 'Final Value', type: 'number', defaultValue: 60, step: 'any' },
    ],
    calculate: (inputs) => {
      const init = Number(inputs.initial);
      const fin = Number(inputs.final);
      if (isNaN(init) || isNaN(fin)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };
      if (init === 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'Initial value cannot be zero.' };
      const diff = init - fin;
      const pct = (diff / init) * 100;
      return {
        primary: { label: 'Percentage Decrease', value: Number(pct.toFixed(2)), unit: '%', badge: pct >= 0 ? 'Reduction' : 'Negative Reduction' },
        details: [
          { label: 'Amount Reduced', value: diff.toFixed(2) },
          { label: 'Starting Value', value: init },
          { label: 'Ending Value', value: fin },
        ],
        summary: `A decrease of ${pct.toFixed(2)}% (reduced by ${diff})`,
      };
    },
    relatedSlugs: ['percentage-calculator', 'percentage-increase-calculator', 'discount-calculator'],
  },
  {
    id: 'percentage-difference-calculator',
    slug: 'percentage-difference-calculator',
    title: 'Percentage Difference Calculator',
    shortTitle: 'Percentage Diff',
    category: 'math',
    description: 'Calculate the percentage difference between two non-zero positive numbers where neither is the initial reference.',
    seoTitle: 'Percentage Difference Calculator – Compare Two Numbers | Benix Space',
    metaDescription: 'Find the relative percentage difference between two numbers using their average. Free and fast calculator.',
    keywords: ['percentage difference calculator', 'percent difference', 'compare two values percentage'],
    formula: 'Diff (%) = (|V1 - V2| / ((V1 + V2) / 2)) × 100',
    formulaExplanation: 'Divide the absolute difference between the two numbers by their arithmetic mean, and multiply by 100.',
    example: {
      title: 'Difference between 40 and 50',
      inputs: { val1: 40, val2: 50 },
      output: '22.22%',
      steps: ['Absolute diff: |40 - 50| = 10', 'Average: (40 + 50) / 2 = 45', 'Divide & multiply: (10 / 45) × 100 = 22.22%'],
    },
    explanation: 'Percentage difference is used when comparing two values that belong to the same category where neither is considered a prior or starting baseline (for example, comparing test scores of two individuals or heights of two buildings).',
    faqs: [
      {
        question: 'When should I use percentage difference instead of percentage change?',
        answer: 'Use percentage change when there is a chronological progression from an "old" value to a "new" value. Use percentage difference when comparing two static numbers.',
      },
    ],
    inputs: [
      { id: 'val1', label: 'First Value', type: 'number', defaultValue: 40, step: 'any' },
      { id: 'val2', label: 'Second Value', type: 'number', defaultValue: 50, step: 'any' },
    ],
    calculate: (inputs) => {
      const v1 = Number(inputs.val1);
      const v2 = Number(inputs.val2);
      if (isNaN(v1) || isNaN(v2)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };
      const avg = (v1 + v2) / 2;
      if (avg === 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'Average of both values cannot be zero.' };
      const diff = Math.abs(v1 - v2);
      const pct = (diff / avg) * 100;
      return {
        primary: { label: 'Percentage Difference', value: Number(pct.toFixed(2)), unit: '%' },
        details: [
          { label: 'Absolute Difference', value: diff.toFixed(2) },
          { label: 'Average of Values', value: avg.toFixed(2) },
        ],
        summary: `The percentage difference between ${v1} and ${v2} is ${pct.toFixed(2)}%`,
      };
    },
    relatedSlugs: ['percentage-calculator', 'percentage-increase-calculator'],
  },
  {
    id: 'fraction-calculator',
    slug: 'fraction-calculator',
    title: 'Fraction Calculator',
    shortTitle: 'Fractions',
    category: 'math',
    description: 'Add, subtract, multiply, and divide fractions with step-by-step reduction to simplest terms.',
    seoTitle: 'Fraction Calculator – Add, Subtract, Multiply & Divide | Benix Space',
    metaDescription: 'Free online fraction calculator. Add, subtract, multiply, and divide fractions with automated reduction to lowest terms and mixed fractions.',
    keywords: ['fraction calculator', 'add fractions', 'fraction reducer', 'multiplying fractions', 'math fraction solver'],
    formula: 'a/b ± c/d = (ad ± bc)/bd | (a/b) × (c/d) = ac/bd',
    formulaExplanation: 'Perform arithmetic on numerators and denominators, then reduce by greatest common factor.',
    example: {
      title: 'Add 1/2 + 2/3',
      inputs: { n1: 1, d1: 2, op: '+', n2: 2, d2: 3 },
      output: '7/6 (1 1/6)',
      steps: ['Common denominator: 2 × 3 = 6', 'Convert numerators: (1×3) + (2×2) = 3 + 4 = 7', 'Result: 7/6'],
    },
    explanation: 'Fractions represent parts of a whole consisting of an upper numerator and lower denominator. This calculator supports fundamental arithmetic operations on fractions, automates the finding of common denominators, simplifies the resulting fraction to simplest form, and provides mixed number equivalents.',
    faqs: [
      {
        question: 'What is a common denominator?',
        answer: 'A common denominator is a shared multiple of the denominators of two or more fractions, allowing them to be added or subtracted.',
      },
    ],
    inputs: [
      { id: 'n1', label: 'Numerator 1', type: 'number', defaultValue: 1, step: '1' },
      { id: 'd1', label: 'Denominator 1', type: 'number', defaultValue: 2, step: '1' },
      {
        id: 'op',
        label: 'Operation',
        type: 'select',
        defaultValue: '+',
        options: [
          { label: 'Add (+)', value: '+' },
          { label: 'Subtract (-)', value: '-' },
          { label: 'Multiply (×)', value: '*' },
          { label: 'Divide (÷)', value: '/' },
        ],
      },
      { id: 'n2', label: 'Numerator 2', type: 'number', defaultValue: 2, step: '1' },
      { id: 'd2', label: 'Denominator 2', type: 'number', defaultValue: 3, step: '1' },
    ],
    calculate: (inputs) => {
      const n1 = parseInt(inputs.n1, 10);
      const d1 = parseInt(inputs.d1, 10);
      const n2 = parseInt(inputs.n2, 10);
      const d2 = parseInt(inputs.d2, 10);
      const op = inputs.op || '+';

      if (isNaN(n1) || isNaN(d1) || isNaN(n2) || isNaN(d2)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter integers.' };
      if (d1 === 0 || d2 === 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'Denominators cannot be zero.' };

      const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

      let resN = 0;
      let resD = 1;

      if (op === '+') {
        resN = n1 * d2 + n2 * d1;
        resD = d1 * d2;
      } else if (op === '-') {
        resN = n1 * d2 - n2 * d1;
        resD = d1 * d2;
      } else if (op === '*') {
        resN = n1 * n2;
        resD = d1 * d2;
      } else if (op === '/') {
        if (n2 === 0) return { primary: { label: 'Result', value: 'Division by zero' }, error: 'Cannot divide by a zero fraction.' };
        resN = n1 * d2;
        resD = d1 * n2;
      }

      if (resD < 0) {
        resN = -resN;
        resD = -resD;
      }

      const div = gcd(resN, resD);
      const simN = resN / div;
      const simD = resD / div;

      // Mixed fraction
      let mixedStr = '';
      if (Math.abs(simN) >= simD && simD !== 1) {
        const wholePart = Math.trunc(simN / simD);
        const remN = Math.abs(simN % simD);
        if (remN !== 0) mixedStr = `${wholePart} ${remN}/${simD}`;
      }

      return {
        primary: {
          label: 'Simplified Fraction',
          value: simD === 1 ? simN.toString() : `${simN}/${simD}`,
          badge: mixedStr ? `Mixed: ${mixedStr}` : undefined,
        },
        details: [
          { label: 'Decimal Equivalent', value: (simN / simD).toFixed(6) },
          { label: 'Unsimplified', value: `${resN}/${resD}` },
          { label: 'Greatest Common Divisor', value: div },
        ],
        summary: `Result of (${n1}/${d1}) ${op} (${n2}/${d2}) = ${simN}/${simD} (${(simN / simD).toFixed(4)})`,
      };
    },
    relatedSlugs: ['mixed-fraction-calculator', 'decimal-to-fraction-calculator', 'fraction-to-decimal-calculator', 'ratio-calculator'],
  },
  {
    id: 'decimal-to-fraction-calculator',
    slug: 'decimal-to-fraction-calculator',
    title: 'Decimal to Fraction Calculator',
    shortTitle: 'Decimal to Fraction',
    category: 'math',
    description: 'Convert any decimal number into its exact simplified fraction and mixed number equivalent.',
    seoTitle: 'Decimal to Fraction Calculator – Convert Decimals | Benix Space',
    metaDescription: 'Convert decimal numbers to fractions quickly. Automatically simplifies to lowest terms with mixed fraction output.',
    keywords: ['decimal to fraction', 'convert decimal to fraction', 'decimal fraction converter'],
    formula: 'Decimal D = D × (10^k / 10^k) = Simplified Fraction',
    formulaExplanation: 'Count decimal places k, multiply numerator and denominator by 10^k, then simplify using greatest common divisor.',
    example: {
      title: 'Convert 0.75',
      inputs: { decimal: 0.75 },
      output: '3/4',
      steps: ['0.75 has 2 decimal digits: 75/100', 'GCD of 75 and 100 is 25', 'Divide by 25: 3/4'],
    },
    explanation: 'Converting decimals to fractions helps in precision calculations, construction, cooking measurements, and mathematical proofs where exact fractional representations prevent floating-point rounding errors.',
    faqs: [
      {
        question: 'Can all decimals be converted to fractions?',
        answer: 'All terminating and repeating decimals are rational numbers and can be converted to fractions. Irrational numbers (like π or √2) cannot be represented as simple fractions.',
      },
    ],
    inputs: [
      { id: 'decimal', label: 'Decimal Number', type: 'number', defaultValue: 0.625, step: 'any' },
    ],
    calculate: (inputs) => {
      const dec = Number(inputs.decimal);
      if (isNaN(dec)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid decimal number.' };

      const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
      const str = dec.toString();
      const parts = str.split('.');
      if (parts.length === 1) {
        return {
          primary: { label: 'Fraction', value: `${dec}/1` },
          details: [{ label: 'Whole Number', value: dec }],
        };
      }

      const decPlaces = parts[1].length;
      const denominator = Math.pow(10, decPlaces);
      const numerator = Math.round(dec * denominator);
      const div = gcd(numerator, denominator);
      const simN = numerator / div;
      const simD = denominator / div;

      return {
        primary: { label: 'Fraction', value: `${simN}/${simD}` },
        details: [
          { label: 'Decimal Input', value: dec },
          { label: 'Unreduced', value: `${numerator}/${denominator}` },
          { label: 'Simplification GCD', value: div },
        ],
        summary: `${dec} = ${simN}/${simD}`,
      };
    },
    relatedSlugs: ['fraction-to-decimal-calculator', 'fraction-calculator', 'mixed-fraction-calculator'],
  },
  {
    id: 'fraction-to-decimal-calculator',
    slug: 'fraction-to-decimal-calculator',
    title: 'Fraction to Decimal Calculator',
    shortTitle: 'Fraction to Decimal',
    category: 'math',
    description: 'Convert any proper, improper, or mixed fraction into an exact decimal value.',
    seoTitle: 'Fraction to Decimal Calculator – Fast & Free | Benix Space',
    metaDescription: 'Convert fractions to decimals instantly. Simple, fast online tool with step-by-step division explanations.',
    keywords: ['fraction to decimal', 'convert fraction to decimal', 'fraction division calculator'],
    formula: 'Decimal = Numerator ÷ Denominator',
    formulaExplanation: 'Divide the numerator by the denominator using long division.',
    example: {
      title: 'Convert 5/8',
      inputs: { numerator: 5, denominator: 8 },
      output: '0.625',
      steps: ['Divide 5 by 8: 5 ÷ 8 = 0.625'],
    },
    explanation: 'Fractions are readily converted to decimals by dividing numerator by denominator. This is useful when working with measurements, financial percentages, digital scales, and CAD engineering software.',
    faqs: [
      {
        question: 'What is a terminating vs repeating decimal?',
        answer: 'A terminating decimal has a finite number of digits (like 1/4 = 0.25). A repeating decimal repeats an infinite sequence (like 1/3 = 0.333...).',
      },
    ],
    inputs: [
      { id: 'numerator', label: 'Numerator', type: 'number', defaultValue: 3, step: '1' },
      { id: 'denominator', label: 'Denominator', type: 'number', defaultValue: 8, step: '1' },
    ],
    calculate: (inputs) => {
      const num = Number(inputs.numerator);
      const den = Number(inputs.denominator);
      if (isNaN(num) || isNaN(den)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };
      if (den === 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'Denominator cannot be zero.' };
      const val = num / den;
      return {
        primary: { label: 'Decimal Value', value: Number(val.toFixed(8)) },
        details: [
          { label: 'Fraction', value: `${num}/${den}` },
          { label: 'Percentage Equivalent', value: `${(val * 100).toFixed(4)}%` },
        ],
        summary: `${num}/${den} = ${val}`,
      };
    },
    relatedSlugs: ['decimal-to-fraction-calculator', 'fraction-calculator'],
  },
  {
    id: 'ratio-calculator',
    slug: 'ratio-calculator',
    title: 'Ratio Calculator',
    shortTitle: 'Ratio',
    category: 'math',
    description: 'Solve, simplify, scale, and compare ratios A:B = C:D with instant missing value solutions.',
    seoTitle: 'Ratio Calculator – Simplify & Solve Ratios Online | Benix Space',
    metaDescription: 'Free ratio calculator to simplify ratios, find equivalent ratios, and solve missing variables in proportions.',
    keywords: ['ratio calculator', 'solve ratio', 'simplify ratio', 'ratio solver', 'aspect ratio calculator'],
    formula: 'A : B = C : D  =>  A × D = B × C',
    formulaExplanation: 'Cross multiply the extremes and means to solve for any unknown term in the ratio proportion.',
    example: {
      title: 'Solve 2:3 = x:15',
      inputs: { a: 2, b: 3, c: 0, d: 15 },
      output: 'x = 10',
      steps: ['Cross multiply: 2 × 15 = 3 × x', '30 = 3x', 'Divide: x = 10'],
    },
    explanation: 'A ratio compares two quantities by division, indicating how many times one number contains another. Ratios are used extensively in cooking recipes, screen aspect ratios (16:9, 4:3), model scales, financial ratios, and mixing chemicals.',
    faqs: [
      {
        question: 'How do you simplify a ratio?',
        answer: 'Divide both terms of the ratio by their greatest common divisor (GCD). For example, 12:18 divides by 6 to give 2:3.',
      },
    ],
    inputs: [
      { id: 'a', label: 'Value A', type: 'number', defaultValue: 4, step: 'any' },
      { id: 'b', label: 'Value B', type: 'number', defaultValue: 6, step: 'any' },
    ],
    calculate: (inputs) => {
      const a = Number(inputs.a);
      const b = Number(inputs.b);
      if (isNaN(a) || isNaN(b)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };
      if (b === 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'B cannot be zero in ratio A:B.' };

      const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
      const g = gcd(Math.round(a), Math.round(b));
      const simpA = Math.round(a) / g;
      const simpB = Math.round(b) / g;

      return {
        primary: { label: 'Simplified Ratio', value: `${simpA} : ${simpB}` },
        details: [
          { label: 'Decimal Quotient (A/B)', value: (a / b).toFixed(4) },
          { label: 'Percentage (A of Total)', value: `${((a / (a + b)) * 100).toFixed(2)}%` },
          { label: 'Percentage (B of Total)', value: `${((b / (a + b)) * 100).toFixed(2)}%` },
        ],
        summary: `The ratio ${a}:${b} simplifies to ${simpA}:${simpB}`,
      };
    },
    relatedSlugs: ['proportion-calculator', 'fraction-calculator', 'percentage-calculator'],
  },
  {
    id: 'average-calculator',
    slug: 'average-calculator',
    title: 'Average Calculator',
    shortTitle: 'Average',
    category: 'math',
    description: 'Calculate the arithmetic average (mean), sum, and count for any list of numbers.',
    seoTitle: 'Average Calculator – Calculate Mean & Sum Online | Benix Space',
    metaDescription: 'Find the average (arithmetic mean) of any set of numbers. Fast, free online calculation with count and sum totals.',
    keywords: ['average calculator', 'mean calculator', 'calculate average', 'find average of numbers'],
    formula: 'Average = (Σx) / n',
    formulaExplanation: 'Sum all individual numbers in the dataset and divide by the total count of numbers.',
    example: {
      title: 'Average of 10, 20, 30, 40',
      inputs: { numbers: '10, 20, 30, 40' },
      output: '25',
      steps: ['Sum: 10 + 20 + 30 + 40 = 100', 'Count: 4 numbers', 'Average: 100 / 4 = 25'],
    },
    explanation: 'The arithmetic average is the central balance point of a dataset. It is the most common measure of central tendency used across school grades, sports statistics, economic metrics, and data science.',
    faqs: [
      {
        question: 'How do you separate numbers in the input?',
        answer: 'You can separate numbers with commas, spaces, or newlines.',
      },
    ],
    inputs: [
      { id: 'numbers', label: 'Numbers (separated by commas or spaces)', type: 'text', defaultValue: '12, 24, 36, 48, 60' },
    ],
    calculate: (inputs) => {
      const raw = String(inputs.numbers || '');
      const nums = raw.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
      if (nums.length === 0) return { primary: { label: 'Result', value: 'No numbers provided' }, error: 'Please enter at least one number.' };
      const sum = nums.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / nums.length;
      return {
        primary: { label: 'Average (Mean)', value: Number(avg.toFixed(4)) },
        details: [
          { label: 'Count (n)', value: nums.length },
          { label: 'Total Sum (Σ)', value: Number(sum.toFixed(4)) },
          { label: 'Minimum', value: Math.min(...nums) },
          { label: 'Maximum', value: Math.max(...nums) },
        ],
        summary: `Average of ${nums.length} values is ${avg.toFixed(2)} (Sum: ${sum})`,
      };
    },
    relatedSlugs: ['mean-calculator', 'median-calculator', 'mode-calculator', 'standard-deviation-calculator'],
    isPopular: true,
  },
  {
    id: 'mean-calculator',
    slug: 'mean-calculator',
    title: 'Mean, Median, Mode Calculator',
    shortTitle: 'Mean Median Mode',
    category: 'math',
    description: 'Calculate mean, median, mode, range, and statistical summary for any dataset.',
    seoTitle: 'Mean Median Mode Calculator – Statistical Analysis | Benix Space',
    metaDescription: 'Calculate mean, median, mode, minimum, maximum, and range online for any dataset with Benix Space Easy Calc.',
    keywords: ['mean median mode calculator', 'median calculator', 'mode calculator', 'statistics calculator'],
    formula: 'Mean = Σx/n | Median = Middle element | Mode = Most frequent value',
    formulaExplanation: 'Mean is the sum divided by count; median is the middle value when sorted; mode is the highest-frequency element.',
    example: {
      title: 'Dataset: 2, 4, 4, 7, 9',
      inputs: { numbers: '2, 4, 4, 7, 9' },
      output: 'Mean: 5.2, Median: 4, Mode: 4',
      steps: ['Mean: (2+4+4+7+9)/5 = 5.2', 'Median: middle sorted item = 4', 'Mode: 4 occurs twice'],
    },
    explanation: 'Mean, median, and mode are the three fundamental pillars of statistical central tendency. The mean provides the arithmetic average, the median resists skew from extreme outliers, and the mode pinpoints the most common observation.',
    faqs: [
      {
        question: 'What if there is no repeated number for the mode?',
        answer: 'If all numbers occur with the same frequency, the dataset has no mode.',
      },
    ],
    inputs: [
      { id: 'numbers', label: 'Dataset (comma or space separated)', type: 'text', defaultValue: '5, 8, 12, 12, 15, 18, 20' },
    ],
    calculate: (inputs) => {
      const raw = String(inputs.numbers || '');
      const nums = raw.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
      if (nums.length === 0) return { primary: { label: 'Result', value: 'Empty' }, error: 'Please enter numbers.' };

      const sorted = [...nums].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const mean = sum / sorted.length;

      // Median
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

      // Mode
      const freq: Record<number, number> = {};
      let maxFreq = 0;
      sorted.forEach((n) => {
        freq[n] = (freq[n] || 0) + 1;
        if (freq[n] > maxFreq) maxFreq = freq[n];
      });
      const modes = Object.keys(freq).filter((k) => freq[Number(k)] === maxFreq && maxFreq > 1).map(Number);
      const modeStr = modes.length > 0 ? modes.join(', ') : 'No mode (all unique)';

      return {
        primary: { label: 'Mean', value: Number(mean.toFixed(4)) },
        details: [
          { label: 'Median', value: median },
          { label: 'Mode', value: modeStr },
          { label: 'Range', value: sorted[sorted.length - 1] - sorted[0] },
          { label: 'Minimum', value: sorted[0] },
          { label: 'Maximum', value: sorted[sorted.length - 1] },
        ],
        summary: `Mean: ${mean.toFixed(2)}, Median: ${median}, Mode: ${modeStr}`,
      };
    },
    relatedSlugs: ['average-calculator', 'standard-deviation-calculator', 'variance-calculator'],
  },
  {
    id: 'standard-deviation-calculator',
    slug: 'standard-deviation-calculator',
    title: 'Standard Deviation Calculator',
    shortTitle: 'Standard Deviation',
    category: 'math',
    description: 'Calculate sample and population standard deviation, variance, and mean with step-by-step variance breakdown.',
    seoTitle: 'Standard Deviation Calculator – Sample & Population | Benix Space',
    metaDescription: 'Free standard deviation and variance calculator. Calculates sample standard deviation (s) and population standard deviation (σ).',
    keywords: ['standard deviation calculator', 'variance calculator', 'population standard deviation', 'sample standard deviation'],
    formula: 's = √[ Σ(x - μ)² / (n - 1) ] | σ = √[ Σ(x - μ)² / N ]',
    formulaExplanation: 'Calculate mean μ, find squared deviations from mean, divide by n-1 for sample or N for population, and take square root.',
    example: {
      title: 'Dataset: 10, 12, 23, 23, 16, 23, 21, 16',
      inputs: { numbers: '10, 12, 23, 23, 16, 23, 21, 16' },
      output: 'Sample s = 5.24',
      steps: ['Mean = 18', 'Sum of squared deviations = 192', 'Divide by (8-1) = 27.43', 'Square root = 5.24'],
    },
    explanation: 'Standard deviation quantifies the amount of dispersion or variation in a set of values. A low standard deviation indicates that the data points tend to be close to the mean, while a high standard deviation indicates that the data points are spread out over a wider range.',
    faqs: [
      {
        question: 'When do I use sample vs population standard deviation?',
        answer: 'Use sample standard deviation (n-1) when your data represents a sample of a larger population. Use population standard deviation (N) when your dataset contains every member of the entire population.',
      },
    ],
    inputs: [
      { id: 'numbers', label: 'Dataset (comma or space separated)', type: 'text', defaultValue: '10, 12, 23, 23, 16, 23, 21, 16' },
    ],
    calculate: (inputs) => {
      const raw = String(inputs.numbers || '');
      const nums = raw.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
      if (nums.length < 2) return { primary: { label: 'Result', value: 'Insufficient data' }, error: 'Please enter at least 2 numbers.' };

      const n = nums.length;
      const mean = nums.reduce((a, b) => a + b, 0) / n;
      const sumSqDiff = nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);

      const sampleVar = sumSqDiff / (n - 1);
      const sampleSD = Math.sqrt(sampleVar);
      const popVar = sumSqDiff / n;
      const popSD = Math.sqrt(popVar);

      return {
        primary: { label: 'Sample Standard Deviation (s)', value: Number(sampleSD.toFixed(4)) },
        details: [
          { label: 'Population Standard Dev (σ)', value: Number(popSD.toFixed(4)) },
          { label: 'Sample Variance (s²)', value: Number(sampleVar.toFixed(4)) },
          { label: 'Population Variance (σ²)', value: Number(popVar.toFixed(4)) },
          { label: 'Mean (μ)', value: Number(mean.toFixed(4)) },
          { label: 'Count (n)', value: n },
        ],
        summary: `Sample SD: ${sampleSD.toFixed(4)}, Population SD: ${popSD.toFixed(4)}`,
      };
    },
    relatedSlugs: ['variance-calculator', 'average-calculator', 'mean-calculator'],
  },
  {
    id: 'square-root-calculator',
    slug: 'square-root-calculator',
    title: 'Square Root Calculator',
    shortTitle: 'Square Root',
    category: 'math',
    description: 'Calculate the principal square root of any positive number with decimal precision.',
    seoTitle: 'Square Root Calculator – Find Square Roots Online | Benix Space',
    metaDescription: 'Find the square root (√x) of any positive number with high precision on Benix Space Easy Calc.',
    keywords: ['square root calculator', 'find square root', 'sqrt calculator', 'square root solver'],
    formula: '√x = r such that r² = x',
    formulaExplanation: 'The principal square root of a non-negative number x is the unique non-negative number r whose square is x.',
    example: {
      title: 'Square root of 144',
      inputs: { number: 144 },
      output: '12',
      steps: ['12 × 12 = 144', 'Therefore √144 = 12'],
    },
    explanation: 'The square root operation is the inverse of squaring a number. It is fundamental in algebra, geometry (Pythagorean theorem), physics, and engineering.',
    faqs: [
      {
        question: 'Can you take the square root of a negative number?',
        answer: 'Within real numbers, negative numbers do not have real square roots. In mathematics, they produce imaginary numbers using the unit i = √(-1).',
      },
    ],
    inputs: [
      { id: 'number', label: 'Number', type: 'number', defaultValue: 144, min: 0, step: 'any' },
    ],
    calculate: (inputs) => {
      const x = Number(inputs.number);
      if (isNaN(x)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid number.' };
      if (x < 0) return { primary: { label: 'Result', value: 'Imaginary' }, error: 'Cannot calculate real square root of negative numbers.' };
      const root = Math.sqrt(x);
      return {
        primary: { label: 'Square Root (√x)', value: Number(root.toFixed(6)) },
        details: [
          { label: 'Radicand (x)', value: x },
          { label: 'Is Perfect Square', value: Number.isInteger(root) ? 'Yes' : 'No' },
        ],
        summary: `√${x} = ${root}`,
      };
    },
    relatedSlugs: ['cube-root-calculator', 'exponent-calculator', 'pythagorean-theorem-calculator'],
  },
  {
    id: 'cube-root-calculator',
    slug: 'cube-root-calculator',
    title: 'Cube Root Calculator',
    shortTitle: 'Cube Root',
    category: 'math',
    description: 'Calculate the cube root (³√x) of any positive or negative real number.',
    seoTitle: 'Cube Root Calculator – Calculate 3√x Online | Benix Space',
    metaDescription: 'Calculate cube roots of positive and negative numbers online with Benix Space Easy Calc.',
    keywords: ['cube root calculator', 'find cube root', 'cbrt calculator'],
    formula: '³√x = r such that r³ = x',
    formulaExplanation: 'The cube root of a number x is the number r such that r multiplied by itself three times equals x.',
    example: {
      title: 'Cube root of 27',
      inputs: { number: 27 },
      output: '3',
      steps: ['3 × 3 × 3 = 27', 'Therefore ³√27 = 3'],
    },
    explanation: 'Unlike square roots, cube roots are defined for all real numbers including negative numbers because an odd power of a negative number is negative (e.g. (-2)³ = -8).',
    faqs: [
      {
        question: 'What is ³√(-64)?',
        answer: 'The cube root of -64 is -4, since (-4) × (-4) × (-4) = -64.',
      },
    ],
    inputs: [
      { id: 'number', label: 'Number', type: 'number', defaultValue: 64, step: 'any' },
    ],
    calculate: (inputs) => {
      const x = Number(inputs.number);
      if (isNaN(x)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid number.' };
      const res = Math.cbrt(x);
      return {
        primary: { label: 'Cube Root (³√x)', value: Number(res.toFixed(6)) },
        details: [
          { label: 'Input Value', value: x },
          { label: 'Verification (r³)', value: Number(Math.pow(res, 3).toFixed(4)) },
        ],
        summary: `³√${x} = ${res}`,
      };
    },
    relatedSlugs: ['square-root-calculator', 'exponent-calculator'],
  },
  {
    id: 'exponent-calculator',
    slug: 'exponent-calculator',
    title: 'Exponent Calculator',
    shortTitle: 'Exponent',
    category: 'math',
    description: 'Calculate base numbers raised to powers and exponents (x^y) with large number support.',
    seoTitle: 'Exponent Calculator – Power & Exponentiation | Benix Space',
    metaDescription: 'Calculate powers and exponents (base^exponent) online. Supports negative powers and decimals with Benix Space Easy Calc.',
    keywords: ['exponent calculator', 'power calculator', 'base raised to power', 'math power calculator'],
    formula: 'x^y = x × x × ... × x (y times)',
    formulaExplanation: 'Multiply base x by itself y times. For negative exponents x^(-y) = 1 / x^y.',
    example: {
      title: '2 raised to power 8',
      inputs: { base: 2, exp: 8 },
      output: '256',
      steps: ['2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 256'],
    },
    explanation: 'Exponentiation is a mathematical operation involving a base and an exponent. It describes repeated multiplication and is vital in compounding interest, scientific notation, and algorithm complexity.',
    faqs: [
      {
        question: 'What is any number to the power of 0?',
        answer: 'Any non-zero number raised to the power of 0 equals 1 (e.g. 5^0 = 1).',
      },
    ],
    inputs: [
      { id: 'base', label: 'Base (x)', type: 'number', defaultValue: 2, step: 'any' },
      { id: 'exp', label: 'Exponent (y)', type: 'number', defaultValue: 10, step: 'any' },
    ],
    calculate: (inputs) => {
      const b = Number(inputs.base);
      const e = Number(inputs.exp);
      if (isNaN(b) || isNaN(e)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };
      const res = Math.pow(b, e);
      return {
        primary: { label: 'Result (xʸ)', value: Math.abs(res) > 1e12 || (Math.abs(res) < 1e-6 && res !== 0) ? res.toExponential(6) : Number(res.toFixed(6)) },
        details: [
          { label: 'Base', value: b },
          { label: 'Exponent', value: e },
          { label: 'Scientific Notation', value: res.toExponential(4) },
        ],
        summary: `${b}^${e} = ${res}`,
      };
    },
    relatedSlugs: ['square-root-calculator', 'scientific-notation-calculator', 'logarithm-calculator'],
  },
  {
    id: 'logarithm-calculator',
    slug: 'logarithm-calculator',
    title: 'Logarithm Calculator',
    shortTitle: 'Logarithm',
    category: 'math',
    description: 'Calculate natural logarithm (ln), common logarithm (log10), and arbitrary base logarithms log_b(x).',
    seoTitle: 'Logarithm Calculator – Log Base 10, ln & Log b | Benix Space',
    metaDescription: 'Free online logarithm calculator. Calculates log base 10, natural log (ln), and custom base logarithms instantly.',
    keywords: ['logarithm calculator', 'log calculator', 'natural log calculator', 'ln calculator', 'log base 10'],
    formula: 'log_b(x) = y <=> b^y = x',
    formulaExplanation: 'Change of base rule: log_b(x) = ln(x) / ln(b).',
    example: {
      title: 'Calculate log10(1000)',
      inputs: { base: 10, x: 1000 },
      output: '3',
      steps: ['10^3 = 1000, so log10(1000) = 3'],
    },
    explanation: 'Logarithms are the inverse of exponentiation. They tell you what exponent a base must be raised to in order to produce a given number. Widely used in acoustics (decibels), seismology (Richter scale), and chemistry (pH values).',
    faqs: [
      {
        question: 'What is ln(x)?',
        answer: 'ln(x) represents the natural logarithm, which uses the mathematical constant e (~2.71828) as its base.',
      },
    ],
    inputs: [
      { id: 'x', label: 'Value (x)', type: 'number', defaultValue: 100, min: 0.000001, step: 'any' },
      { id: 'base', label: 'Base (b)', type: 'number', defaultValue: 10, min: 0.000001, step: 'any' },
    ],
    calculate: (inputs) => {
      const x = Number(inputs.x);
      const b = Number(inputs.base);
      if (isNaN(x) || isNaN(b)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };
      if (x <= 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'x must be strictly greater than 0.' };
      if (b <= 0 || b === 1) return { primary: { label: 'Result', value: 'Undefined' }, error: 'Base must be greater than 0 and not equal to 1.' };

      const res = Math.log(x) / Math.log(b);
      return {
        primary: { label: `log_${b}(${x})`, value: Number(res.toFixed(6)) },
        details: [
          { label: 'Natural Log ln(x)', value: Number(Math.log(x).toFixed(6)) },
          { label: 'Common Log log10(x)', value: Number(Math.log10(x).toFixed(6)) },
          { label: 'Binary Log log2(x)', value: Number(Math.log2(x).toFixed(6)) },
        ],
        summary: `log base ${b} of ${x} is ${res.toFixed(4)}`,
      };
    },
    relatedSlugs: ['exponent-calculator', 'scientific-calculator'],
  },
  {
    id: 'gcf-calculator',
    slug: 'gcf-calculator',
    title: 'GCF & LCM Calculator',
    shortTitle: 'GCF & LCM',
    category: 'math',
    description: 'Find Greatest Common Factor (GCF/HCF) and Least Common Multiple (LCM) of two or more numbers.',
    seoTitle: 'GCF and LCM Calculator – Greatest Common Factor | Benix Space',
    metaDescription: 'Find GCF and LCM of numbers online with prime factorization and step-by-step Euclidean algorithm.',
    keywords: ['gcf calculator', 'lcm calculator', 'greatest common factor', 'least common multiple', 'hcf calculator'],
    formula: 'GCF(a,b) via Euclidean algorithm | LCM(a,b) = |a × b| / GCF(a,b)',
    formulaExplanation: 'The Euclidean algorithm repeatedly replaces numbers with remainders until remainder is 0.',
    example: {
      title: 'GCF and LCM of 24 and 36',
      inputs: { val1: 24, val2: 36 },
      output: 'GCF: 12, LCM: 72',
      steps: ['Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24', 'Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36', 'Highest shared factor: 12'],
    },
    explanation: 'The Greatest Common Factor (GCF) is the largest positive integer that divides each of the numbers without a remainder. The Least Common Multiple (LCM) is the smallest positive integer divisible by all given numbers.',
    faqs: [
      {
        question: 'Are GCF and HCF the same thing?',
        answer: 'Yes! GCF (Greatest Common Factor) and HCF (Highest Common Factor) refer to the exact same concept.',
      },
    ],
    inputs: [
      { id: 'val1', label: 'First Number', type: 'number', defaultValue: 24, step: '1' },
      { id: 'val2', label: 'Second Number', type: 'number', defaultValue: 36, step: '1' },
    ],
    calculate: (inputs) => {
      const a = Math.abs(parseInt(inputs.val1, 10));
      const b = Math.abs(parseInt(inputs.val2, 10));
      if (isNaN(a) || isNaN(b) || a === 0 || b === 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive non-zero integers.' };
      }

      const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
      const g = gcd(a, b);
      const l = (a * b) / g;

      return {
        primary: { label: 'Greatest Common Factor (GCF)', value: g },
        details: [
          { label: 'Least Common Multiple (LCM)', value: l },
          { label: 'Product (A × B)', value: a * b },
        ],
        summary: `For ${a} and ${b}: GCF = ${g}, LCM = ${l}`,
      };
    },
    relatedSlugs: ['prime-number-calculator', 'fraction-calculator', 'modulo-calculator'],
  },
  {
    id: 'prime-number-calculator',
    slug: 'prime-number-calculator',
    title: 'Prime Number & Factorization Calculator',
    shortTitle: 'Prime Numbers',
    category: 'math',
    description: 'Check if a number is prime and find its complete prime factorization decomposition.',
    seoTitle: 'Prime Number Calculator & Factorization | Benix Space',
    metaDescription: 'Check prime status and find prime factors for any number online with Benix Space Easy Calc.',
    keywords: ['prime number calculator', 'prime factorization', 'is it prime', 'find prime factors'],
    formula: 'n = p1^a1 × p2^a2 × ... × pk^ak',
    formulaExplanation: 'By the Fundamental Theorem of Arithmetic, every integer greater than 1 is either prime or a unique product of prime numbers.',
    example: {
      title: 'Factorize 84',
      inputs: { number: 84 },
      output: '2² × 3 × 7 (Composite)',
      steps: ['84 ÷ 2 = 42', '42 ÷ 2 = 21', '21 ÷ 3 = 7', '7 is prime'],
    },
    explanation: 'A prime number is a positive whole number greater than 1 that cannot be formed by multiplying two smaller positive whole numbers. Prime factorization is critical in cryptography (like RSA encryption), hashing algorithms, and number theory.',
    faqs: [
      {
        question: 'Is 1 a prime number?',
        answer: 'No, 1 is not a prime number. By definition, a prime number must have exactly two distinct positive divisors: 1 and itself.',
      },
    ],
    inputs: [
      { id: 'number', label: 'Integer', type: 'number', defaultValue: 84, min: 1, step: '1' },
    ],
    calculate: (inputs) => {
      const n = Math.abs(parseInt(inputs.number, 10));
      if (isNaN(n) || n <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a positive integer.' };
      if (n === 1) return { primary: { label: '1 is Neither', value: 'Unit' }, summary: '1 is neither prime nor composite.' };

      const isPrime = (num: number): boolean => {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
          if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
      };

      const prime = isPrime(n);
      const factors: number[] = [];
      let temp = n;
      for (let f = 2; f * f <= temp; f++) {
        while (temp % f === 0) {
          factors.push(f);
          temp /= f;
        }
      }
      if (temp > 1) factors.push(temp);

      return {
        primary: {
          label: `Status for ${n}`,
          value: prime ? 'Prime Number' : 'Composite Number',
          badge: prime ? 'Prime' : 'Composite',
        },
        details: [
          { label: 'Prime Factorization', value: factors.join(' × ') },
          { label: 'Number of Factors', value: factors.length },
        ],
        summary: `${n} is a ${prime ? 'prime' : 'composite'} number. Prime factors: ${factors.join(' × ')}`,
      };
    },
    relatedSlugs: ['gcf-calculator', 'modulo-calculator'],
  },
  {
    id: 'scientific-calculator',
    slug: 'scientific-calculator',
    title: 'Scientific Calculator',
    shortTitle: 'Scientific',
    category: 'math',
    description: 'Solve scientific expressions including trigonometric functions (sin, cos, tan), roots, logarithms, and constants.',
    seoTitle: 'Scientific Calculator Online – Free & Advanced | Benix Space',
    metaDescription: 'Free online scientific calculator. Evaluate trigonometric functions, logarithms, powers, and expressions.',
    keywords: ['scientific calculator', 'online scientific calculator', 'trig calculator', 'sin cos tan calculator'],
    formula: 'Trigonometry, Logarithms & Exponential functions',
    formulaExplanation: 'Standard mathematical evaluation with support for degrees and radians.',
    example: {
      title: 'sin(30 degrees)',
      inputs: { expression: 'sin(30)' },
      output: '0.5',
      steps: ['Convert 30 degrees to radians: π / 6', 'sin(π / 6) = 0.5'],
    },
    explanation: 'A scientific calculator is essential for higher mathematics, engineering, physics, and computer science. It handles operations beyond basic arithmetic, such as trigonometry, inverse functions, logarithms, and powers.',
    faqs: [
      {
        question: 'Are trigonometric functions evaluated in degrees or radians?',
        answer: 'You can toggle between Degree mode and Radian mode using the selector.',
      },
    ],
    inputs: [
      {
        id: 'func',
        label: 'Function',
        type: 'select',
        defaultValue: 'sin',
        options: [
          { label: 'Sine (sin)', value: 'sin' },
          { label: 'Cosine (cos)', value: 'cos' },
          { label: 'Tangent (tan)', value: 'tan' },
          { label: 'Arcsine (asin)', value: 'asin' },
          { label: 'Arccosine (acos)', value: 'acos' },
          { label: 'Arctangent (atan)', value: 'atan' },
          { label: 'Factorial (n!)', value: 'fact' },
        ],
      },
      { id: 'angle_unit', label: 'Angle Mode', type: 'select', defaultValue: 'deg', options: [{ label: 'Degrees', value: 'deg' }, { label: 'Radians', value: 'rad' }] },
      { id: 'val', label: 'Input Value', type: 'number', defaultValue: 30, step: 'any' },
    ],
    calculate: (inputs) => {
      const func = inputs.func || 'sin';
      const unit = inputs.angle_unit || 'deg';
      const val = Number(inputs.val);
      if (isNaN(val)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid number.' };

      const toRad = (d: number) => (d * Math.PI) / 180;
      const toDeg = (r: number) => (r * 180) / Math.PI;

      let res = 0;
      if (func === 'sin') {
        const rad = unit === 'deg' ? toRad(val) : val;
        res = Math.sin(rad);
      } else if (func === 'cos') {
        const rad = unit === 'deg' ? toRad(val) : val;
        res = Math.cos(rad);
      } else if (func === 'tan') {
        const rad = unit === 'deg' ? toRad(val) : val;
        res = Math.tan(rad);
      } else if (func === 'asin') {
        if (val < -1 || val > 1) return { primary: { label: 'Result', value: 'Out of domain' }, error: 'Arcsine domain is [-1, 1].' };
        res = unit === 'deg' ? toDeg(Math.asin(val)) : Math.asin(val);
      } else if (func === 'acos') {
        if (val < -1 || val > 1) return { primary: { label: 'Result', value: 'Out of domain' }, error: 'Arccosine domain is [-1, 1].' };
        res = unit === 'deg' ? toDeg(Math.acos(val)) : Math.acos(val);
      } else if (func === 'atan') {
        res = unit === 'deg' ? toDeg(Math.atan(val)) : Math.atan(val);
      } else if (func === 'fact') {
        const intVal = Math.round(val);
        if (intVal < 0 || intVal > 170) return { primary: { label: 'Result', value: 'Overflow / Invalid' }, error: 'Factorial defined for 0 <= n <= 170.' };
        let f = 1;
        for (let i = 2; i <= intVal; i++) f *= i;
        res = f;
      }

      return {
        primary: { label: `${func}(${val})`, value: Number(res.toFixed(6)) },
        details: [
          { label: 'Angle Mode', value: unit === 'deg' ? 'Degrees (°)' : 'Radians' },
          { label: 'Exact Output', value: res.toString() },
        ],
        summary: `${func}(${val}) = ${res.toFixed(6)}`,
      };
    },
    relatedSlugs: ['percentage-calculator', 'square-root-calculator', 'logarithm-calculator', 'exponent-calculator'],
    isPopular: true,
  },
  {
    id: 'modulo-calculator',
    slug: 'modulo-calculator',
    title: 'Modulo Calculator',
    shortTitle: 'Modulo',
    category: 'math',
    description: 'Calculate the modulo (remainder) of integer division a mod b, with quotient breakdown.',
    seoTitle: 'Modulo Calculator – Calculate Mod Online | Benix Space',
    metaDescription: 'Find remainder and quotient of integer division with the Benix Space Modulo Calculator.',
    keywords: ['modulo calculator', 'mod calculator', 'remainder calculator', 'math mod'],
    formula: 'a mod b = r where a = q × b + r, 0 <= r < |b|',
    formulaExplanation: 'Divide a by b to get integer quotient q; remainder r = a - (q × b).',
    example: {
      title: '29 mod 5',
      inputs: { a: 29, b: 5 },
      output: '4 (Quotient: 5)',
      steps: ['29 ÷ 5 = 5 with remainder 4', '5 × 5 + 4 = 29'],
    },
    explanation: 'Modulo arithmetic finds the remainder after division of one number by another. It is foundational in computer science for circular array indices, cryptography (ciphers), clock arithmetic, and calendar calculations.',
    faqs: [
      {
        question: 'What is 10 mod 2?',
        answer: '10 mod 2 is 0 because 10 is perfectly divisible by 2 with no remainder.',
      },
    ],
    inputs: [
      { id: 'a', label: 'Dividend (a)', type: 'number', defaultValue: 29, step: '1' },
      { id: 'b', label: 'Divisor (b)', type: 'number', defaultValue: 5, step: '1' },
    ],
    calculate: (inputs) => {
      const a = parseInt(inputs.a, 10);
      const b = parseInt(inputs.b, 10);
      if (isNaN(a) || isNaN(b)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter integers.' };
      if (b === 0) return { primary: { label: 'Result', value: 'Undefined' }, error: 'Divisor cannot be zero.' };

      const rem = ((a % b) + b) % b;
      const q = Math.floor((a - rem) / b);
      return {
        primary: { label: `${a} mod ${b}`, value: rem },
        details: [
          { label: 'Quotient (q)', value: q },
          { label: 'Verification', value: `${a} = (${q} × ${b}) + ${rem}` },
        ],
        summary: `${a} mod ${b} = ${rem}`,
      };
    },
    relatedSlugs: ['gcf-calculator', 'prime-number-calculator'],
  },
];
