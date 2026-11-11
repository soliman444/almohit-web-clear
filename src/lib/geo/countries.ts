export type GeoCountry = {
  code: string;
  name: string;
  /** Default map center [lat, lng] for the country. */
  center: [number, number];
  zoom?: number;
};

export const STOREFRONT_COUNTRIES: GeoCountry[] = [
  { code: "SA", name: "Saudi Arabia", center: [24.7136, 46.6753], zoom: 6 },
  { code: "AE", name: "United Arab Emirates", center: [25.2048, 55.2708], zoom: 8 },
  { code: "YE", name: "Yemen", center: [15.3694, 44.191], zoom: 6 },
  { code: "KW", name: "Kuwait", center: [29.3759, 47.9774], zoom: 8 },
  { code: "QA", name: "Qatar", center: [25.2854, 51.531], zoom: 9 },
  { code: "BH", name: "Bahrain", center: [26.0667, 50.5577], zoom: 10 },
  { code: "OM", name: "Oman", center: [23.588, 58.3829], zoom: 6 },
  { code: "EG", name: "Egypt", center: [30.0444, 31.2357], zoom: 6 },
  { code: "JO", name: "Jordan", center: [31.9539, 35.9106], zoom: 7 },
  { code: "IQ", name: "Iraq", center: [33.3152, 44.3661], zoom: 6 },
];

export const DEFAULT_COUNTRY_CODE = "SA";

export function countryByCode(code?: string | null): GeoCountry | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return STOREFRONT_COUNTRIES.find((item) => item.code === normalized);
}

export function countryName(codeOrName?: string | null): string {
  if (!codeOrName) return "—";
  const byCode = countryByCode(codeOrName);
  if (byCode) return byCode.name;
  return codeOrName.trim() || "—";
}

export function normalizeCountryCode(value?: string | null, fallback = DEFAULT_COUNTRY_CODE): string {
  const found = countryByCode(value);
  if (found) return found.code;
  return fallback;
}
