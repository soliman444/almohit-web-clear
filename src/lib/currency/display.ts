import { cache } from "react";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE } from "../../config/currencies";
import { getOdooCurrencyCatalog } from "./catalog";
import {
  companyCurrencyCode,
  parseCurrencyCookie,
  type DisplayCurrencyCode,
} from "./format";

export const getDisplayCurrencyState = cache(async () => {
  const [jar, payload] = await Promise.all([cookies(), getOdooCurrencyCatalog()]);
  const code = parseCurrencyCookie(jar.get(CURRENCY_COOKIE)?.value, payload.currencies);
  return {
    code,
    catalog: payload.currencies,
    companyCurrency: payload.companyCurrency || payload.currencies.find((item) => item.isCompany)?.code || "",
    rateDate: payload.date,
  };
});

export const getDisplayCurrency = cache(async (): Promise<DisplayCurrencyCode> => {
  return (await getDisplayCurrencyState()).code;
});

/** Reset cookie when catalog rejects the selected currency for this merchant. */
export async function resetDisplayCurrencyToCompany() {
  const jar = await cookies();
  const payload = await getOdooCurrencyCatalog();
  const company = companyCurrencyCode(payload.currencies) || payload.companyCurrency;
  if (!company) {
    jar.delete(CURRENCY_COOKIE);
    return;
  }
  jar.set(CURRENCY_COOKIE, company, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
