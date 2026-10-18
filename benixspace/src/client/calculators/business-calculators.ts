import { CalculatorDefinition } from './types';

export const BUSINESS_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'business-profit-calculator',
    slug: 'business-profit-calculator',
    title: 'Business Profit & Margin Calculator',
    shortTitle: 'Business Profit',
    category: 'business',
    description: 'Calculate gross profit, operating profit, and net net profit margin after deducting cost of goods and operating expenses.',
    seoTitle: 'Business Profit Calculator – Net Profit & Operating Margin | Benix Space',
    metaDescription: 'Free business profit calculator. Calculate gross profit, operating income (EBIT), net profit, and profit margin percentages.',
    keywords: ['business profit calculator', 'net profit calculator', 'gross profit', 'operating profit', 'business margin'],
    formula: 'Gross Profit = Revenue - COGS | Net Profit = Gross Profit - Operating Expenses - Taxes',
    formulaExplanation: 'Iteratively deducts cost of goods sold (COGS), selling/general/admin expenses, and taxes from gross receipts.',
    example: {
      title: '$50,000 Revenue, $20,000 COGS, $15,000 OpEx',
      inputs: { revenue: 50000, cogs: 20000, opex: 15000, tax_rate: 15 },
      output: 'Net Profit: $12,750 (25.5% Margin)',
      steps: ['Gross Profit: 50,000 - 20,000 = $30,000', 'Operating Income: 30,000 - 15,000 = $15,000', 'Tax (15%): $2,250', 'Net: $12,750'],
    },
    explanation: 'Tracking business profitability across the gross, operating, and net stages helps founders and finance teams understand unit economics, control overhead, and maximize owner earnings.',
    faqs: [
      {
        question: 'What is the difference between Gross Profit and Net Profit?',
        answer: 'Gross profit only deducts direct production costs (COGS). Net profit deducts all overhead, administrative costs, interest, and taxes, representing true take-home company profit.',
      },
    ],
    inputs: [
      { id: 'revenue', label: 'Total Revenue / Sales ($)', type: 'number', defaultValue: 50000, step: 1000 },
      { id: 'cogs', label: 'Cost of Goods Sold (COGS) ($)', type: 'number', defaultValue: 20000, step: 500 },
      { id: 'opex', label: 'Operating Expenses (Rent, Payroll, Marketing) ($)', type: 'number', defaultValue: 15000, step: 500 },
      { id: 'tax_rate', label: 'Corporate Tax Rate (%)', type: 'number', defaultValue: 20, step: 1 },
    ],
    calculate: (inputs) => {
      const rev = Number(inputs.revenue);
      const cogs = Number(inputs.cogs);
      const opex = Number(inputs.opex);
      const taxRate = Number(inputs.tax_rate) / 100;

      if (isNaN(rev) || rev <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a positive revenue.' };

      const grossProfit = rev - cogs;
      const grossMargin = (grossProfit / rev) * 100;

      const operatingProfit = grossProfit - opex;
      const operatingMargin = (operatingProfit / rev) * 100;

      const taxAmount = operatingProfit > 0 ? operatingProfit * taxRate : 0;
      const netProfit = operatingProfit - taxAmount;
      const netMargin = (netProfit / rev) * 100;

      return {
        primary: { label: 'Net Profit', value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, badge: `${netMargin.toFixed(1)}% Net Margin` },
        details: [
          { label: 'Gross Profit', value: `$${grossProfit.toLocaleString()} (${grossMargin.toFixed(1)}%)` },
          { label: 'Operating Profit (EBIT)', value: `$${operatingProfit.toLocaleString()} (${operatingMargin.toFixed(1)}%)` },
          { label: 'Taxes Estimated', value: `$${taxAmount.toLocaleString()}` },
          { label: 'Total Expenses', value: `$${(cogs + opex + taxAmount).toLocaleString()}` },
        ],
        summary: `From $${rev.toLocaleString()} revenue, your business generates $${netProfit.toLocaleString()} net profit (${netMargin.toFixed(1)}% net margin).`,
      };
    },
    relatedSlugs: ['profit-margin-calculator', 'break-even-calculator', 'roi-calculator', 'salary-calculator'],
    isPopular: true,
  },
  {
    id: 'salary-calculator',
    slug: 'salary-calculator',
    title: 'Salary to Hourly Wage Calculator',
    shortTitle: 'Salary to Hourly',
    category: 'business',
    description: 'Convert annual salary into hourly rate, weekly paycheck, bi-weekly pay, and monthly income.',
    seoTitle: 'Salary to Hourly Calculator – Annual Salary to Wage | Benix Space',
    metaDescription: 'Convert annual salary to hourly wage, monthly pay, and bi-weekly paycheck with custom working hours and paid time off.',
    keywords: ['salary calculator', 'hourly wage calculator', 'annual to hourly', 'paycheck calculator', 'salary converter'],
    aliases: ['salary', 'hourly', 'wage', 'paycheck', 'annual income'],
    formula: 'Hourly Rate = Annual Salary / (Weeks/Year × Hours/Week)',
    formulaExplanation: 'Assuming 52 standard working weeks per year, divides total compensation by annual contracted hours.',
    example: {
      title: '$65,000 Annual Salary at 40 hours/week',
      inputs: { salary: 65000, hours_per_week: 40, weeks_per_year: 52 },
      output: '$31.25 / hour',
      steps: ['Total hours: 52 × 40 = 2,080 hours', '$65,000 / 2,080 = $31.25 per hour'],
    },
    explanation: 'Converting between salaried compensation and hourly wages is crucial during job offer negotiations, freelance quote estimates, and understanding the true dollar value of overtime work.',
    faqs: [
      {
        question: 'How many work hours are in a typical standard year?',
        answer: 'A standard full-time year (40 hours per week for 52 weeks) totals 2,080 working hours.',
      },
    ],
    inputs: [
      { id: 'salary', label: 'Annual Salary ($)', type: 'number', defaultValue: 60000, step: 1000 },
      { id: 'hours_per_week', label: 'Work Hours per Week', type: 'number', defaultValue: 40, min: 1, max: 80, step: 1 },
      { id: 'weeks_per_year', label: 'Paid Weeks per Year', type: 'number', defaultValue: 52, min: 1, max: 52, step: 1 },
    ],
    calculate: (inputs) => {
      const sal = Number(inputs.salary);
      const hpw = Number(inputs.hours_per_week);
      const wpy = Number(inputs.weeks_per_year) || 52;

      if (isNaN(sal) || isNaN(hpw) || sal <= 0 || hpw <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid salary and hours.' };

      const totalHours = hpw * wpy;
      const hourly = sal / totalHours;
      const weekly = sal / wpy;
      const biweekly = weekly * 2;
      const monthly = sal / 12;
      const daily = hourly * (hpw / 5);

      return {
        primary: { label: 'Hourly Rate Equivalent', value: `$${hourly.toFixed(2)}`, unit: '/ hr' },
        details: [
          { label: 'Monthly Pay', value: `$${monthly.toFixed(2)}` },
          { label: 'Bi-Weekly Paycheck', value: `$${biweekly.toFixed(2)}` },
          { label: 'Weekly Pay', value: `$${weekly.toFixed(2)}` },
          { label: 'Daily Pay (8h equiv)', value: `$${daily.toFixed(2)}` },
          { label: 'Annual Work Hours', value: `${totalHours.toLocaleString()} hrs` },
        ],
        summary: `A $${sal.toLocaleString()} annual salary equals $${hourly.toFixed(2)}/hour ($${monthly.toFixed(2)}/month).`,
      };
    },
    relatedSlugs: ['business-profit-calculator', 'commission-calculator'],
    isPopular: true,
  },
  {
    id: 'commission-calculator',
    slug: 'commission-calculator',
    title: 'Sales Commission Calculator',
    shortTitle: 'Commission',
    category: 'business',
    description: 'Calculate sales commissions, base salary plus commission total compensation, and tiered payouts.',
    seoTitle: 'Sales Commission Calculator – Calculate Commission Earnings | Benix Space',
    metaDescription: 'Calculate sales commission earnings and total compensation from sales volume and commission percentage rate.',
    keywords: ['commission calculator', 'sales commission', 'sales pay calculator', 'commission percentage'],
    formula: 'Commission = Sales Total × (Commission Rate / 100) | Total Pay = Base + Commission',
    formulaExplanation: 'Multiplies generated sales volume by commission rate and adds base salary.',
    example: {
      title: '$50,000 sales at 8% commission + $2,000 base',
      inputs: { sales: 50000, rate: 8, base: 2000 },
      output: '$6,000 total payout ($4,000 commission)',
      steps: ['Commission: 50,000 × 0.08 = $4,000', 'Total: 2,000 + 4,000 = $6,000'],
    },
    explanation: 'Sales commissions align incentives between employers and revenue generators. This tool calculates single-rate commission earnings and total earnings combining base pay.',
    faqs: [
      {
        question: 'What is a typical sales commission rate?',
        answer: 'Commission rates range widely from 5% to 15% in retail and real estate, up to 20% to 30% in enterprise SaaS and high-ticket consulting.',
      },
    ],
    inputs: [
      { id: 'sales', label: 'Total Sales Volume ($)', type: 'number', defaultValue: 30000, step: 500 },
      { id: 'rate', label: 'Commission Rate (%)', type: 'number', defaultValue: 7.5, step: 0.5 },
      { id: 'base', label: 'Base Pay (Salary/Draw) [Optional]', type: 'number', defaultValue: 2500, step: 100 },
    ],
    calculate: (inputs) => {
      const sales = Number(inputs.sales);
      const rate = Number(inputs.rate);
      const base = Number(inputs.base) || 0;

      if (isNaN(sales) || isNaN(rate) || sales < 0 || rate < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid positive numbers.' };

      const commission = sales * (rate / 100);
      const total = base + commission;

      return {
        primary: { label: 'Total Payout', value: `$${total.toFixed(2)}` },
        details: [
          { label: 'Commission Amount', value: `$${commission.toFixed(2)}` },
          { label: 'Base Salary', value: `$${base.toFixed(2)}` },
          { label: 'Commission as % of Total Pay', value: total > 0 ? `${((commission / total) * 100).toFixed(1)}%` : '0%' },
        ],
        summary: `On $${sales.toLocaleString()} sales at ${rate}%, your commission is $${commission.toFixed(2)}, making total pay $${total.toFixed(2)}.`,
      };
    },
    relatedSlugs: ['salary-calculator', 'business-profit-calculator', 'profit-margin-calculator'],
  },
];
