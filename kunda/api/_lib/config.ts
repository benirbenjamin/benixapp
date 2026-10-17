// =====================================================================
// KUNDA SPACE: BUSINESS CONFIGURATION & DEFAULTS
// =====================================================================

export const BUSINESS_CONFIG = {
  // Free messaging limits
  FREE_INITIAL_MESSAGES: 3,
  FREE_DISTINCT_RECIPIENTS: 3,
  FREE_REPLIES_ALLOWED: 3,

  // Costs (in minor units: 1 RWF = 1 unit or cents)
  HOURLY_PASS_PRICE_RWF: 1500, // 24-Hour Pass (Daily)
  THREE_DAY_PASS_PRICE_RWF: 3000,
  WEEKLY_PASS_PRICE_RWF: 5000,
  PAY_PER_MESSAGE_PRICE_RWF: 150,
  CONTACT_UNLOCK_PRICE_RWF: 2000,

  // Earning & Affiliate Rewards
  WELCOME_BONUS_RWF: 500, // Credited to welcome bonus wallet on signup (spendable, non-withdrawable)
  REFERRAL_SIGNUP_REWARD_RWF: 200, // Credited to withdrawable balance when referred friend registers
  REFERRAL_DEPOSIT_COMMISSION_PCT: 5, // 5% of all deposits made by referred users
  CONTACT_UNLOCK_COMMISSION_PCT: 15, // 15% revenue share when contact is unlocked
  MINIMUM_WITHDRAWAL_RWF: 2000, // Minimum threshold to withdraw to MoMo / Airtel / Bank

  DEFAULT_CURRENCY: 'RWF',

  // Algorithm weights (0-100)
  MATCHING_WEIGHTS: {
    INTENTION: 0.25,
    AGE: 0.20,
    LOCATION: 0.15,
    INTERESTS: 0.15,
    LANGUAGE: 0.10,
    LIFESTYLE: 0.10,
    OTHER: 0.05,
  },

  // Minimum required age by law
  MINIMUM_AGE_YEARS: 18,
};

// Supported countries with calling codes and ISO
export const SUPPORTED_COUNTRIES = [
  { code: 'RW', name: 'Rwanda', callingCode: '+250', cities: ['Kigali', 'Rubavu', 'Musanze', 'Huye', 'Rusizi', 'Muhanga', 'Nyagatare', 'Gicumbi', 'Karongi', 'Rwamagana'] },
  { code: 'BI', name: 'Burundi', callingCode: '+257', cities: ['Bujumbura', 'Gitega', 'Ngozi', 'Rumonge'] },
  { code: 'UG', name: 'Uganda', callingCode: '+256', cities: ['Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu'] },
  { code: 'KE', name: 'Kenya', callingCode: '+254', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'] },
  { code: 'TZ', name: 'Tanzania', callingCode: '+255', cities: ['Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza', 'Zanzibar'] },
  { code: 'CD', name: 'DR Congo', callingCode: '+243', cities: ['Kinshasa', 'Goma', 'Bukavu', 'Lubumbashi'] },
  { code: 'BE', name: 'Belgium', callingCode: '+32', cities: ['Brussels', 'Antwerp', 'Ghent', 'Liège'] },
  { code: 'FR', name: 'France', callingCode: '+33', cities: ['Paris', 'Lyon', 'Marseille', 'Bordeaux'] },
  { code: 'CA', name: 'Canada', callingCode: '+1', cities: ['Montreal', 'Toronto', 'Ottawa', 'Vancouver', 'Quebec'] },
  { code: 'US', name: 'United States', callingCode: '+1', cities: ['New York', 'Washington DC', 'Dallas', 'Atlanta', 'Los Angeles'] },
  { code: 'GB', name: 'United Kingdom', callingCode: '+44', cities: ['London', 'Manchester', 'Birmingham'] },
];
