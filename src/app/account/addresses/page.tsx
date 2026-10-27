import Link from "next/link";
import { AddressBook } from "../../../components/storefront/address-book";
import { StorefrontShell } from "../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../components/system/storefront-unavailable";
import { getAddresses } from "../../../lib/commerce/addresses";
import { safeApiCall } from "../../../lib/odoo/safe";
import { safeStorefrontReturnTo } from "../../../lib/catalog/paths";
import { commerceMessage } from "../../../lib/commerce/errors";
import { requireMerchant } from "../../../lib/session/access";
import type { StorefrontAddress } from "../../../lib/odoo/addresses";

export const dynamic = "force-dynamic";

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; type?: string; returnTo?: string; saved?: string }>;
}) {
  const session = await requireMerchant();
  const { error, type, returnTo: rawReturn, saved } = await searchParams;
  const loaded = await safeApiCall(() => getAddresses());
  if (!loaded.ok) return <StorefrontUnavailable />;
  const addresses = loaded.data;
  const defaultName = session.customer.name;
  const defaultPhone = session.customer.phone ?? "";
  const returnTo = safeStorefrontReturnTo(rawReturn ?? "", "/account/addresses");
  const defaultType = type === "invoice" ? "invoice" : "delivery";

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-addresses-page">
        <Link className="sf-text-link" href={returnTo === "/checkout" ? "/checkout" : "/account"}>
          {returnTo === "/checkout" ? "Back to checkout" : "Back to my account"}
        </Link>
        <p className="sf-kicker">Addresses</p>
        <h1>Delivery and invoice addresses.</h1>
        <p className="sf-count">{String(addresses.length).padStart(2, "0")} saved</p>
        {returnTo === "/checkout" && (
          <p className="muted">
            Saved addresses are listed as cards. Edit only opens when you ask for it. After you add an address, you can return to checkout.
          </p>
        )}
        {error && <p className="error" role="alert">{commerceMessage(error)}</p>}
        <AddressBook
          addresses={addresses as StorefrontAddress[]}
          defaultName={defaultName}
          defaultPhone={defaultPhone}
          defaultType={defaultType}
          returnTo={returnTo}
          saved={saved === "1"}
        />
      </main>
    </StorefrontShell>
  );
}
