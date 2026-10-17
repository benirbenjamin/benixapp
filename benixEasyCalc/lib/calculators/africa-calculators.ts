import { CalculatorDefinition } from './types';

export const AFRICA_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'rwf-currency-converter',
    slug: 'rwf-currency-converter',
    title: 'Rwandan Franc (RWF) Currency Converter',
    shortTitle: 'RWF Converter',
    category: 'africa',
    description: 'Convert Rwandan Francs (RWF) to and from USD, EUR, GBP, Kenyan Shilling (KES), Ugandan Shilling (UGX), Tanzanian Shilling (TZS), and Nigerian Naira (NGN).',
    seoTitle: 'Rwandan Franc Converter – RWF to USD, EUR, KES, UGX | Benix Space',
    metaDescription: 'Free Rwandan Franc (RWF) currency exchange calculator. Convert RWF to USD, EUR, GBP, KES, UGX, and African regional currencies.',
    keywords: ['rwf currency converter', 'rwanda franc to usd', 'rwf to usd', 'rwf to kes', 'rwanda exchange rate', 'rwf to eur'],
    aliases: ['rwf', 'rwanda currency', 'rwanda franc', 'usd to rwf', 'rwf to kes'],
    formula: 'Target = RWF Amount × Exchange Rate Benchmark',
    formulaExplanation: 'Based on National Bank of Rwanda (BNR) and international reference exchange benchmarks.',
    example: {
      title: 'Convert 100,000 RWF to USD',
      inputs: { amount: 100000, target: 'USD' },
      output: '$72.46 USD',
      steps: ['1 USD ≈ 1,380 RWF', '100,000 / 1,380 ≈ $72.46 USD'],
    },
    explanation: 'The Rwandan Franc (RWF) is the official currency of the Republic of Rwanda, issued by the National Bank of Rwanda (BNR). This calculator provides rapid conversion estimates for regional cross-border commerce across the East African Community (EAC) and major global reserve currencies.',
    faqs: [
      {
        question: 'What is the currency code and symbol for Rwandan Franc?',
        answer: 'The international ISO currency code is RWF, and it is commonly abbreviated as FRw or RF.',
      },
    ],
    inputs: [
      { id: 'amount', label: 'Amount', type: 'number', defaultValue: 100000, min: 1, step: 1000 },
      {
        id: 'direction',
        label: 'Direction',
        type: 'select',
        defaultValue: 'rwf_to_foreign',
        options: [
          { label: 'RWF → Foreign Currency', value: 'rwf_to_foreign' },
          { label: 'Foreign Currency → RWF', value: 'foreign_to_rwf' },
        ],
      },
      {
        id: 'target',
        label: 'Foreign Currency',
        type: 'select',
        defaultValue: 'USD',
        options: [
          { label: 'USD - United States Dollar', value: 'USD' },
          { label: 'EUR - Euro', value: 'EUR' },
          { label: 'GBP - British Pound', value: 'GBP' },
          { label: 'KES - Kenyan Shilling', value: 'KES' },
          { label: 'UGX - Ugandan Shilling', value: 'UGX' },
          { label: 'TZS - Tanzanian Shilling', value: 'TZS' },
          { label: 'NGN - Nigerian Naira', value: 'NGN' },
        ],
      },
    ],
    calculate: (inputs) => {
      const amt = Number(inputs.amount);
      const dir = inputs.direction || 'rwf_to_foreign';
      const target = inputs.target || 'USD';

      if (isNaN(amt) || amt < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid amount.' };

      // RWF per 1 unit of foreign currency
      const rwfRates: Record<string, number> = {
        USD: 1380,
        EUR: 1500,
        GBP: 1770,
        KES: 10.65,
        UGX: 0.37,
        TZS: 0.53,
        NGN: 0.88,
      };

      const rate = rwfRates[target] || 1380;
      let result = 0;

      if (dir === 'rwf_to_foreign') {
        result = amt / rate;
      } else {
        result = amt * rate;
      }

      return {
        primary: {
          label: dir === 'rwf_to_foreign' ? `Equivalent in ${target}` : `Equivalent in RWF`,
          value: result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          unit: dir === 'rwf_to_foreign' ? target : 'RWF',
        },
        details: [
          { label: 'Benchmark Rate', value: `1 ${target} = ${rate.toLocaleString()} RWF` },
          { label: 'Inverse Rate', value: `1 RWF = ${(1 / rate).toFixed(6)} ${target}` },
          { label: 'Central Bank Reference', value: 'BNR Indicative Benchmark' },
        ],
        summary: dir === 'rwf_to_foreign'
          ? `${amt.toLocaleString()} RWF = ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${target}`
          : `${amt.toLocaleString()} ${target} = ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} RWF`,
      };
    },
    relatedSlugs: ['rwanda-vat-calculator', 'rwanda-paye-calculator', 'currency-converter'],
    isPopular: true,
    isFeatured: true,
  },
  {
    id: 'rwanda-vat-calculator',
    slug: 'rwanda-vat-calculator',
    title: 'Rwanda VAT Calculator (18%)',
    shortTitle: 'Rwanda VAT',
    category: 'africa',
    description: 'Calculate Rwanda standard 18% Value Added Tax (TVA) for goods and services in Rwandan Francs (RWF).',
    seoTitle: 'Rwanda VAT Calculator – 18% Tax in RWF | Benix Space',
    metaDescription: 'Free Rwanda 18% VAT calculator. Add or remove 18% VAT in Rwandan Francs (RWF) compliant with RRA regulations.',
    keywords: ['rwanda vat calculator', 'rwanda 18 vat', 'tva rwanda', 'rwanda tax calculator', 'rra vat calculator'],
    aliases: ['rwanda vat', 'tva', 'rra tax', 'rwanda tax', '18% vat rwanda'],
    formula: 'VAT = Net × 0.18 | Gross = Net × 1.18 | Net = Gross / 1.18',
    formulaExplanation: 'Rwanda Revenue Authority (RRA) statutory standard consumption rate of 18%.',
    example: {
      title: 'Invoice of 100,000 RWF (Net)',
      inputs: { amount: 100000, mode: 'add' },
      output: 'Total: 118,000 RWF (VAT: 18,000 RWF)',
      steps: ['VAT = 100,000 × 0.18 = 18,000 RWF', 'Gross Total = 118,000 RWF'],
    },
    explanation: 'Under Rwanda Revenue Authority (RRA) laws, the standard Value Added Tax rate is 18% on all taxable goods and commercial services. Businesses registered for VAT must collect and remit this tax on sales.',
    faqs: [
      {
        question: 'Who is required to register for VAT in Rwanda?',
        answer: 'Any business with an annual turnover exceeding 20,000,000 RWF is legally required to register for VAT with the RRA.',
      },
    ],
    inputs: [
      { id: 'amount', label: 'Amount in RWF', type: 'number', defaultValue: 100000, min: 1, step: 1000 },
      {
        id: 'mode',
        label: 'Action',
        type: 'select',
        defaultValue: 'add',
        options: [
          { label: 'Add 18% VAT (Price is Net / Exclusive)', value: 'add' },
          { label: 'Remove 18% VAT (Price is Gross / Inclusive)', value: 'remove' },
        ],
      },
    ],
    calculate: (inputs) => {
      const amt = Number(inputs.amount);
      const mode = inputs.mode || 'add';

      if (isNaN(amt) || amt < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid amount.' };

      let net = 0;
      let vat = 0;
      let gross = 0;

      if (mode === 'add') {
        net = amt;
        vat = net * 0.18;
        gross = net + vat;
      } else {
        gross = amt;
        net = gross / 1.18;
        vat = gross - net;
      }

      return {
        primary: {
          label: mode === 'add' ? 'Total (Gross with 18% VAT)' : 'Price Before Tax (Net)',
          value: `${Math.round(mode === 'add' ? gross : net).toLocaleString()} RWF`,
        },
        details: [
          { label: 'VAT Amount (18%)', value: `${Math.round(vat).toLocaleString()} RWF` },
          { label: 'Net Amount', value: `${Math.round(net).toLocaleString()} RWF` },
          { label: 'Gross Amount', value: `${Math.round(gross).toLocaleString()} RWF` },
          { label: 'Tax Authority', value: 'Rwanda Revenue Authority (RRA)' },
        ],
        summary: `Net: ${Math.round(net).toLocaleString()} RWF + 18% VAT: ${Math.round(vat).toLocaleString()} RWF = Total: ${Math.round(gross).toLocaleString()} RWF.`,
      };
    },
    relatedSlugs: ['rwf-currency-converter', 'rwanda-paye-calculator', 'vat-calculator'],
    isPopular: true,
  },
  {
    id: 'rwanda-paye-calculator',
    slug: 'rwanda-paye-calculator',
    title: 'Rwanda PAYE Salary Tax Calculator',
    shortTitle: 'Rwanda PAYE',
    category: 'africa',
    description: 'Calculate employee Pay-As-You-Earn (PAYE) income tax in Rwanda based on the latest Rwanda Revenue Authority (RRA) progressive tax brackets.',
    seoTitle: 'Rwanda PAYE Calculator – Salary Income Tax in RWF | Benix Space',
    metaDescription: 'Free Rwanda PAYE salary tax calculator. Calculate monthly net take-home pay, progressive tax brackets, and pension deductions in RWF.',
    keywords: ['rwanda paye calculator', 'rwanda salary tax', 'paye rra', 'rwanda take home pay', 'rra income tax'],
    formula: 'PAYE = Progressive Bracket Rates (0%, 10%, 20%, 30%) on Taxable Income',
    formulaExplanation: 'First 60,000 RWF is taxed at 0%; next 40,000 RWF at 10%; next 100,000 RWF at 20%; and amount exceeding 200,000 RWF at 30%.',
    example: {
      title: 'Monthly Gross Salary of 350,000 RWF',
      inputs: { gross_salary: 350000 },
      output: 'Net Pay: 281,000 RWF (PAYE: 69,000 RWF)',
      steps: [
        '0 - 60k: 0 RWF',
        '60k - 100k (40k @ 10%): 4,000 RWF',
        '100k - 200k (100k @ 20%): 20,000 RWF',
        '> 200k (150k @ 30%): 45,000 RWF',
        'Total PAYE = 69,000 RWF',
      ],
    },
    explanation: 'In Rwanda, employers deduct Pay-As-You-Earn (PAYE) from employees’ monthly salaries and remit to the Rwanda Revenue Authority (RRA). The progressive tax schedule ensures lower-income earners pay lower rates while higher earnings fall into higher marginal brackets.',
    faqs: [
      {
        question: 'What are the current RRA PAYE tax brackets in Rwanda?',
        answer: 'Monthly taxable income brackets: 0 to 60,000 RWF (0%), 60,001 to 100,000 RWF (10%), 100,001 to 200,000 RWF (20%), and above 200,000 RWF (30%).',
      },
    ],
    inputs: [
      { id: 'gross_salary', label: 'Monthly Gross Salary (RWF)', type: 'number', defaultValue: 300000, min: 0, step: 10000 },
    ],
    calculate: (inputs) => {
      const gross = Number(inputs.gross_salary);
      if (isNaN(gross) || gross < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a positive gross salary.' };

      let paye = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;

      if (gross > 200000) {
        b3 = (gross - 200000) * 0.3;
        b2 = 100000 * 0.2;
        b1 = 40000 * 0.1;
      } else if (gross > 100000) {
        b2 = (gross - 100000) * 0.2;
        b1 = 40000 * 0.1;
      } else if (gross > 60000) {
        b1 = (gross - 60000) * 0.1;
      }

      paye = b1 + b2 + b3;
      const net = gross - paye;
      const effectiveRate = gross > 0 ? (paye / gross) * 100 : 0;

      return {
        primary: { label: 'Monthly Net Take-Home Pay', value: `${Math.round(net).toLocaleString()} RWF` },
        details: [
          { label: 'Total PAYE Tax Deducted', value: `${Math.round(paye).toLocaleString()} RWF` },
          { label: 'Effective Tax Rate', value: `${effectiveRate.toFixed(1)}%` },
          { label: 'Bracket 3 (30% on >200k)', value: `${Math.round(b3).toLocaleString()} RWF` },
          { label: 'Bracket 2 (20% on 100k-200k)', value: `${Math.round(b2).toLocaleString()} RWF` },
          { label: 'Bracket 1 (10% on 60k-100k)', value: `${Math.round(b1).toLocaleString()} RWF` },
          { label: 'Tax-Free Allowance (0-60k)', value: '60,000 RWF (0% Tax)' },
        ],
        summary: `For a monthly gross salary of ${gross.toLocaleString()} RWF, your PAYE tax is ${Math.round(paye).toLocaleString()} RWF (${effectiveRate.toFixed(1)}%), leaving net take-home pay of ${Math.round(net).toLocaleString()} RWF.`,
      };
    },
    relatedSlugs: ['rwf-currency-converter', 'rwanda-vat-calculator', 'salary-calculator'],
    isPopular: true,
  },
];
