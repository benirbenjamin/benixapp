'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CalculatorFAQ } from '../lib/calculators/types';

interface FAQAccordionProps {
  faqs: CalculatorFAQ[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900/60"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-900 transition-colors hover:text-blue-600 focus:outline-none dark:text-white dark:hover:text-blue-400"
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                  isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-5 pt-3 pb-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
