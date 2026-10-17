import { CalculatorDefinition } from './types';
import { MATH_CALCULATORS } from './math-calculators';
import { FINANCE_CALCULATORS } from './finance-calculators';
import { TIME_DATE_CALCULATORS } from './time-date-calculators';
import { HEALTH_CALCULATORS } from './health-calculators';
import { CONVERTER_CALCULATORS } from './converter-calculators';
import { GEOMETRY_CALCULATORS } from './geometry-calculators';
import { BUSINESS_CALCULATORS } from './business-calculators';
import { EDUCATION_CALCULATORS } from './education-calculators';
import { EVERYDAY_CALCULATORS } from './everyday-calculators';
import { TECH_CALCULATORS } from './tech-calculators';
import { AGRICULTURE_CALCULATORS } from './agriculture-calculators';
import { AFRICA_CALCULATORS } from './africa-calculators';

export const ALL_CALCULATORS: CalculatorDefinition[] = [
  ...MATH_CALCULATORS,
  ...FINANCE_CALCULATORS,
  ...TIME_DATE_CALCULATORS,
  ...HEALTH_CALCULATORS,
  ...CONVERTER_CALCULATORS,
  ...GEOMETRY_CALCULATORS,
  ...BUSINESS_CALCULATORS,
  ...EDUCATION_CALCULATORS,
  ...EVERYDAY_CALCULATORS,
  ...TECH_CALCULATORS,
  ...AGRICULTURE_CALCULATORS,
  ...AFRICA_CALCULATORS,
];

// Quick dictionary map for O(1) slug lookup
const CALCULATORS_BY_SLUG = new Map<string, CalculatorDefinition>();
ALL_CALCULATORS.forEach((calc) => {
  CALCULATORS_BY_SLUG.set(calc.slug, calc);
});

export function getCalculatorBySlug(slug: string): CalculatorDefinition | undefined {
  return CALCULATORS_BY_SLUG.get(slug);
}

export function getCalculatorsByCategory(category: string): CalculatorDefinition[] {
  return ALL_CALCULATORS.filter((c) => c.category === category);
}

export function getPopularCalculators(): CalculatorDefinition[] {
  return ALL_CALCULATORS.filter((c) => c.isPopular);
}

export function getFeaturedCalculators(): CalculatorDefinition[] {
  return ALL_CALCULATORS.filter((c) => c.isFeatured || c.isPopular).slice(0, 10);
}

export function getRelatedCalculators(current: CalculatorDefinition, limit = 4): CalculatorDefinition[] {
  const result: CalculatorDefinition[] = [];

  // First add explicitly configured related slugs
  if (current.relatedSlugs && current.relatedSlugs.length > 0) {
    for (const slug of current.relatedSlugs) {
      const found = getCalculatorBySlug(slug);
      if (found && found.slug !== current.slug) {
        result.push(found);
      }
      if (result.length >= limit) return result;
    }
  }

  // Then add from the same category
  const sameCategory = ALL_CALCULATORS.filter(
    (c) => c.category === current.category && c.slug !== current.slug && !result.some((r) => r.slug === c.slug)
  );

  for (const c of sameCategory) {
    result.push(c);
    if (result.length >= limit) break;
  }

  return result;
}

export function searchCalculators(query: string): CalculatorDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return ALL_CALCULATORS.filter((calc) => {
    // Exact or partial title match
    if (calc.title.toLowerCase().includes(q)) return true;
    if (calc.shortTitle.toLowerCase().includes(q)) return true;
    if (calc.slug.toLowerCase().includes(q)) return true;
    if (calc.category.toLowerCase().includes(q)) return true;

    // Keywords match
    if (calc.keywords.some((k) => k.toLowerCase().includes(q))) return true;

    // Aliases match (e.g. "kg to lbs", "bmi", "mortgage", "rwf")
    if (calc.aliases && calc.aliases.some((a) => a.toLowerCase().includes(q))) return true;

    // Description match
    if (calc.description.toLowerCase().includes(q)) return true;

    return false;
  }).slice(0, 12);
}
