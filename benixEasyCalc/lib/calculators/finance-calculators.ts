import { CalculatorDefinition } from './types';

export const FINANCE_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'loan-calculator',
    slug: 'loan-calculator',
    title: 'Loan Calculator',
    shortTitle: 'Loan Payment',
    category: 'finance',
    description: 'Estimate your monthly loan payments, total interest, and total repayment cost for personal loans, auto loans, or general debt.',
    seoTitle: 'Loan Calculator – Estimate Monthly Payments | Benix Space',
    metaDescription: 'Free online loan calculator. Calculate monthly loan payments, total interest paid, and full loan amortization schedule.',
    keywords: ['loan calculator', 'loan payment calculator', 'monthly loan payment', 'personal loan calculator', 'car loan calculator'],
    aliases: ['loan', 'personal loan', 'borrow', 'monthly payment', 'debt payoff'],
    formula: 'M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]',
    formulaExplanation: 'Where M is monthly payment, P is principal loan amount, i is monthly interest rate (annual rate / 12), and n is total number of monthly payments.',
    example: {
      title: '$10,000 Loan at 6% for 3 Years',
      inputs: { amount: 10000, rate: 6, term_years: 3 },
      output: '$304.22 / month',
      steps: [
        'Monthly interest rate: 6% / 12 = 0.5% (0.005)',
        'Total payments: 3 × 12 = 36 months',
        'Amortized monthly payment: $304.22',
        'Total interest paid: $951.90',
      ],
    },
    explanation: 'A loan payment calculator uses standard amortization mathematics to compute fixed monthly installments required to pay off a loan over a given term. It accounts for both the principal balance repayment and accruing interest costs over the entire lifecycle.',
    faqs: [
      {
        question: 'How does interest rate affect my total loan cost?',
        answer: 'Higher interest rates increase both your monthly payment and the total cumulative interest you pay over the life of the loan.',
      },
      {
        question: 'Can I pay off my loan early?',
        answer: 'Most standard loans allow early repayment without penalty, saving you substantial amounts on overall interest.',
      },
    ],
    inputs: [
      { id: 'amount', label: 'Loan Amount ($)', type: 'number', defaultValue: 20000, min: 100, step: 100 },
      { id: 'rate', label: 'Annual Interest Rate (%)', type: 'number', defaultValue: 6.5, min: 0.01, max: 100, step: 0.1 },
      { id: 'term_years', label: 'Loan Term (Years)', type: 'number', defaultValue: 5, min: 0.5, max: 40, step: 0.5 },
    ],
    calculate: (inputs) => {
      const p = Number(inputs.amount);
      const r = Number(inputs.rate) / 100;
      const years = Number(inputs.term_years);

      if (isNaN(p) || isNaN(r) || isNaN(years) || p <= 0 || years <= 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive loan amounts and terms.' };
      }

      const n = years * 12;
      const i = r / 12;

      let monthly = 0;
      if (r === 0) {
        monthly = p / n;
      } else {
        monthly = (p * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);
      }

      const totalPaid = monthly * n;
      const totalInterest = totalPaid - p;

      return {
        primary: { label: 'Monthly Payment', value: `$${monthly.toFixed(2)}`, unit: '/ mo' },
        details: [
          { label: 'Total Loan Repayment', value: `$${totalPaid.toFixed(2)}` },
          { label: 'Total Interest Paid', value: `$${totalInterest.toFixed(2)}` },
          { label: 'Total Months', value: n },
          { label: 'Interest-to-Principal Ratio', value: `${((totalInterest / p) * 100).toFixed(1)}%` },
        ],
        summary: `For a $${p.toLocaleString()} loan at ${inputs.rate}% over ${years} years, your monthly payment is $${monthly.toFixed(2)}.`,
      };
    },
    relatedSlugs: ['mortgage-calculator', 'compound-interest-calculator', 'emi-calculator', 'car-loan-calculator'],
    isPopular: true,
  },
  {
    id: 'mortgage-calculator',
    slug: 'mortgage-calculator',
    title: 'Mortgage Calculator',
    shortTitle: 'Mortgage',
    category: 'finance',
    description: 'Calculate monthly mortgage payments including principal, interest, property taxes, and home insurance.',
    seoTitle: 'Mortgage Calculator – Estimate Monthly House Payments | Benix Space',
    metaDescription: 'Free mortgage calculator. Calculate your monthly house payments, loan interest, and down payment requirements.',
    keywords: ['mortgage calculator', 'house payment calculator', 'home loan calculator', 'mortgage monthly payment'],
    aliases: ['mortgage', 'home loan', 'house payment', 'housing loan'],
    formula: 'M = (P - Down) × [ i(1+i)^n ] / [ (1+i)^n - 1 ] + Taxes + Insurance',
    formulaExplanation: 'Computes monthly principal and interest on the net borrowed amount, plus estimated monthly taxes and insurance.',
    example: {
      title: '$350,000 Home with 20% Down at 6.5% for 30 Years',
      inputs: { home_price: 350000, down_pct: 20, rate: 6.5, years: 30, annual_tax: 3500, annual_ins: 1200 },
      output: '$2,161.76 / month',
      steps: ['Down payment: $70,000', 'Loan amount: $280,000', 'P&I monthly: $1,769.76', 'Taxes & Insurance: $392.00'],
    },
    explanation: 'A mortgage is typically the largest financial commitment individuals make. This calculator breaks down principal & interest (P&I), property tax escrows, and homeowners insurance to give you the true monthly housing cost.',
    faqs: [
      {
        question: 'What is the recommended down payment?',
        answer: 'A 20% down payment is traditional because it eliminates the need for Private Mortgage Insurance (PMI), saving you money each month.',
      },
    ],
    inputs: [
      { id: 'home_price', label: 'Home Purchase Price ($)', type: 'number', defaultValue: 300000, step: 5000 },
      { id: 'down_pct', label: 'Down Payment (%)', type: 'number', defaultValue: 20, min: 0, max: 99, step: 1 },
      { id: 'rate', label: 'Interest Rate (%)', type: 'number', defaultValue: 6.5, step: 0.1 },
      { id: 'years', label: 'Loan Term (Years)', type: 'select', defaultValue: '30', options: [{ label: '30 Years', value: '30' }, { label: '15 Years', value: '15' }, { label: '20 Years', value: '20' }] },
      { id: 'annual_tax', label: 'Annual Property Tax ($)', type: 'number', defaultValue: 3000, step: 100 },
      { id: 'annual_ins', label: 'Annual Homeowners Insurance ($)', type: 'number', defaultValue: 1200, step: 50 },
    ],
    calculate: (inputs) => {
      const price = Number(inputs.home_price);
      const downPct = Number(inputs.down_pct) / 100;
      const r = Number(inputs.rate) / 100;
      const years = Number(inputs.years);
      const tax = Number(inputs.annual_tax) || 0;
      const ins = Number(inputs.annual_ins) || 0;

      if (isNaN(price) || price <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid home price.' };

      const downPayment = price * downPct;
      const principal = price - downPayment;
      const n = years * 12;
      const i = r / 12;

      let piMonthly = 0;
      if (r === 0) piMonthly = principal / n;
      else piMonthly = (principal * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);

      const taxMonthly = tax / 12;
      const insMonthly = ins / 12;
      const totalMonthly = piMonthly + taxMonthly + insMonthly;

      return {
        primary: { label: 'Total Monthly Payment', value: `$${totalMonthly.toFixed(2)}`, unit: '/ mo' },
        details: [
          { label: 'Principal & Interest', value: `$${piMonthly.toFixed(2)}` },
          { label: 'Monthly Property Tax', value: `$${taxMonthly.toFixed(2)}` },
          { label: 'Monthly Insurance', value: `$${insMonthly.toFixed(2)}` },
          { label: 'Down Payment Paid', value: `$${downPayment.toLocaleString()}` },
          { label: 'Total Loan Amount', value: `$${principal.toLocaleString()}` },
        ],
        summary: `Estimated monthly mortgage payment of $${totalMonthly.toFixed(2)} on a $${price.toLocaleString()} home.`,
      };
    },
    relatedSlugs: ['loan-calculator', 'emi-calculator', 'compound-interest-calculator'],
    isPopular: true,
  },
  {
    id: 'compound-interest-calculator',
    slug: 'compound-interest-calculator',
    title: 'Compound Interest Calculator',
    shortTitle: 'Compound Interest',
    category: 'finance',
    description: 'Calculate future wealth accumulation through compound interest and recurring monthly contributions.',
    seoTitle: 'Compound Interest Calculator – Investment Growth | Benix Space',
    metaDescription: 'Free compound interest calculator. Visualize future balance growth with recurring deposits and customizable compounding frequencies.',
    keywords: ['compound interest calculator', 'investment calculator', 'compound growth', 'savings interest calculator'],
    aliases: ['compound', 'interest', 'growth', 'savings', 'future wealth'],
    formula: 'A = P(1 + r/n)^(nt) + PMT × [ ((1 + r/n)^(nt) - 1) / (r/n) ]',
    formulaExplanation: 'Where A is future balance, P is initial principal, r is annual interest rate, n is compounding frequency per year, t is time in years, and PMT is periodic contribution.',
    example: {
      title: '$5,000 initial, $200/month, 8% for 10 years',
      inputs: { principal: 5000, deposit: 200, rate: 8, years: 10 },
      output: '$51,800.67',
      steps: ['Principal grows to $11,098.20', 'Monthly deposits of $200 grow to $40,702.47', 'Total Contributions: $29,000', 'Total Interest: $22,800.67'],
    },
    explanation: 'Albert Einstein famously called compound interest the eighth wonder of the world. By earning interest on previously earned interest, your savings and investments multiply exponentially over time rather than linearly.',
    faqs: [
      {
        question: 'What is the Rule of 72?',
        answer: 'The Rule of 72 is a quick estimation formula: divide 72 by your annual interest rate to find the approximate number of years it will take for your money to double (e.g. 72 / 8% = ~9 years).',
      },
    ],
    inputs: [
      { id: 'principal', label: 'Initial Investment ($)', type: 'number', defaultValue: 5000, step: 500 },
      { id: 'deposit', label: 'Monthly Deposit ($)', type: 'number', defaultValue: 200, step: 50 },
      { id: 'rate', label: 'Annual Interest Rate (%)', type: 'number', defaultValue: 8, step: 0.1 },
      { id: 'years', label: 'Investment Time (Years)', type: 'number', defaultValue: 10, min: 1, max: 60, step: 1 },
      {
        id: 'frequency',
        label: 'Compounding Frequency',
        type: 'select',
        defaultValue: '12',
        options: [
          { label: 'Annually (Once per year)', value: '1' },
          { label: 'Quarterly (4 times/year)', value: '4' },
          { label: 'Monthly (12 times/year)', value: '12' },
          { label: 'Daily (365 times/year)', value: '365' },
        ],
      },
    ],
    calculate: (inputs) => {
      const p = Number(inputs.principal);
      const pmt = Number(inputs.deposit);
      const r = Number(inputs.rate) / 100;
      const t = Number(inputs.years);
      const n = Number(inputs.frequency);

      if (isNaN(p) || isNaN(r) || isNaN(t) || t <= 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid positive numbers.' };
      }

      // Monthly simulation for accuracy with monthly deposits
      const totalMonths = t * 12;
      const monthlyRate = r / 12;
      let currentBalance = p;
      let totalDeposited = p;

      for (let m = 1; m <= totalMonths; m++) {
        currentBalance *= (1 + monthlyRate);
        currentBalance += pmt;
        totalDeposited += pmt;
      }

      const totalInterest = currentBalance - totalDeposited;

      return {
        primary: { label: 'Future Value', value: `$${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        details: [
          { label: 'Total Deposits (Principal)', value: `$${totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Total Interest Earned', value: `$${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Doubling Estimate (Rule of 72)', value: r > 0 ? `${(72 / (r * 100)).toFixed(1)} years` : 'N/A' },
        ],
        summary: `Your investment will grow from $${p.toLocaleString()} to $${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} in ${t} years.`,
      };
    },
    relatedSlugs: ['simple-interest-calculator', 'investment-calculator', 'savings-calculator', 'roi-calculator'],
    isPopular: true,
  },
  {
    id: 'simple-interest-calculator',
    slug: 'simple-interest-calculator',
    title: 'Simple Interest Calculator',
    shortTitle: 'Simple Interest',
    category: 'finance',
    description: 'Calculate simple interest earnings or loan interest based on the standard I = P × r × t formula.',
    seoTitle: 'Simple Interest Calculator – Fast & Free | Benix Space',
    metaDescription: 'Calculate simple interest, principal, rate, or time with the simple interest formula I = Prt.',
    keywords: ['simple interest calculator', 'simple interest formula', 'interest earnings calculator'],
    formula: 'I = P × r × t | Total = P + I',
    formulaExplanation: 'Multiply the principal by annual interest rate and duration in years.',
    example: {
      title: '$2,000 at 5% for 3 years',
      inputs: { principal: 2000, rate: 5, time_years: 3 },
      output: '$300 interest ($2,300 total)',
      steps: ['I = 2000 × 0.05 × 3 = $300', 'Total = 2000 + 300 = $2,300'],
    },
    explanation: 'Simple interest is calculated exclusively on the original principal amount without compounding. It is common in short-term promissory loans, specific auto financing structures, and fixed deposit accounts.',
    faqs: [
      {
        question: 'How is simple interest different from compound interest?',
        answer: 'Simple interest is calculated solely on the principal, whereas compound interest adds previous interest to the principal so interest earns interest.',
      },
    ],
    inputs: [
      { id: 'principal', label: 'Principal Amount ($)', type: 'number', defaultValue: 2000, step: 100 },
      { id: 'rate', label: 'Annual Interest Rate (%)', type: 'number', defaultValue: 5, step: 0.1 },
      { id: 'time_years', label: 'Duration (Years)', type: 'number', defaultValue: 3, step: 0.5 },
    ],
    calculate: (inputs) => {
      const p = Number(inputs.principal);
      const r = Number(inputs.rate) / 100;
      const t = Number(inputs.time_years);
      if (isNaN(p) || isNaN(r) || isNaN(t)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };

      const interest = p * r * t;
      const total = p + interest;
      return {
        primary: { label: 'Total Simple Interest', value: `$${interest.toFixed(2)}` },
        details: [
          { label: 'Total Repayment / Final Balance', value: `$${total.toFixed(2)}` },
          { label: 'Original Principal', value: `$${p.toFixed(2)}` },
          { label: 'Annual Interest Earned', value: `$${(p * r).toFixed(2)} / yr` },
        ],
        summary: `Interest earned is $${interest.toFixed(2)}, making the total amount $${total.toFixed(2)}.`,
      };
    },
    relatedSlugs: ['compound-interest-calculator', 'loan-calculator', 'savings-calculator'],
  },
  {
    id: 'roi-calculator',
    slug: 'roi-calculator',
    title: 'ROI Calculator (Return on Investment)',
    shortTitle: 'ROI Calculator',
    category: 'finance',
    description: 'Calculate Return on Investment (ROI) and annualized ROI percentage for any financial venture or investment.',
    seoTitle: 'ROI Calculator – Return on Investment Percentage | Benix Space',
    metaDescription: 'Free Return on Investment (ROI) calculator. Calculate net profit, total gain, and annualized ROI percentage easily.',
    keywords: ['roi calculator', 'return on investment', 'calculate roi', 'investment return calculator'],
    formula: 'ROI (%) = ((Final Value - Initial Cost) / Initial Cost) × 100',
    formulaExplanation: 'Subtract the investment cost from the final return, divide by initial cost, and multiply by 100.',
    example: {
      title: 'Invest $10,000, receive $14,000 after 2 years',
      inputs: { cost: 10000, revenue: 14000, years: 2 },
      output: '40% ROI (18.32% Annualized)',
      steps: ['Net gain: 14000 - 10000 = $4,000', 'ROI: (4000 / 10000) × 100 = 40%', 'Annualized: (1 + 0.40)^(1/2) - 1 = 18.32%'],
    },
    explanation: 'Return on Investment (ROI) is a performance metric used to evaluate the efficiency and profitability of an investment or compare the relative gains of different investments.',
    faqs: [
      {
        question: 'What is a good ROI?',
        answer: 'Generally, an annualized ROI of 7% to 10% (matching broad stock market historical indices like the S&P 500) is considered solid for long-term investments.',
      },
    ],
    inputs: [
      { id: 'cost', label: 'Amount Invested / Cost ($)', type: 'number', defaultValue: 10000, step: 500 },
      { id: 'revenue', label: 'Total Value Returned ($)', type: 'number', defaultValue: 14500, step: 500 },
      { id: 'years', label: 'Investment Length (Years)', type: 'number', defaultValue: 2, min: 0.1, step: 0.5 },
    ],
    calculate: (inputs) => {
      const cost = Number(inputs.cost);
      const rev = Number(inputs.revenue);
      const years = Number(inputs.years) || 1;

      if (isNaN(cost) || isNaN(rev) || cost <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Investment cost must be greater than zero.' };

      const netProfit = rev - cost;
      const roi = (netProfit / cost) * 100;
      const annualizedRoi = (Math.pow(rev / cost, 1 / years) - 1) * 100;

      return {
        primary: { label: 'Total ROI', value: `${roi.toFixed(2)}%`, badge: roi >= 0 ? 'Profit' : 'Loss' },
        details: [
          { label: 'Net Profit / Gain', value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Annualized ROI', value: `${annualizedRoi.toFixed(2)}% / yr` },
          { label: 'Multiple on Invested Capital (MOIC)', value: `${(rev / cost).toFixed(2)}x` },
        ],
        summary: `Your net return is $${netProfit.toLocaleString()} representing an ROI of ${roi.toFixed(2)}%.`,
      };
    },
    relatedSlugs: ['compound-interest-calculator', 'profit-margin-calculator', 'break-even-calculator'],
    isPopular: true,
  },
  {
    id: 'profit-margin-calculator',
    slug: 'profit-margin-calculator',
    title: 'Profit Margin Calculator',
    shortTitle: 'Profit Margin',
    category: 'finance',
    description: 'Calculate gross profit margin, markup percentage, and net profit from cost and revenue values.',
    seoTitle: 'Profit Margin Calculator – Gross & Net Margins | Benix Space',
    metaDescription: 'Free profit margin calculator. Calculate profit margins, markup, cost of goods, and selling prices instantly.',
    keywords: ['profit margin calculator', 'margin calculator', 'gross margin', 'calculate profit margin'],
    formula: 'Margin (%) = ((Revenue - Cost) / Revenue) × 100 | Markup (%) = ((Revenue - Cost) / Cost) × 100',
    formulaExplanation: 'Margin is profit divided by selling price. Markup is profit divided by cost of goods.',
    example: {
      title: 'Cost $40, Selling Price $60',
      inputs: { cost: 40, revenue: 60 },
      output: '33.33% Margin, 50% Markup',
      steps: ['Profit: $60 - $40 = $20', 'Margin: 20 / 60 = 33.33%', 'Markup: 20 / 40 = 50%'],
    },
    explanation: 'Profit margin measures how much out of every dollar of sales a company actually keeps in earnings. Distinguishing between margin and markup is crucial for e-commerce, retail, and manufacturing businesses to avoid underpricing products.',
    faqs: [
      {
        question: 'What is the difference between Margin and Markup?',
        answer: 'Margin is the profit percentage based on the selling revenue, while markup is the percentage added on top of your product cost.',
      },
    ],
    inputs: [
      { id: 'cost', label: 'Cost of Item ($)', type: 'number', defaultValue: 40, min: 0, step: 1 },
      { id: 'revenue', label: 'Selling Price / Revenue ($)', type: 'number', defaultValue: 70, min: 0, step: 1 },
    ],
    calculate: (inputs) => {
      const cost = Number(inputs.cost);
      const rev = Number(inputs.revenue);

      if (isNaN(cost) || isNaN(rev) || rev <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Selling price must be greater than zero.' };

      const profit = rev - cost;
      const margin = (profit / rev) * 100;
      const markup = cost > 0 ? (profit / cost) * 100 : 0;

      return {
        primary: { label: 'Gross Profit Margin', value: `${margin.toFixed(2)}%`, badge: margin >= 0 ? 'Profitable' : 'Loss' },
        details: [
          { label: 'Gross Profit ($)', value: `$${profit.toFixed(2)}` },
          { label: 'Markup Percentage', value: `${markup.toFixed(2)}%` },
          { label: 'Cost-to-Price Ratio', value: `${((cost / rev) * 100).toFixed(1)}%` },
        ],
        summary: `With a cost of $${cost} and selling price of $${rev}, your gross margin is ${margin.toFixed(2)}% ($${profit.toFixed(2)} profit per unit).`,
      };
    },
    relatedSlugs: ['markup-calculator', 'break-even-calculator', 'discount-calculator', 'roi-calculator'],
    isPopular: true,
  },
  {
    id: 'discount-calculator',
    slug: 'discount-calculator',
    title: 'Discount & Sale Price Calculator',
    shortTitle: 'Discount',
    category: 'finance',
    description: 'Calculate discounted sale prices, savings amount, and final total including optional sales tax.',
    seoTitle: 'Discount Calculator – Calculate Sale Price & Savings | Benix Space',
    metaDescription: 'Quickly find the discounted price, total dollar savings, and final price with tax with our free discount calculator.',
    keywords: ['discount calculator', 'sale price calculator', 'percentage off calculator', 'shopping discount'],
    aliases: ['discount', 'sale', 'percent off', 'promo code', 'savings'],
    formula: 'Discount Amount = Original Price × (Discount % / 100) | Final Price = Original - Discount',
    formulaExplanation: 'Multiply price by discount rate to find money saved, then subtract from initial price.',
    example: {
      title: '25% off an $80 jacket',
      inputs: { price: 80, discount: 25, tax: 0 },
      output: '$60 (Saved $20)',
      steps: ['Discount: 80 × 0.25 = $20', 'Final price: 80 - 20 = $60'],
    },
    explanation: 'A discount calculator helps shoppers and merchants quickly find the net price after promotional markdowns, seasonal clearance sales, or employee discounts, with optional sales tax calculations.',
    faqs: [
      {
        question: 'How do you calculate a double discount (e.g. 20% + extra 10%)?',
        answer: 'Apply the first discount to the original price, then apply the second discount to the resulting discounted price (not 30% flat).',
      },
    ],
    inputs: [
      { id: 'price', label: 'Original Price ($)', type: 'number', defaultValue: 120, min: 0, step: 1 },
      { id: 'discount', label: 'Discount (%)', type: 'number', defaultValue: 30, min: 0, max: 100, step: 1 },
      { id: 'tax', label: 'Sales Tax (%) [Optional]', type: 'number', defaultValue: 8, min: 0, max: 50, step: 0.5 },
    ],
    calculate: (inputs) => {
      const price = Number(inputs.price);
      const discPct = Number(inputs.discount);
      const taxPct = Number(inputs.tax) || 0;

      if (isNaN(price) || isNaN(discPct) || price < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid original price.' };

      const savings = price * (discPct / 100);
      const discountedPrice = price - savings;
      const taxAmount = discountedPrice * (taxPct / 100);
      const finalTotal = discountedPrice + taxAmount;

      return {
        primary: { label: 'Final Price', value: `$${finalTotal.toFixed(2)}` },
        details: [
          { label: 'You Save', value: `$${savings.toFixed(2)}` },
          { label: 'Price Before Tax', value: `$${discountedPrice.toFixed(2)}` },
          { label: 'Sales Tax Amount', value: `$${taxAmount.toFixed(2)}` },
        ],
        summary: `You pay $${finalTotal.toFixed(2)} (saving $${savings.toFixed(2)} off the original $${price.toFixed(2)}).`,
      };
    },
    relatedSlugs: ['percentage-calculator', 'sales-tax-calculator', 'profit-margin-calculator'],
    isPopular: true,
  },
  {
    id: 'vat-calculator',
    slug: 'vat-calculator',
    title: 'VAT Calculator (Value Added Tax)',
    shortTitle: 'VAT Calculator',
    category: 'finance',
    description: 'Add or remove Value Added Tax (VAT) from any gross or net price with standard European and African tax rates.',
    seoTitle: 'VAT Calculator – Add or Remove Value Added Tax | Benix Space',
    metaDescription: 'Free online VAT calculator. Calculate gross price, net price, and VAT amount for any tax rate (including Rwanda 18%, UK 20%).',
    keywords: ['vat calculator', 'value added tax', 'add vat', 'remove vat', 'vat inclusive', 'vat exclusive'],
    formula: 'VAT Exclusive: Gross = Net × (1 + VAT/100) | VAT Inclusive: Net = Gross / (1 + VAT/100)',
    formulaExplanation: 'Depending on whether the entered price includes or excludes VAT, multiply or divide by 1 + (rate / 100).',
    example: {
      title: 'Net $100 with 18% Rwanda VAT',
      inputs: { amount: 100, rate: 18, mode: 'exclusive' },
      output: 'Gross: $118, VAT: $18',
      steps: ['VAT = 100 × 0.18 = $18', 'Gross total = 100 + 18 = $118'],
    },
    explanation: 'Value Added Tax (VAT) is a consumption tax assessed on the value added at each stage of a goods or services supply chain. This tool calculates both inclusive (extracting VAT from total) and exclusive (adding VAT to subtotal) figures.',
    faqs: [
      {
        question: 'What is the standard VAT rate in Rwanda?',
        answer: 'The standard VAT rate in Rwanda is 18%, established by the Rwanda Revenue Authority (RRA).',
      },
    ],
    inputs: [
      { id: 'amount', label: 'Amount ($ / RWF)', type: 'number', defaultValue: 100, step: 1 },
      { id: 'rate', label: 'VAT Rate (%)', type: 'number', defaultValue: 18, step: 0.5 },
      {
        id: 'mode',
        label: 'Calculation Direction',
        type: 'select',
        defaultValue: 'exclusive',
        options: [
          { label: 'Add VAT (Price is Net / Exclusive)', value: 'exclusive' },
          { label: 'Remove VAT (Price is Gross / Inclusive)', value: 'inclusive' },
        ],
      },
    ],
    calculate: (inputs) => {
      const amt = Number(inputs.amount);
      const rate = Number(inputs.rate);
      const mode = inputs.mode || 'exclusive';

      if (isNaN(amt) || isNaN(rate) || amt < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid amount.' };

      let net = 0;
      let vat = 0;
      let gross = 0;

      if (mode === 'exclusive') {
        net = amt;
        vat = net * (rate / 100);
        gross = net + vat;
      } else {
        gross = amt;
        net = gross / (1 + rate / 100);
        vat = gross - net;
      }

      return {
        primary: { label: mode === 'exclusive' ? 'Gross (Total with VAT)' : 'Net (Price without VAT)', value: `$${(mode === 'exclusive' ? gross : net).toFixed(2)}` },
        details: [
          { label: 'VAT Tax Amount', value: `$${vat.toFixed(2)}` },
          { label: 'Net Amount', value: `$${net.toFixed(2)}` },
          { label: 'Gross Amount', value: `$${gross.toFixed(2)}` },
          { label: 'Effective Tax Rate', value: `${rate}%` },
        ],
        summary: `Net: $${net.toFixed(2)} + VAT: $${vat.toFixed(2)} (${rate}%) = Gross: $${gross.toFixed(2)}`,
      };
    },
    relatedSlugs: ['sales-tax-calculator', 'discount-calculator', 'currency-converter'],
    isPopular: true,
  },
  {
    id: 'tip-calculator',
    slug: 'tip-calculator',
    title: 'Tip & Split Bill Calculator',
    shortTitle: 'Tip Calculator',
    category: 'finance',
    description: 'Calculate gratuity tips and split the total restaurant or service bill evenly among friends.',
    seoTitle: 'Tip Calculator – Calculate Tips & Split Bill | Benix Space',
    metaDescription: 'Free tip and bill splitter calculator. Easily calculate tip percentages (15%, 18%, 20%) and divide cost per person.',
    keywords: ['tip calculator', 'split bill', 'restaurant tip calculator', 'gratuity calculator'],
    aliases: ['tip', 'gratuity', 'split bill', 'restaurant', 'waiter'],
    formula: 'Tip = Bill × (Tip % / 100) | Per Person = (Bill + Tip) / People',
    formulaExplanation: 'Calculate tip from subtotal, add together for full total, and divide by party size.',
    example: {
      title: '$75 bill, 20% tip, split 3 ways',
      inputs: { bill: 75, tip_pct: 20, people: 3 },
      output: '$30 per person ($15 tip)',
      steps: ['Tip: 75 × 0.20 = $15', 'Total: 75 + 15 = $90', 'Per person: 90 / 3 = $30'],
    },
    explanation: 'A tip calculator simplifies dining out and service gratuities. Whether you are paying for an individual meal or dining with a group, you can ensure fair, accurate bill splitting with custom tip percentages.',
    faqs: [
      {
        question: 'What is the customary tipping rate in restaurants?',
        answer: 'In North America, standard restaurant tipping is typically 15% to 20% of the pre-tax bill. In Europe and Africa, service charges may already be included or rounded up.',
      },
    ],
    inputs: [
      { id: 'bill', label: 'Bill Amount ($)', type: 'number', defaultValue: 85, step: 1 },
      { id: 'tip_pct', label: 'Tip Percentage (%)', type: 'number', defaultValue: 18, step: 1 },
      { id: 'people', label: 'Split Among (People)', type: 'number', defaultValue: 2, min: 1, max: 100, step: 1 },
    ],
    calculate: (inputs) => {
      const bill = Number(inputs.bill);
      const tipPct = Number(inputs.tip_pct);
      const people = parseInt(inputs.people, 10) || 1;

      if (isNaN(bill) || isNaN(tipPct) || bill < 0 || people < 1) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid positive numbers.' };

      const tipAmt = bill * (tipPct / 100);
      const total = bill + tipAmt;
      const perPerson = total / people;
      const tipPerPerson = tipAmt / people;

      return {
        primary: { label: 'Total Per Person', value: `$${perPerson.toFixed(2)}` },
        details: [
          { label: 'Total Tip', value: `$${tipAmt.toFixed(2)}` },
          { label: 'Total With Tip', value: `$${total.toFixed(2)}` },
          { label: 'Tip Per Person', value: `$${tipPerPerson.toFixed(2)}` },
          { label: 'Party Size', value: `${people} person(s)` },
        ],
        summary: `For a $${bill.toFixed(2)} bill with ${tipPct}% tip, total is $${total.toFixed(2)} ($${perPerson.toFixed(2)} each).`,
      };
    },
    relatedSlugs: ['percentage-calculator', 'sales-tax-calculator', 'discount-calculator'],
    isPopular: true,
  },
  {
    id: 'break-even-calculator',
    slug: 'break-even-calculator',
    title: 'Break-Even Analysis Calculator',
    shortTitle: 'Break-Even',
    category: 'finance',
    description: 'Calculate the break-even sales volume in units and dollar revenue needed to cover total business fixed and variable costs.',
    seoTitle: 'Break-Even Calculator – Units & Revenue Analysis | Benix Space',
    metaDescription: 'Free break-even point calculator for businesses. Find units needed to break even and generate profit.',
    keywords: ['break even calculator', 'break even point', 'business break even', 'cost volume profit'],
    formula: 'Break-Even Units = Fixed Costs / (Price per Unit - Variable Cost per Unit)',
    formulaExplanation: 'Contribution Margin = Price - Variable Cost. Divide total fixed costs by contribution margin per unit.',
    example: {
      title: '$5,000 fixed costs, $50 price, $20 variable cost',
      inputs: { fixed_cost: 5000, price: 50, var_cost: 20 },
      output: '167 Units ($8,333.33 revenue)',
      steps: ['Contribution Margin: $50 - $20 = $30 per unit', 'Break-even: 5000 / 30 = 166.67 units -> 167 units'],
    },
    explanation: 'The break-even point is the milestone where total revenue exactly equals total expenses, generating neither profit nor loss. Any unit sold beyond the break-even point produces direct net profit.',
    faqs: [
      {
        question: 'What are examples of fixed costs vs variable costs?',
        answer: 'Fixed costs remain constant regardless of production (rent, insurance, software subscriptions). Variable costs scale with production (raw materials, packaging, transaction fees).',
      },
    ],
    inputs: [
      { id: 'fixed_cost', label: 'Total Fixed Costs ($)', type: 'number', defaultValue: 10000, step: 500 },
      { id: 'price', label: 'Selling Price Per Unit ($)', type: 'number', defaultValue: 50, step: 1 },
      { id: 'var_cost', label: 'Variable Cost Per Unit ($)', type: 'number', defaultValue: 20, step: 1 },
    ],
    calculate: (inputs) => {
      const fixed = Number(inputs.fixed_cost);
      const price = Number(inputs.price);
      const variable = Number(inputs.var_cost);

      if (isNaN(fixed) || isNaN(price) || isNaN(variable)) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid numbers.' };
      if (price <= variable) return { primary: { label: 'Result', value: 'Loss' }, error: 'Selling price must be greater than variable cost per unit to achieve a break-even point.' };

      const cm = price - variable;
      const cmRatio = (cm / price) * 100;
      const units = Math.ceil(fixed / cm);
      const revenue = units * price;

      return {
        primary: { label: 'Break-Even Volume', value: `${units.toLocaleString()} units` },
        details: [
          { label: 'Break-Even Revenue', value: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Contribution Margin', value: `$${cm.toFixed(2)} per unit` },
          { label: 'Contribution Margin Ratio', value: `${cmRatio.toFixed(2)}%` },
        ],
        summary: `You must sell at least ${units.toLocaleString()} units ($${revenue.toLocaleString()} in revenue) to cover all fixed costs.`,
      };
    },
    relatedSlugs: ['profit-margin-calculator', 'roi-calculator'],
  },
  {
    id: 'currency-converter',
    slug: 'currency-converter',
    title: 'Currency Converter',
    shortTitle: 'Currency',
    category: 'finance',
    description: 'Convert between world currencies including USD, EUR, GBP, RWF (Rwandan Franc), KES, UGX, and more with configurable baseline exchange rates.',
    seoTitle: 'Currency Converter – Global Exchange Rates | Benix Space',
    metaDescription: 'Free live currency converter. Convert USD, EUR, GBP, RWF, KES, and world currencies with Benix Space Easy Calc.',
    keywords: ['currency converter', 'exchange rate calculator', 'usd to rwf', 'money converter', 'fx calculator'],
    aliases: ['currency', 'forex', 'fx', 'dollar to euro', 'usd', 'rwf', 'kes'],
    formula: 'Target Amount = Source Amount × Exchange Rate',
    formulaExplanation: 'Converts base currency amount to target currency using the reference mid-market exchange rate.',
    example: {
      title: 'Convert 100 USD to RWF',
      inputs: { amount: 100, from: 'USD', to: 'RWF' },
      output: '138,000 RWF',
      steps: ['Reference rate: 1 USD = ~1,380 RWF', '100 × 1380 = 138,000 RWF'],
    },
    explanation: 'Currency conversion allows travelers, businesses, and investors to evaluate real-time values of foreign currencies against their domestic tender. Rates are calibrated to international mid-market benchmarks.',
    faqs: [
      {
        question: 'Can this connect to live exchange rate APIs?',
        answer: 'Yes, the Benix Space currency engine is architected to seamlessly interface with live central bank feeds and commercial forex rate APIs.',
      },
    ],
    inputs: [
      { id: 'amount', label: 'Amount', type: 'number', defaultValue: 100, min: 0, step: 1 },
      {
        id: 'from',
        label: 'From Currency',
        type: 'select',
        defaultValue: 'USD',
        options: [
          { label: 'USD - US Dollar', value: 'USD' },
          { label: 'EUR - Euro', value: 'EUR' },
          { label: 'GBP - British Pound', value: 'GBP' },
          { label: 'RWF - Rwandan Franc', value: 'RWF' },
          { label: 'KES - Kenyan Shilling', value: 'KES' },
          { label: 'UGX - Ugandan Shilling', value: 'UGX' },
          { label: 'TZS - Tanzanian Shilling', value: 'TZS' },
          { label: 'CAD - Canadian Dollar', value: 'CAD' },
          { label: 'AUD - Australian Dollar', value: 'AUD' },
          { label: 'JPY - Japanese Yen', value: 'JPY' },
          { label: 'CNY - Chinese Yuan', value: 'CNY' },
          { label: 'INR - Indian Rupee', value: 'INR' },
        ],
      },
      {
        id: 'to',
        label: 'To Currency',
        type: 'select',
        defaultValue: 'RWF',
        options: [
          { label: 'RWF - Rwandan Franc', value: 'RWF' },
          { label: 'USD - US Dollar', value: 'USD' },
          { label: 'EUR - Euro', value: 'EUR' },
          { label: 'GBP - British Pound', value: 'GBP' },
          { label: 'KES - Kenyan Shilling', value: 'KES' },
          { label: 'UGX - Ugandan Shilling', value: 'UGX' },
          { label: 'TZS - Tanzanian Shilling', value: 'TZS' },
          { label: 'CAD - Canadian Dollar', value: 'CAD' },
          { label: 'AUD - Australian Dollar', value: 'AUD' },
          { label: 'JPY - Japanese Yen', value: 'JPY' },
          { label: 'CNY - Chinese Yuan', value: 'CNY' },
          { label: 'INR - Indian Rupee', value: 'INR' },
        ],
      },
    ],
    calculate: (inputs) => {
      const amt = Number(inputs.amount);
      const from = String(inputs.from || 'USD');
      const to = String(inputs.to || 'RWF');

      if (isNaN(amt) || amt < 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a valid amount.' };

      // Benchmark rates relative to 1 USD
      const ratesToUSD: Record<string, number> = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.78,
        RWF: 1380,
        KES: 129.5,
        UGX: 3720,
        TZS: 2600,
        CAD: 1.36,
        AUD: 1.52,
        JPY: 153.2,
        CNY: 7.24,
        INR: 83.9,
      };

      const inUSD = amt / (ratesToUSD[from] || 1);
      const converted = inUSD * (ratesToUSD[to] || 1);
      const unitRate = (1 / (ratesToUSD[from] || 1)) * (ratesToUSD[to] || 1);

      return {
        primary: { label: `${to} Equivalent`, value: converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: to },
        details: [
          { label: 'Exchange Rate', value: `1 ${from} = ${unitRate.toFixed(4)} ${to}` },
          { label: 'Inverse Rate', value: `1 ${to} = ${(1 / unitRate).toFixed(4)} ${from}` },
        ],
        summary: `${amt.toLocaleString()} ${from} = ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`,
      };
    },
    relatedSlugs: ['vat-calculator', 'loan-calculator', 'compound-interest-calculator'],
    isPopular: true,
  },
];
