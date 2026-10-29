import Link from "next/link";
import { BuyerPurchaseLines } from "../../../../../components/storefront/buyer-purchase-lines";
import { FormErrorBanner } from "../../../../../components/storefront/form-error-banner";
import { OnceForm, OnceSubmit } from "../../../../../components/storefront/once-submit";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { createBuyerPurchaseAction } from "../../../../../lib/actions/buyer";
import { getOdooCurrencyCatalog } from "../../../../../lib/currency/catalog";
import { fieldClassName, parseBuyerFormError, type FormErrorQuery } from "../../../../../lib/form-errors";
import {
  buyerPurchaseUomLabel,
  listBuyerRawProducts,
  listBuyerSuppliers,
} from "../../../../../lib/odoo/buyer";
import { safeApiCall } from "../../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function NewBuyerPurchasePage({
  searchParams,
}: {
  searchParams: Promise<FormErrorQuery>;
}) {
  await requireBuyer();
  const query = await searchParams;
  const formError = parseBuyerFormError(query);
  const invalid = formError?.fields ?? [];
  const loaded = await safeApiCall(async () => {
    const [suppliers, products, currencyCatalog] = await Promise.all([
      listBuyerSuppliers({ pageSize: 100, sort: "name_asc" }),
      listBuyerRawProducts({ pageSize: 100, sort: "name_asc" }),
      getOdooCurrencyCatalog(),
    ]);
    const currencies = currencyCatalog.currencies
      .filter((currency) => currency.id)
      .map((currency) => ({
        id: currency.id as string,
        code: currency.code,
        label: currency.label,
      }));
    const defaultCurrencyId =
      currencies.find((currency) => currency.code === currencyCatalog.companyCurrency)?.id
      || currencies[0]?.id
      || "";
    return {
      suppliers: suppliers.items,
      products: products.items,
      currencies,
      defaultCurrencyId,
    };
  });
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { suppliers, products, currencies, defaultCurrencyId } = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer/purchases">Back to purchases</Link>
        <p className="sf-kicker">Buyer</p>
        <h1>New purchase order.</h1>
        <p className="sf-heading">Raw materials only — quantities use the purchase unit (e.g. baskets).</p>
        <FormErrorBanner error={formError} />

        {suppliers.length === 0 ? (
          <p>
            Add a supplier first.{" "}
            <Link className="sf-text-link" href="/account/buyer/suppliers/new">Add supplier</Link>
          </p>
        ) : products.length === 0 ? (
          <p>
            No raw-material products found in category «المواد الخام - سلال».{" "}
            <Link className="sf-text-link" href="/account/buyer/products/new">Add product</Link>
            {" "}and assign that category so finished cartons stay out of procurement.
          </p>
        ) : currencies.length === 0 ? (
          <p className="error">No active currencies available from the catalog API.</p>
        ) : (
          <OnceForm className="sf-auth-form" action={createBuyerPurchaseAction} style={{ padding: 0 }}>
            <div className="sf-address-form">
              <label className={fieldClassName("sf-field is-wide", invalid, "supplierId")}>
                Supplier
                <select name="supplierId" required defaultValue="" aria-invalid={invalid.includes("supplierId")}>
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </label>
              <label className={fieldClassName("sf-field", invalid, "dateOrder")}>
                Order date
                <input name="dateOrder" type="date" aria-invalid={invalid.includes("dateOrder")} />
              </label>
              <label className={fieldClassName("sf-field is-wide", invalid, "notes")}>
                Notes
                <textarea name="notes" rows={3} aria-invalid={invalid.includes("notes")} />
              </label>
              <label className={fieldClassName("sf-field is-wide", invalid, "images")}>
                Photos (max 12)
                <input
                  name="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  aria-invalid={invalid.includes("images")}
                />
              </label>
            </div>
            <h2>Lines</h2>
            <BuyerPurchaseLines
              currencies={currencies}
              defaultCurrencyId={defaultCurrencyId}
              invalidFields={invalid}
              products={products.map((product) => ({
                id: product.id,
                name: product.name,
                defaultCode: product.defaultCode,
                uomLabel: buyerPurchaseUomLabel(product),
                lastPurchasePrice: product.lastPurchasePrice,
              }))}
            />
            <OnceSubmit className="sf-btn" pendingLabel="Creating…"><span>Create draft purchase</span></OnceSubmit>
          </OnceForm>
        )}
      </main>
    </StorefrontShell>
  );
}
