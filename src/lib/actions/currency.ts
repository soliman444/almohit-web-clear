"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CURRENCY_COOKIE } from "../../config/currencies";
import { listActiveDisplayCurrencies } from "../currency/catalog";
import { parseCurrencyCookie } from "../currency/format";
import { setOdooCartCurrency } from "../odoo/cart";
import { ApiClientError } from "../odoo/errors";

export async function setDisplayCurrencyAction(code: string) {
  const catalog = await listActiveDisplayCurrencies();
  const next = parseCurrencyCookie(code, catalog);
  const jar = await cookies();
  jar.set(CURRENCY_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Keep cart pricelist in sync with display currency when a merchant session exists.
  try {
    await setOdooCartCurrency(next);
  } catch (error) {
    // Guests / unapproved accounts / missing currency pricelist: catalog still uses ?currency=.
    if (!(error instanceof ApiClientError)) throw error;
  }

  revalidatePath("/", "layout");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
