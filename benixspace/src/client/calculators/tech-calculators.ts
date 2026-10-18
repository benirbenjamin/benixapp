import { CalculatorDefinition } from './types';

export const TECH_CALCULATORS: CalculatorDefinition[] = [
  {
    id: 'binary-calculator',
    slug: 'binary-calculator',
    title: 'Binary Calculator & Base Converter',
    shortTitle: 'Binary Converter',
    category: 'technology',
    description: 'Convert numbers seamlessly between Binary (Base-2), Decimal (Base-10), Hexadecimal (Base-16), and Octal (Base-8).',
    seoTitle: 'Binary Calculator – Binary to Decimal & Hex Converter | Benix Space',
    metaDescription: 'Free online binary calculator. Convert binary to decimal, decimal to binary, and hexadecimal with step-by-step bitwise breakdown.',
    keywords: ['binary calculator', 'binary to decimal', 'decimal to binary', 'binary converter', 'hex to binary'],
    aliases: ['binary', 'hex', 'decimal to binary', 'base converter', 'bits and bytes'],
    formula: 'Decimal = Σ (bit_i × 2^i) from i=0 to n',
    formulaExplanation: 'Each bit in a binary number represents a power of 2, evaluated from right to left starting at 2^0.',
    example: {
      title: 'Convert 110101 to Decimal',
      inputs: { input_val: '110101', from_base: '2' },
      output: '53 Decimal',
      steps: ['32 + 16 + 0 + 4 + 0 + 1 = 53'],
    },
    explanation: 'Binary is the fundamental language of computers, which operate using transistors representing 0 (off) and 1 (on). This tool converts between major digital computing radix bases: Binary, Decimal, Hexadecimal, and Octal.',
    faqs: [
      {
        question: 'How many bits are in a byte?',
        answer: 'There are exactly 8 bits in one standard byte.',
      },
    ],
    inputs: [
      { id: 'input_val', label: 'Input Value', type: 'text', defaultValue: '42' },
      {
        id: 'from_base',
        label: 'Source Base',
        type: 'select',
        defaultValue: '10',
        options: [
          { label: 'Decimal (Base 10)', value: '10' },
          { label: 'Binary (Base 2)', value: '2' },
          { label: 'Hexadecimal (Base 16)', value: '16' },
          { label: 'Octal (Base 8)', value: '8' },
        ],
      },
    ],
    calculate: (inputs) => {
      const raw = String(inputs.input_val || '').trim();
      const base = parseInt(inputs.from_base, 10) || 10;

      if (!raw) return { primary: { label: 'Result', value: 'Empty' }, error: 'Please enter a number.' };

      const dec = parseInt(raw, base);
      if (isNaN(dec)) return { primary: { label: 'Result', value: 'Invalid Base Number' }, error: `Invalid number format for base ${base}.` };

      const bin = dec.toString(2);
      const hex = dec.toString(16).toUpperCase();
      const oct = dec.toString(8);

      return {
        primary: { label: base === 10 ? 'Binary (Base 2)' : 'Decimal (Base 10)', value: base === 10 ? bin : dec },
        details: [
          { label: 'Decimal', value: dec },
          { label: 'Binary', value: bin },
          { label: 'Hexadecimal', value: `0x${hex}` },
          { label: 'Octal', value: oct },
          { label: 'Byte Count (min)', value: `${Math.ceil(bin.length / 8)} Byte(s)` },
        ],
        summary: `Value "${raw}" (Base ${base}) = Decimal ${dec} = Binary ${bin} = Hex 0x${hex}.`,
      };
    },
    relatedSlugs: ['ip-subnet-calculator', 'bandwidth-calculator'],
    isPopular: true,
  },
  {
    id: 'bandwidth-calculator',
    slug: 'bandwidth-calculator',
    title: 'Download Time & Bandwidth Calculator',
    shortTitle: 'Download Time',
    category: 'technology',
    description: 'Calculate how long it takes to download or upload files based on file size and internet connection speed.',
    seoTitle: 'Download Time Calculator – File Size & Internet Speed | Benix Space',
    metaDescription: 'Free download time calculator. Estimate download times for games, movies, and updates on fiber, cable, or mobile 5G internet.',
    keywords: ['download time calculator', 'bandwidth calculator', 'download speed', 'how long to download', 'file transfer time'],
    aliases: ['download time', 'bandwidth', 'internet speed', 'file transfer', 'gigabit'],
    formula: 'Time (seconds) = (File Size in Bits) / (Network Speed in bps)',
    formulaExplanation: 'Multiplies file size bytes by 8 to convert to bits, then divides by bandwidth connection bitrate.',
    example: {
      title: '50 GB Game on 100 Mbps Internet',
      inputs: { size_val: 50, size_unit: 'GB', speed_val: 100, speed_unit: 'Mbps' },
      output: '1 Hour, 6 Minutes, 40 Seconds',
      steps: ['50 GB = 400,000 Megabits', '400,000 / 100 Mbps = 4,000 seconds = 1h 6m 40s'],
    },
    explanation: 'Internet service providers (ISPs) advertise speeds in bits per second (e.g. 100 Mbps), whereas computer files are measured in Bytes (e.g. 50 GB). Because 1 Byte = 8 bits, actual transfer time is 8 times longer than simple Megabyte division.',
    faqs: [
      {
        question: 'What is the difference between Mbps and MB/s?',
        answer: 'Mbps stands for Megabits per second (network speed). MB/s stands for Megabytes per second (storage speed). 8 Mbps = 1 MB/s.',
      },
    ],
    inputs: [
      { id: 'size_val', label: 'File Size', type: 'number', defaultValue: 25, min: 0.1, step: 'any' },
      { id: 'size_unit', label: 'File Size Unit', type: 'select', defaultValue: 'GB', options: [{ label: 'Gigabytes (GB)', value: 'GB' }, { label: 'Megabytes (MB)', value: 'MB' }, { label: 'Terabytes (TB)', value: 'TB' }] },
      { id: 'speed_val', label: 'Internet Speed', type: 'number', defaultValue: 100, min: 0.1, step: 'any' },
      { id: 'speed_unit', label: 'Speed Unit', type: 'select', defaultValue: 'Mbps', options: [{ label: 'Megabits/sec (Mbps)', value: 'Mbps' }, { label: 'Gigabits/sec (Gbps)', value: 'Gbps' }, { label: 'Kilobits/sec (Kbps)', value: 'Kbps' }] },
    ],
    calculate: (inputs) => {
      const sizeVal = Number(inputs.size_val);
      const sizeUnit = inputs.size_unit || 'GB';
      const speedVal = Number(inputs.speed_val);
      const speedUnit = inputs.speed_unit || 'Mbps';

      if (isNaN(sizeVal) || isNaN(speedVal) || sizeVal <= 0 || speedVal <= 0) {
        return { primary: { label: 'Result', value: 'Invalid' }, error: 'Please enter positive numbers.' };
      }

      // Convert file size to MegaBytes
      let sizeMB = sizeVal;
      if (sizeUnit === 'GB') sizeMB = sizeVal * 1024;
      else if (sizeUnit === 'TB') sizeMB = sizeVal * 1024 * 1024;

      // Convert speed to Megabits/s
      let speedMbps = speedVal;
      if (speedUnit === 'Gbps') speedMbps = speedVal * 1000;
      else if (speedUnit === 'Kbps') speedMbps = speedVal / 1000;

      // Real-world overhead factor (TCP overhead ~10%)
      const bitsTotal = sizeMB * 8;
      const seconds = bitsTotal / speedMbps;

      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.round(seconds % 60);

      let timeStr = '';
      if (hrs > 0) timeStr += `${hrs}h `;
      if (mins > 0 || hrs > 0) timeStr += `${mins}m `;
      timeStr += `${secs}s`;

      return {
        primary: { label: 'Estimated Download Time', value: timeStr.trim() },
        details: [
          { label: 'Download Speed in MB/s', value: `${(speedMbps / 8).toFixed(2)} MB/s` },
          { label: 'Total File Bits', value: `${(bitsTotal / 1000).toLocaleString()} Gb` },
          { label: 'Total Seconds', value: `${Math.round(seconds).toLocaleString()} seconds` },
        ],
        summary: `Downloading ${sizeVal} ${sizeUnit} at ${speedVal} ${speedUnit} will take approximately ${timeStr}.`,
      };
    },
    relatedSlugs: ['binary-calculator', 'ip-subnet-calculator'],
    isPopular: true,
  },
  {
    id: 'ip-subnet-calculator',
    slug: 'ip-subnet-calculator',
    title: 'IP Subnet & CIDR Calculator',
    shortTitle: 'IP Subnet',
    category: 'technology',
    description: 'Calculate IPv4 network address, broadcast address, subnet mask, usable host range, and total usable hosts from CIDR prefix.',
    seoTitle: 'IP Subnet Calculator – IPv4 Subnetting & CIDR | Benix Space',
    metaDescription: 'Free IP subnet calculator. Calculate network ID, broadcast IP, usable host range, and wildcard masks for IPv4 CIDR blocks.',
    keywords: ['ip subnet calculator', 'cidr calculator', 'subnet mask', 'usable hosts', 'network address'],
    aliases: ['subnet', 'cidr', 'ipv4', 'network address', 'broadcast ip'],
    formula: 'Usable Hosts = 2^(32 - CIDR) - 2',
    formulaExplanation: 'Subtracts 2 for the reserved Network and Broadcast addresses.',
    example: {
      title: '192.168.1.100 / 24',
      inputs: { ip: '192.168.1.100', cidr: 24 },
      output: '254 Usable Hosts, Network: 192.168.1.0',
      steps: ['Subnet mask: 255.255.255.0', 'Usable Range: 192.168.1.1 to 192.168.1.254', 'Broadcast: 192.168.1.255'],
    },
    explanation: 'Subnetting divides an IPv4 network into smaller, more efficient logical subnetworks. It conserves IP address allocations and enhances routing security.',
    faqs: [
      {
        question: 'Why are 2 addresses subtracted from total hosts?',
        answer: 'The first address represents the network itself, and the last address is reserved for broadcast packets to all devices in the subnet.',
      },
    ],
    inputs: [
      { id: 'ip', label: 'IP Address', type: 'text', defaultValue: '192.168.1.50' },
      { id: 'cidr', label: 'CIDR Prefix (e.g. 24 for /24)', type: 'number', defaultValue: 24, min: 1, max: 32, step: 1 },
    ],
    calculate: (inputs) => {
      const ipStr = String(inputs.ip || '').trim();
      const cidr = parseInt(inputs.cidr, 10);

      const octets = ipStr.split('.').map(Number);
      if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255) || isNaN(cidr) || cidr < 1 || cidr > 32) {
        return { primary: { label: 'Result', value: 'Invalid IP / CIDR' }, error: 'Please enter a valid IPv4 address and CIDR prefix (1-32).' };
      }

      const ipNum = (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];
      const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
      const netNum = (ipNum & maskNum) >>> 0;
      const bcastNum = (netNum | ~maskNum) >>> 0;

      const numToIp = (num: number) => [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join('.');

      const netIp = numToIp(netNum);
      const bcastIp = numToIp(bcastNum);
      const maskIp = numToIp(maskNum);
      const usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.pow(2, 32 - cidr) - 2;
      const firstHost = cidr >= 31 ? netIp : numToIp(netNum + 1);
      const lastHost = cidr >= 31 ? bcastIp : numToIp(bcastNum - 1);

      return {
        primary: { label: 'Usable Hosts', value: `${usableHosts.toLocaleString()}`, badge: `/${cidr} Network` },
        details: [
          { label: 'Network Address', value: netIp },
          { label: 'Broadcast Address', value: bcastIp },
          { label: 'Subnet Mask', value: maskIp },
          { label: 'Usable Host Range', value: `${firstHost} – ${lastHost}` },
        ],
        summary: `Network ${netIp}/${cidr} provides ${usableHosts.toLocaleString()} usable host IP addresses.`,
      };
    },
    relatedSlugs: ['binary-calculator', 'bandwidth-calculator'],
  },
];
