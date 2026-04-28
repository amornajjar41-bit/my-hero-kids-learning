export type CountryEntry = {
  code: string;
  flag: string;
  name: string;
  nameAr: string;
  currency: string;
  symbol: string;
  rate: number; // USD multiplier
};

// prettier-ignore
export const COUNTRIES: CountryEntry[] = [
  // Arabic-speaking countries first
  { code: "SA", flag: "🇸🇦", name: "Saudi Arabia",       nameAr: "السعودية",       currency: "SAR", symbol: "ر.س",  rate: 3.75 },
  { code: "AE", flag: "🇦🇪", name: "UAE",                 nameAr: "الإمارات",       currency: "AED", symbol: "د.إ",  rate: 3.67 },
  { code: "KW", flag: "🇰🇼", name: "Kuwait",              nameAr: "الكويت",         currency: "KWD", symbol: "د.ك",  rate: 0.31 },
  { code: "QA", flag: "🇶🇦", name: "Qatar",               nameAr: "قطر",            currency: "QAR", symbol: "ر.ق",  rate: 3.64 },
  { code: "BH", flag: "🇧🇭", name: "Bahrain",             nameAr: "البحرين",        currency: "BHD", symbol: "د.ب",  rate: 0.38 },
  { code: "OM", flag: "🇴🇲", name: "Oman",                nameAr: "عُمان",          currency: "OMR", symbol: "ر.ع.", rate: 0.39 },
  { code: "JO", flag: "🇯🇴", name: "Jordan",              nameAr: "الأردن",         currency: "JOD", symbol: "د.أ",  rate: 0.71 },
  { code: "EG", flag: "🇪🇬", name: "Egypt",               nameAr: "مصر",            currency: "EGP", symbol: "ج.م",  rate: 49.5 },
  { code: "IQ", flag: "🇮🇶", name: "Iraq",                nameAr: "العراق",         currency: "IQD", symbol: "د.ع",  rate: 1310 },
  { code: "LB", flag: "🇱🇧", name: "Lebanon",             nameAr: "لبنان",          currency: "USD", symbol: "$",    rate: 1 },
  { code: "SY", flag: "🇸🇾", name: "Syria",               nameAr: "سوريا",          currency: "SYP", symbol: "ل.س",  rate: 12900 },
  { code: "LY", flag: "🇱🇾", name: "Libya",               nameAr: "ليبيا",          currency: "LYD", symbol: "د.ل",  rate: 4.83 },
  { code: "TN", flag: "🇹🇳", name: "Tunisia",             nameAr: "تونس",           currency: "TND", symbol: "د.ت",  rate: 3.12 },
  { code: "DZ", flag: "🇩🇿", name: "Algeria",             nameAr: "الجزائر",        currency: "DZD", symbol: "د.ج",  rate: 134 },
  { code: "MA", flag: "🇲🇦", name: "Morocco",             nameAr: "المغرب",         currency: "MAD", symbol: "د.م.", rate: 9.97 },
  { code: "SD", flag: "🇸🇩", name: "Sudan",               nameAr: "السودان",        currency: "SDG", symbol: "ج.س",  rate: 601 },
  { code: "YE", flag: "🇾🇪", name: "Yemen",               nameAr: "اليمن",          currency: "YER", symbol: "ر.ي",  rate: 250 },
  { code: "PS", flag: "🇵🇸", name: "Palestine",           nameAr: "فلسطين",         currency: "USD", symbol: "$",    rate: 1 },
  // English-speaking / major
  { code: "US", flag: "🇺🇸", name: "United States",       nameAr: "الولايات المتحدة", currency: "USD", symbol: "$",    rate: 1 },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom",      nameAr: "المملكة المتحدة", currency: "GBP", symbol: "£",    rate: 0.79 },
  { code: "CA", flag: "🇨🇦", name: "Canada",              nameAr: "كندا",           currency: "CAD", symbol: "C$",   rate: 1.36 },
  { code: "AU", flag: "🇦🇺", name: "Australia",           nameAr: "أستراليا",       currency: "AUD", symbol: "A$",   rate: 1.53 },
  { code: "DE", flag: "🇩🇪", name: "Germany",             nameAr: "ألمانيا",        currency: "EUR", symbol: "€",    rate: 0.92 },
  { code: "FR", flag: "🇫🇷", name: "France",              nameAr: "فرنسا",          currency: "EUR", symbol: "€",    rate: 0.92 },
  { code: "SE", flag: "🇸🇪", name: "Sweden",              nameAr: "السويد",         currency: "SEK", symbol: "kr",   rate: 10.4 },
  { code: "NO", flag: "🇳🇴", name: "Norway",              nameAr: "النرويج",        currency: "NOK", symbol: "kr",   rate: 10.6 },
  { code: "TR", flag: "🇹🇷", name: "Turkey",              nameAr: "تركيا",          currency: "TRY", symbol: "₺",    rate: 34 },
  { code: "PK", flag: "🇵🇰", name: "Pakistan",            nameAr: "باكستان",        currency: "PKR", symbol: "₨",    rate: 278 },
  { code: "IN", flag: "🇮🇳", name: "India",               nameAr: "الهند",          currency: "INR", symbol: "₹",    rate: 83 },
  { code: "MY", flag: "🇲🇾", name: "Malaysia",            nameAr: "ماليزيا",        currency: "MYR", symbol: "RM",   rate: 4.73 },
  { code: "SG", flag: "🇸🇬", name: "Singapore",           nameAr: "سنغافورة",       currency: "SGD", symbol: "S$",   rate: 1.35 },
  { code: "NG", flag: "🇳🇬", name: "Nigeria",             nameAr: "نيجيريا",        currency: "NGN", symbol: "₦",    rate: 1550 },
  { code: "KE", flag: "🇰🇪", name: "Kenya",               nameAr: "كينيا",          currency: "KES", symbol: "KSh",  rate: 128 },
  { code: "ZA", flag: "🇿🇦", name: "South Africa",        nameAr: "جنوب أفريقيا",   currency: "ZAR", symbol: "R",    rate: 18.7 },
  { code: "NZ", flag: "🇳🇿", name: "New Zealand",         nameAr: "نيوزيلندا",      currency: "NZD", symbol: "NZ$",  rate: 1.62 },
];

export function convertPrice(usdPrice: number, rate: number, symbol: string): string {
  const local = usdPrice * rate;
  if (local < 10) return `${symbol}${local.toFixed(2)}`;
  if (local < 100) return `${symbol}${Math.round(local)}`;
  return `${symbol}${Math.round(local).toLocaleString()}`;
}

export const PLANS_USD = {
  monthly:  { usd: 24.99,  label: "Monthly",  labelAr: "شهري" },
  biannual: { usd: 135.99, label: "6 Months", labelAr: "٦ أشهر", savePct: 10 },
  yearly:   { usd: 236.99, label: "Yearly",   labelAr: "سنوي",   savePct: 21 },
};
