export const COUNTRY_OPTIONS = [
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "IN", label: "India", flag: "🇮🇳" },
  { code: "PK", label: "Pakistan", flag: "🇵🇰" },
  { code: "BD", label: "Bangladesh", flag: "🇧🇩" },
  { code: "AE", label: "UAE", flag: "🇦🇪" },
  { code: "SA", label: "Saudi Arabia", flag: "🇸🇦" },
  { code: "EG", label: "Egypt", flag: "🇪🇬" },
  { code: "NG", label: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "PH", label: "Philippines", flag: "🇵🇭" },
  { code: "ID", label: "Indonesia", flag: "🇮🇩" },
  { code: "MY", label: "Malaysia", flag: "🇲🇾" },
  { code: "SG", label: "Singapore", flag: "🇸🇬" },
  { code: "JP", label: "Japan", flag: "🇯🇵" },
  { code: "KR", label: "South Korea", flag: "🇰🇷" },
  { code: "CN", label: "China", flag: "🇨🇳" },
  { code: "BR", label: "Brazil", flag: "🇧🇷" },
  { code: "MX", label: "Mexico", flag: "🇲🇽" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "IT", label: "Italy", flag: "🇮🇹" },
  { code: "ES", label: "Spain", flag: "🇪🇸" },
  { code: "TR", label: "Turkey", flag: "🇹🇷" },
  { code: "RU", label: "Russia", flag: "🇷🇺" },
];

export function countryDisplay(country) {
  if (!country) return null;
  const raw = String(country).trim();
  if (!raw) return null;
  const byCode = COUNTRY_OPTIONS.find((c) => c.code === raw.toUpperCase());
  if (byCode) return byCode;
  const byLabel = COUNTRY_OPTIONS.find((c) => c.label.toLowerCase() === raw.toLowerCase());
  if (byLabel) return byLabel;
  return { code: raw.slice(0, 2).toUpperCase(), label: raw, flag: "🌍" };
}

/** Single formatter for profile / room / spotlight location display. */
export function formatProfileLocation(profileOrCountry) {
  if (!profileOrCountry) return null;
  const raw =
    typeof profileOrCountry === "string"
      ? profileOrCountry
      : profileOrCountry.country ?? profileOrCountry.country_code ?? null;
  const meta = countryDisplay(raw);
  if (!meta) return null;
  return `${meta.flag} ${meta.label}`;
}
