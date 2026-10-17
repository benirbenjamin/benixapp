export interface InputOption {
  label: string;
  value: string | number;
}

export interface InputField {
  id: string;
  label: string;
  type: 'number' | 'select' | 'text' | 'date' | 'toggle';
  defaultValue: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  unit?: string;
  options?: InputOption[];
  helpText?: string;
}

export interface CalculationResultDetail {
  label: string;
  value: string | number;
  subtext?: string;
}

export interface CalculationResult {
  primary: {
    label: string;
    value: string | number;
    unit?: string;
    badge?: string;
  };
  details?: CalculationResultDetail[];
  notes?: string[];
  summary?: string;
  error?: string;
}

export interface CalculatorFAQ {
  question: string;
  answer: string;
}

export interface CalculatorExample {
  title: string;
  inputs: Record<string, any>;
  output: string;
  steps: string[];
}

export interface CalculatorCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  metaDescription: string;
  iconName: string;
  color: string;
  count?: number;
}

export interface CalculatorDefinition {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  aliases?: string[];
  formula: string;
  formulaExplanation: string;
  example: CalculatorExample;
  explanation: string;
  faqs: CalculatorFAQ[];
  inputs: InputField[];
  calculate: (inputs: Record<string, any>) => CalculationResult;
  relatedSlugs: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
  disclaimer?: string;
}
