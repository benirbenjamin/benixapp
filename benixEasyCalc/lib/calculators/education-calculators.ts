import { CalculatorDefinition } from './types';

export const EDUCATION_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'gpa-calculator',
    slug: 'gpa-calculator',
    title: 'GPA & CGPA Calculator',
    shortTitle: 'GPA Calculator',
    category: 'education',
    description: 'Calculate semester Grade Point Average (GPA) and cumulative CGPA on standard 4.0 scale with credit weighting.',
    seoTitle: 'GPA Calculator – College & High School 4.0 Scale | Benix Space',
    metaDescription: 'Calculate college or high school GPA and CGPA on the 4.0 scale. Add courses, letter grades, and credit hours easily.',
    keywords: ['gpa calculator', 'cgpa calculator', 'college gpa', 'high school gpa', '4.0 gpa scale', 'grade point average'],
    aliases: ['gpa', 'cgpa', 'grade point average', 'college grades', 'grades'],
    formula: 'GPA = Σ (Grade Points × Credit Hours) / Σ (Total Credit Hours)',
    formulaExplanation: 'Multiplies grade numerical equivalent (A=4, B=3, C=2, D=1, F=0) by course credit hours, then divides by total credits.',
    example: {
      title: 'Course 1 (A, 4 credits), Course 2 (B, 3 credits)',
      inputs: { g1: 'A', c1: 4, g2: 'B', c2: 3 },
      output: 'GPA 3.57',
      steps: ['Course 1 points: 4.0 × 4 = 16', 'Course 2 points: 3.0 × 3 = 9', 'Total points: 25 / 7 credits = 3.57'],
    },
    explanation: 'Grade Point Average (GPA) is the standard metric used by academic institutions to evaluate a student’s scholastic performance. This calculator computes both weighted course GPAs and allows factoring in previous cumulative CGPA totals.',
    faqs: [
      {
        question: 'What letter grades correspond to which 4.0 scale points?',
        answer: 'Standard 4.0 scale: A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, D=1.0, F=0.0.',
      },
    ],
    inputs: [
      { id: 'c1_grade', label: 'Course 1 Grade', type: 'select', defaultValue: 'A', options: [{ label: 'A (4.0)', value: '4.0' }, { label: 'A- (3.7)', value: '3.7' }, { label: 'B+ (3.3)', value: '3.3' }, { label: 'B (3.0)', value: '3.0' }, { label: 'B- (2.7)', value: '2.7' }, { label: 'C+ (2.3)', value: '2.3' }, { label: 'C (2.0)', value: '2.0' }, { label: 'D (1.0)', value: '1.0' }, { label: 'F (0.0)', value: '0.0' }] },
      { id: 'c1_credits', label: 'Course 1 Credits', type: 'number', defaultValue: 3, step: 1 },
      { id: 'c2_grade', label: 'Course 2 Grade', type: 'select', defaultValue: 'A-', options: [{ label: 'A (4.0)', value: '4.0' }, { label: 'A- (3.7)', value: '3.7' }, { label: 'B+ (3.3)', value: '3.3' }, { label: 'B (3.0)', value: '3.0' }, { label: 'B- (2.7)', value: '2.7' }, { label: 'C+ (2.3)', value: '2.3' }, { label: 'C (2.0)', value: '2.0' }, { label: 'D (1.0)', value: '1.0' }, { label: 'F (0.0)', value: '0.0' }] },
      { id: 'c2_credits', label: 'Course 2 Credits', type: 'number', defaultValue: 4, step: 1 },
      { id: 'c3_grade', label: 'Course 3 Grade', type: 'select', defaultValue: 'B+', options: [{ label: 'A (4.0)', value: '4.0' }, { label: 'A- (3.7)', value: '3.7' }, { label: 'B+ (3.3)', value: '3.3' }, { label: 'B (3.0)', value: '3.0' }, { label: 'B- (2.7)', value: '2.7' }, { label: 'C+ (2.3)', value: '2.3' }, { label: 'C (2.0)', value: '2.0' }, { label: 'D (1.0)', value: '1.0' }, { label: 'F (0.0)', value: '0.0' }] },
      { id: 'c3_credits', label: 'Course 3 Credits', type: 'number', defaultValue: 3, step: 1 },
      { id: 'c4_grade', label: 'Course 4 Grade', type: 'select', defaultValue: 'B', options: [{ label: 'A (4.0)', value: '4.0' }, { label: 'A- (3.7)', value: '3.7' }, { label: 'B+ (3.3)', value: '3.3' }, { label: 'B (3.0)', value: '3.0' }, { label: 'B- (2.7)', value: '2.7' }, { label: 'C+ (2.3)', value: '2.3' }, { label: 'C (2.0)', value: '2.0' }, { label: 'D (1.0)', value: '1.0' }, { label: 'F (0.0)', value: '0.0' }] },
      { id: 'c4_credits', label: 'Course 4 Credits', type: 'number', defaultValue: 3, step: 1 },
    ],
    calculate: (inputs) => {
      const courses = [
        { g: Number(inputs.c1_grade), c: Number(inputs.c1_credits) },
        { g: Number(inputs.c2_grade), c: Number(inputs.c2_credits) },
        { g: Number(inputs.c3_grade), c: Number(inputs.c3_credits) },
        { g: Number(inputs.c4_grade), c: Number(inputs.c4_credits) },
      ];

      let totalPoints = 0;
      let totalCredits = 0;

      courses.forEach((crs) => {
        if (!isNaN(crs.g) && !isNaN(crs.c) && crs.c > 0) {
          totalPoints += crs.g * crs.c;
          totalCredits += crs.c;
        }
      });

      if (totalCredits === 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive credit hours.' };

      const gpa = totalPoints / totalCredits;

      let honor = 'Good Standing';
      if (gpa >= 3.8) honor = 'Summa Cum Laude (High Honors)';
      else if (gpa >= 3.5) honor = 'Magna Cum Laude (Honors)';
      else if (gpa >= 3.0) honor = 'Dean’s List Eligible';

      return {
        primary: { label: 'Semester GPA', value: Number(gpa.toFixed(2)), unit: '/ 4.0', badge: honor },
        details: [
          { label: 'Total Grade Points', value: totalPoints.toFixed(1) },
          { label: 'Total Credit Hours', value: totalCredits },
          { label: 'Honor Standing', value: honor },
        ],
        summary: `Your calculated semester GPA is ${gpa.toFixed(2)} on a 4.0 scale across ${totalCredits} credit hours.`,
      };
    },
    relatedSlugs: ['final-grade-calculator', 'grade-calculator', 'percentage-calculator'],
    isPopular: true,
  },
  {
    id: 'final-grade-calculator',
    slug: 'final-grade-calculator',
    title: 'Final Grade Calculator',
    shortTitle: 'Final Grade',
    category: 'education',
    description: 'Calculate the minimum score required on your final exam to achieve your desired target course grade.',
    seoTitle: 'Final Grade Calculator – Score Needed on Final Exam | Benix Space',
    metaDescription: 'Find what score you need on your final exam to pass the class or get an A. Free online final grade solver.',
    keywords: ['final grade calculator', 'final exam calculator', 'grade needed on final', 'what grade do i need'],
    formula: 'Final Needed = (Target Grade - Current Grade × (1 - Final Weight)) / Final Weight',
    formulaExplanation: 'Determines the final exam score that satisfies the weighted class equation.',
    example: {
      title: 'Current grade 84%, Want 90%, Final is worth 25%',
      inputs: { current: 84, target: 90, weight: 25 },
      output: '108% needed',
      steps: ['Final weight = 0.25', 'Required = (90 - (84 × 0.75)) / 0.25 = (90 - 63) / 0.25 = 108%'],
    },
    explanation: 'The final grade calculator takes the stress out of exam week. By entering your current standing and the percentage weight of the upcoming final test, it reveals exactly what percentage you must score.',
    faqs: [
      {
        question: 'What if the calculated score is over 100%?',
        answer: 'If the needed score exceeds 100%, achieving your desired grade is mathematically impossible without extra credit assignments.',
      },
    ],
    inputs: [
      { id: 'current', label: 'Current Class Grade (%)', type: 'number', defaultValue: 82, min: 0, max: 100, step: 0.5 },
      { id: 'target', label: 'Desired Target Grade (%)', type: 'number', defaultValue: 85, min: 0, max: 100, step: 0.5 },
      { id: 'weight', label: 'Final Exam Weight (%)', type: 'number', defaultValue: 30, min: 1, max: 100, step: 1 },
    ],
    calculate: (inputs) => {
      const cur = Number(inputs.current);
      const tgt = Number(inputs.target);
      const w = Number(inputs.weight) / 100;

      if (isNaN(cur) || isNaN(tgt) || isNaN(w) || w <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter valid grade percentages.' };

      const needed = (tgt - cur * (1 - w)) / w;

      let badge = 'Achievable';
      if (needed > 100) badge = 'Extra Credit Needed (>100%)';
      else if (needed <= 0) badge = 'Guaranteed Target Achieved!';

      return {
        primary: { label: 'Score Needed on Final', value: `${needed.toFixed(1)}%`, badge },
        details: [
          { label: 'Current Standing', value: `${cur}%` },
          { label: 'Target Goal', value: `${tgt}%` },
          { label: 'Final Weight', value: `${(w * 100).toFixed(0)}%` },
        ],
        summary: `You need a score of ${needed.toFixed(1)}% on the final exam to finish with ${tgt}%.`,
      };
    },
    relatedSlugs: ['gpa-calculator', 'grade-calculator', 'percentage-calculator'],
  },
  {
    id: 'grade-calculator',
    slug: 'grade-calculator',
    title: 'Weighted Grade Calculator',
    shortTitle: 'Weighted Grade',
    category: 'education',
    description: 'Calculate your overall course grade by weighting assignments, quizzes, midterms, and homework.',
    seoTitle: 'Weighted Grade Calculator – Class Grade Breakdown | Benix Space',
    metaDescription: 'Free weighted grade calculator. Combine assignments, quizzes, tests, and labs with respective percentage weights.',
    keywords: ['weighted grade calculator', 'class grade calculator', 'grade breakdown', 'calculate course grade'],
    formula: 'Overall Grade = Σ (Category Score × Weight %) / Σ (Weights %)',
    formulaExplanation: 'Multiplies each assessment percentage score by its syllabus weight percentage.',
    example: {
      title: 'Homework 95% (20%), Midterm 80% (30%), Final 88% (50%)',
      inputs: { g1: 95, w1: 20, g2: 80, w2: 30, g3: 88, w3: 50 },
      output: '87.0% (B+)',
      steps: ['0.95×20 + 0.80×30 + 0.88×50 = 19 + 24 + 44 = 87.0%'],
    },
    explanation: 'Many college and high school courses use weighted categories rather than simple points systems. This calculator helps you see where you stand and which categories have the greatest impact on your final score.',
    faqs: [
      {
        question: 'What if my category weights do not add up to 100%?',
        answer: 'The calculator automatically normalizes by dividing by the sum of your entered weights.',
      },
    ],
    inputs: [
      { id: 'g1', label: 'Homework / Quizzes Score (%)', type: 'number', defaultValue: 92, step: 1 },
      { id: 'w1', label: 'Homework Weight (%)', type: 'number', defaultValue: 25, step: 1 },
      { id: 'g2', label: 'Midterm Exam Score (%)', type: 'number', defaultValue: 78, step: 1 },
      { id: 'w2', label: 'Midterm Weight (%)', type: 'number', defaultValue: 35, step: 1 },
      { id: 'g3', label: 'Projects / Labs Score (%)', type: 'number', defaultValue: 88, step: 1 },
      { id: 'w3', label: 'Projects Weight (%)', type: 'number', defaultValue: 40, step: 1 },
    ],
    calculate: (inputs) => {
      const g1 = Number(inputs.g1);
      const w1 = Number(inputs.w1);
      const g2 = Number(inputs.g2);
      const w2 = Number(inputs.w2);
      const g3 = Number(inputs.g3);
      const w3 = Number(inputs.w3);

      const totalWeight = w1 + w2 + w3;
      if (totalWeight <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Total weight must be positive.' };

      const finalGrade = (g1 * w1 + g2 * w2 + g3 * w3) / totalWeight;

      let letter = 'F';
      if (finalGrade >= 93) letter = 'A';
      else if (finalGrade >= 90) letter = 'A-';
      else if (finalGrade >= 87) letter = 'B+';
      else if (finalGrade >= 83) letter = 'B';
      else if (finalGrade >= 80) letter = 'B-';
      else if (finalGrade >= 77) letter = 'C+';
      else if (finalGrade >= 70) letter = 'C';
      else if (finalGrade >= 60) letter = 'D';

      return {
        primary: { label: 'Overall Weighted Grade', value: `${finalGrade.toFixed(2)}%`, badge: `Letter Grade: ${letter}` },
        details: [
          { label: 'Letter Equivalent', value: letter },
          { label: 'Total Weight Accounted', value: `${totalWeight}%` },
        ],
        summary: `Your overall course grade is ${finalGrade.toFixed(2)}% (${letter}).`,
      };
    },
    relatedSlugs: ['gpa-calculator', 'final-grade-calculator'],
  },
];
