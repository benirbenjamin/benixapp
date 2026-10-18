import { CalculatorDefinition } from './types';

export const GEOMETRY_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'area-calculator',
    slug: 'area-calculator',
    title: 'Area Calculator',
    shortTitle: 'Area',
    category: 'geometry',
    description: 'Calculate the surface area of rectangles, squares, circles, triangles, trapezoids, and ellipses.',
    seoTitle: 'Area Calculator – Calculate 2D Shape Area | Benix Space',
    metaDescription: 'Free area calculator. Calculate the area of rectangle, circle, triangle, trapezoid, and ellipse with instant formulas.',
    keywords: ['area calculator', 'calculate area', 'square footage calculator', 'circle area', 'triangle area'],
    aliases: ['area', 'square footage', 'sq ft', 'surface area 2d'],
    formula: 'Rectangle: A = l × w | Circle: A = π r² | Triangle: A = ½ b × h',
    formulaExplanation: 'Multiplies corresponding linear dimensions according to geometric area proofs.',
    example: {
      title: 'Rectangle 12 m by 8 m',
      inputs: { shape: 'rectangle', dim1: 12, dim2: 8 },
      output: '96 sq units',
      steps: ['Area = length × width = 12 × 8 = 96'],
    },
    explanation: 'Area measures the amount of space inside the boundary of a flat, two-dimensional shape. It is essential in construction, painting, flooring, gardening, real estate appraisal, and land surveying.',
    faqs: [
      {
        question: 'How do you convert square meters to square feet?',
        answer: 'Multiply square meters by 10.7639 to get square feet.',
      },
    ],
    inputs: [
      {
        id: 'shape',
        label: 'Geometric Shape',
        type: 'select',
        defaultValue: 'rectangle',
        options: [
          { label: 'Rectangle (Length × Width)', value: 'rectangle' },
          { label: 'Circle (Radius r)', value: 'circle' },
          { label: 'Triangle (Base × Height)', value: 'triangle' },
          { label: 'Square (Side s)', value: 'square' },
        ],
      },
      { id: 'dim1', label: 'Primary Dimension (Length / Radius / Base / Side)', type: 'number', defaultValue: 10, min: 0.01, step: 'any' },
      { id: 'dim2', label: 'Secondary Dimension (Width / Height - if applicable)', type: 'number', defaultValue: 5, min: 0, step: 'any' },
    ],
    calculate: (inputs) => {
      const shape = inputs.shape || 'rectangle';
      const d1 = Number(inputs.dim1);
      const d2 = Number(inputs.dim2);

      if (isNaN(d1) || d1 <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive dimensions.' };

      let area = 0;
      let perimeter = 0;
      let formulaStr = '';

      if (shape === 'rectangle') {
        if (isNaN(d2) || d2 <= 0) return { primary: { label: 'Result', value: 'Missing Width' }, error: 'Please enter positive width.' };
        area = d1 * d2;
        perimeter = 2 * (d1 + d2);
        formulaStr = `${d1} × ${d2}`;
      } else if (shape === 'circle') {
        area = Math.PI * d1 * d1;
        perimeter = 2 * Math.PI * d1;
        formulaStr = `π × ${d1}²`;
      } else if (shape === 'triangle') {
        if (isNaN(d2) || d2 <= 0) return { primary: { label: 'Result', value: 'Missing Height' }, error: 'Please enter positive height.' };
        area = 0.5 * d1 * d2;
        formulaStr = `½ × ${d1} × ${d2}`;
      } else if (shape === 'square') {
        area = d1 * d1;
        perimeter = 4 * d1;
        formulaStr = `${d1}²`;
      }

      return {
        primary: { label: 'Calculated Area', value: Number(area.toFixed(4)), unit: 'sq units' },
        details: [
          { label: 'Formula Used', value: formulaStr },
          { label: 'Perimeter / Circumference', value: perimeter > 0 ? `${perimeter.toFixed(4)} units` : 'N/A' },
        ],
        summary: `The area of the ${shape} is ${area.toFixed(2)} square units.`,
      };
    },
    relatedSlugs: ['volume-calculator', 'circle-calculator', 'pythagorean-theorem-calculator'],
    isPopular: true,
  },
  {
    id: 'circle-calculator',
    slug: 'circle-calculator',
    title: 'Circle Calculator',
    shortTitle: 'Circle',
    category: 'geometry',
    description: 'Calculate area, circumference, diameter, and radius of any circle with step-by-step mathematical breakdown.',
    seoTitle: 'Circle Calculator – Radius, Diameter, Circumference & Area | Benix Space',
    metaDescription: 'Calculate circle circumference, area, diameter, and radius from any single measurement with Benix Space Easy Calc.',
    keywords: ['circle calculator', 'circumference calculator', 'circle area', 'radius to diameter'],
    formula: 'Area: A = π r² | Circumference: C = 2 π r | Diameter: D = 2r',
    formulaExplanation: 'Relationships driven by the mathematical constant pi (π ≈ 3.14159265).',
    example: {
      title: 'Circle with radius 5 cm',
      inputs: { radius: 5 },
      output: 'Area: 78.54 cm², Circumference: 31.42 cm',
      steps: ['Area = π × 5² = 25π ≈ 78.54', 'Circumference = 2 × π × 5 = 10π ≈ 31.42'],
    },
    explanation: 'A circle is the set of all points in a plane that are at a given distance from a center point. It is fundamental to trigonometry, mechanics, wheels, rotation, and pipeline engineering.',
    faqs: [
      {
        question: 'What is the relationship between diameter and circumference?',
        answer: 'The ratio of circumference to diameter is always equal to pi (C/D = π ≈ 3.14159).',
      },
    ],
    inputs: [
      { id: 'radius', label: 'Circle Radius (r)', type: 'number', defaultValue: 5, min: 0.001, step: 'any' },
    ],
    calculate: (inputs) => {
      const r = Number(inputs.radius);
      if (isNaN(r) || r <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter a positive radius.' };

      const d = 2 * r;
      const c = 2 * Math.PI * r;
      const a = Math.PI * r * r;

      return {
        primary: { label: 'Circle Area', value: Number(a.toFixed(4)), unit: 'sq units' },
        details: [
          { label: 'Circumference (Perimeter)', value: `${c.toFixed(4)} units` },
          { label: 'Diameter', value: `${d.toFixed(4)} units` },
          { label: 'Radius', value: `${r} units` },
        ],
        summary: `For radius ${r}: Area = ${a.toFixed(2)}, Circumference = ${c.toFixed(2)}, Diameter = ${d.toFixed(2)}.`,
      };
    },
    relatedSlugs: ['area-calculator', 'sphere-calculator', 'cylinder-calculator'],
  },
  {
    id: 'pythagorean-theorem-calculator',
    slug: 'pythagorean-theorem-calculator',
    title: 'Pythagorean Theorem Calculator',
    shortTitle: 'Pythagorean Theorem',
    category: 'geometry',
    description: 'Find the hypotenuse or missing side of a right triangle using the Pythagorean equation a² + b² = c².',
    seoTitle: 'Pythagorean Theorem Calculator – a² + b² = c² | Benix Space',
    metaDescription: 'Free Pythagorean theorem solver. Find the hypotenuse or leg length of any right triangle with step-by-step steps.',
    keywords: ['pythagorean theorem calculator', 'hypotenuse calculator', 'right triangle calculator', 'a2 b2 c2'],
    formula: 'c = √(a² + b²) | a = √(c² - b²)',
    formulaExplanation: 'In any right-angled triangle, the square of the hypotenuse (c) is equal to the sum of the squares of the other two sides (a and b).',
    example: {
      title: 'Sides a = 3, b = 4',
      inputs: { a: 3, b: 4 },
      output: 'Hypotenuse c = 5',
      steps: ['3² + 4² = 9 + 16 = 25', '√25 = 5 (Classic 3-4-5 triangle)'],
    },
    explanation: 'Named after the ancient Greek mathematician Pythagoras, this theorem is the cornerstone of Euclidean geometry, navigation, computer graphics, and construction framing.',
    faqs: [
      {
        question: 'What is a Pythagorean triple?',
        answer: 'A set of three positive integers (a, b, c) that perfectly satisfy a² + b² = c², such as (3, 4, 5) and (5, 12, 13).',
      },
    ],
    inputs: [
      { id: 'a', label: 'Side a (Leg)', type: 'number', defaultValue: 3, min: 0.01, step: 'any' },
      { id: 'b', label: 'Side b (Leg)', type: 'number', defaultValue: 4, min: 0.01, step: 'any' },
    ],
    calculate: (inputs) => {
      const a = Number(inputs.a);
      const b = Number(inputs.b);

      if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive side lengths.' };

      const c = Math.sqrt(a * a + b * b);
      const area = 0.5 * a * b;
      const perimeter = a + b + c;

      return {
        primary: { label: 'Hypotenuse (c)', value: Number(c.toFixed(4)), unit: 'units' },
        details: [
          { label: 'Triangle Area', value: `${area.toFixed(4)} sq units` },
          { label: 'Triangle Perimeter', value: `${perimeter.toFixed(4)} units` },
          { label: 'Angle A', value: `${((Math.asin(a / c) * 180) / Math.PI).toFixed(2)}°` },
          { label: 'Angle B', value: `${((Math.asin(b / c) * 180) / Math.PI).toFixed(2)}°` },
        ],
        summary: `For legs ${a} and ${b}, hypotenuse c = ${c.toFixed(2)}.`,
      };
    },
    relatedSlugs: ['area-calculator', 'square-root-calculator', 'distance-calculator'],
    isPopular: true,
  },
  {
    id: 'volume-calculator',
    slug: 'volume-calculator',
    title: 'Volume Calculator',
    shortTitle: 'Volume',
    category: 'geometry',
    description: 'Calculate 3D volume and total surface area for cubes, rectangular prisms, cylinders, spheres, and cones.',
    seoTitle: 'Volume Calculator – 3D Shapes & Solid Geometry | Benix Space',
    metaDescription: 'Free volume calculator. Calculate volume and surface area for cube, box, cylinder, sphere, and cone.',
    keywords: ['volume calculator', 'cubic volume', 'cylinder volume', 'sphere volume', 'cube volume'],
    formula: 'Cylinder: V = π r² h | Sphere: V = 4/3 π r³ | Box: V = l × w × h',
    formulaExplanation: 'Multiplies 3D dimensional factors corresponding to solid geometry integration.',
    example: {
      title: 'Cylinder radius 4 m, height 10 m',
      inputs: { shape: 'cylinder', r: 4, h: 10 },
      output: '502.65 m³',
      steps: ['V = π × 4² × 10 = 160π ≈ 502.65 m³'],
    },
    explanation: 'Volume measures the capacity or three-dimensional space enclosed by a closed surface. Essential for packaging, tank storage, pool filling, and shipping containers.',
    faqs: [
      {
        question: 'How do you convert cubic meters to liters?',
        answer: '1 cubic meter (m³) contains exactly 1,000 liters.',
      },
    ],
    inputs: [
      {
        id: 'shape',
        label: '3D Solid Shape',
        type: 'select',
        defaultValue: 'cylinder',
        options: [
          { label: 'Cylinder (Radius r, Height h)', value: 'cylinder' },
          { label: 'Sphere (Radius r)', value: 'sphere' },
          { label: 'Rectangular Box / Prism (L × W × H)', value: 'box' },
        ],
      },
      { id: 'd1', label: 'Radius / Length', type: 'number', defaultValue: 5, min: 0.01, step: 'any' },
      { id: 'd2', label: 'Height / Width', type: 'number', defaultValue: 10, min: 0.01, step: 'any' },
      { id: 'd3', label: 'Depth / Height (for box)', type: 'number', defaultValue: 8, min: 0.01, step: 'any' },
    ],
    calculate: (inputs) => {
      const shape = inputs.shape || 'cylinder';
      const d1 = Number(inputs.d1);
      const d2 = Number(inputs.d2);
      const d3 = Number(inputs.d3);

      if (isNaN(d1) || d1 <= 0) return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive dimensions.' };

      let vol = 0;
      let sa = 0;

      if (shape === 'cylinder') {
        if (isNaN(d2) || d2 <= 0) return { primary: { label: 'Result', value: 'Missing Height' }, error: 'Height required.' };
        vol = Math.PI * d1 * d1 * d2;
        sa = 2 * Math.PI * d1 * d2 + 2 * Math.PI * d1 * d1;
      } else if (shape === 'sphere') {
        vol = (4 / 3) * Math.PI * Math.pow(d1, 3);
        sa = 4 * Math.PI * d1 * d1;
      } else {
        if (isNaN(d2) || isNaN(d3) || d2 <= 0 || d3 <= 0) return { primary: { label: 'Result', value: 'Missing Dimensions' }, error: 'Length, width, height required.' };
        vol = d1 * d2 * d3;
        sa = 2 * (d1 * d2 + d1 * d3 + d2 * d3);
      }

      return {
        primary: { label: 'Volume', value: Number(vol.toFixed(4)), unit: 'cubic units' },
        details: [
          { label: 'Total Surface Area', value: `${sa.toFixed(4)} sq units` },
          { label: 'Liters Equivalent (if in meters)', value: `${(vol * 1000).toLocaleString()} Liters` },
        ],
        summary: `Volume of the ${shape} is ${vol.toFixed(2)} cubic units.`,
      };
    },
    relatedSlugs: ['area-calculator', 'circle-calculator'],
  },
];
