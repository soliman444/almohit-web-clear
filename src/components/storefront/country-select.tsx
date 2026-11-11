"use client";

import { STOREFRONT_COUNTRIES, normalizeCountryCode } from "../../lib/geo/countries";

export function CountrySelect({
  name = "countryCode",
  defaultValue,
  required = true,
  disabled = false,
  invalid = false,
  label = "Country",
  className,
  onChange,
}: {
  name?: string;
  defaultValue?: string | null;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
  className?: string;
  onChange?: (code: string) => void;
}) {
  const initial = normalizeCountryCode(defaultValue);
  const cls = ["sf-biz-field", className, invalid ? "is-invalid" : ""].filter(Boolean).join(" ");

  return (
    <label className={cls}>
      {label}
      <select
        name={name}
        defaultValue={initial}
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {STOREFRONT_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </label>
  );
}
