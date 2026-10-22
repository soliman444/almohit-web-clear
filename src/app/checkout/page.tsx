import Link from "next/link";
import { redirect } from "next/navigation";
import { OnceSubmit } from "../../components/storefront/once-submit";
import { StorefrontShell } from "../../components/storefront/shell";
import { StorefrontUnavailable } from "../../components/system/storefront-unavailable";
import { safeApiCall } from "../../lib/odoo/safe";
import { loadCheckoutPage } from "../../lib/commerce/checkout-reads";
import { requireMerchant } from "../../lib/session/access";
import { placeOdooOrderAction } from "../../lib/actions/place-order";
import { commerceMessage } from "../../lib/commerce/errors";
import { formatCompanyBase, formatDisplayMoney } from "../../lib/currency/format";
import { getDisplayCurrencyState } from "../../lib/currency/display";
import type { StorefrontAddress } from "../../lib/odoo/addresses";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string; shipping?: string; error?: string; available?: string }>;
}) {
  const { address, shipping, error, available } = await searchParams;
  await requireMerchant();
  const loaded = await safeApiCall(() => loadCheckoutPage({ address, shipping }));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const model = loaded.data;
  if (model.type === "redirect") redirect(model.to);

  const { cart } = model;
  const { code: currency, catalog } = await getDisplayCurrencyState();
  const tax = cart.amountTax;
  const total = cart.amountTotal ?? cart.subtotal;
  const saved = address === "saved";

  return (
    <StorefrontShell>
      <main className="sf-account sf-checkout-page">
        <div className="sf-checkout-container">
          
          <div className="sf-checkout-header">
            <Link className="sf-text-link sf-back-link" href="/cart">
              &larr; Back to cart
            </Link>
            <p className="sf-kicker">Checkout</p>
            <h1>Confirm the order</h1>
          </div>

          {/* رسائل الحالة */}
          {saved && (
            <div className="sf-alert sf-alert-success" role="status">
              Address saved. Select it below and place the order.
            </div>
          )}
          {error && (
            <div className="sf-alert sf-alert-error" role="alert">
              {commerceMessage(error, undefined, available)}
            </div>
          )}

          {/* التخطيط الشبكي (عمودين) */}
          <div className="sf-checkout-grid">
            
            {/* العمود الأيمن: العناصر والعنوان */}
            <div className="sf-checkout-main">
              <div className="sf-checkout-card">
                <h2 className="sf-card-title">Your Items</h2>
                <ul className="sf-cart-lines">
                  {cart.items.map((item) => (
                    <li key={item.id} className="sf-cart-line">
                      <div className="sf-cart-line-info">
                        <span className="sf-cart-line-name">
                          <b>{item.name}</b>
                          {item.variantName && <span className="sf-variant-name"> · {item.variantName}</span>}
                        </span>
                        <span className="sf-cart-line-qty">
                          {item.quantity} × {formatDisplayMoney(item.unitPrice, currency, catalog)}
                        </span>
                      </div>
                      <p className="sf-cart-line-total">
                        {formatDisplayMoney(item.lineTotal, currency, catalog)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <OdooCheckoutForm
                shippingAddresses={model.shippingAddresses}
                selectedShippingId={model.selectedShipping?.id}
              />
            </div>

            {/* العمود الأيسر: ملخص الطلب (ثابت) */}
            <div className="sf-checkout-sidebar">
              <div className="sf-checkout-card sf-summary-card">
                <h2 className="sf-card-title">Order Summary</h2>
                
                <div className="sf-summary-rows">
                  <div className="sf-summary-row">
                    <span>Subtotal</span>
                    <span>{formatDisplayMoney(cart.subtotal, currency, catalog)}</span>
                  </div>
                  {tax != null && (
                    <div className="sf-summary-row">
                      <span>Tax</span>
                      <span>{formatDisplayMoney(tax, currency, catalog)}</span>
                    </div>
                  )}
                  {model.paymentTerm && (
                    <div className="sf-summary-row">
                      <span>Payment terms</span>
                      <span className="sf-summary-value-left">{model.paymentTerm.name}</span>
                    </div>
                  )}
                </div>

                <div className="sf-summary-total">
                  <span>Total</span>
                  <span className="sf-total-price">{formatDisplayMoney(total, currency, catalog)}</span>
                </div>
                
                <p className="sf-base-currency">
                  Base currency: {formatCompanyBase(total, catalog)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </StorefrontShell>
  );
}

function formatAddress(item: StorefrontAddress) {
  return [item.recipient, item.line1, item.city, item.country].filter(Boolean).join(" · ");
}

function OdooCheckoutForm({
  shippingAddresses,
  selectedShippingId,
}: {
  shippingAddresses: StorefrontAddress[];
  selectedShippingId?: string;
}) {
  const ready = shippingAddresses.length > 0;
  return (
    <div className="sf-checkout-card">
      {shippingAddresses.length === 0 && (
        <div className="sf-empty-address">
          <p>Add a delivery address before placing the order.</p>
          <Link className="sf-btn sf-btn-primary" href="/account/addresses?type=delivery&returnTo=/checkout">
            <span>Add delivery address</span>
          </Link>
        </div>
      )}
      {ready && (
        <form action={placeOdooOrderAction} className="sf-checkout-form">
          <div className="sf-form-section">
            <h3 className="sf-card-title">Delivery Address</h3>
            <div className="sf-address-list">
              {shippingAddresses.map((item) => (
                <label key={item.id} className="sf-address-item">
                  <input
                    type="radio"
                    name="shippingAddressId"
                    value={item.id}
                    defaultChecked={(selectedShippingId ?? shippingAddresses[0].id) === item.id}
                  />
                  <span className="sf-address-text">{formatAddress(item)}</span>
                </label>
              ))}
            </div>
            <p className="sf-address-hint">
              Need another address?{" "}
              <Link className="sf-text-link" href="/account/addresses?returnTo=/checkout">
                Add or edit addresses
              </Link>
            </p>
          </div>

          <div className="sf-form-actions">
            <OnceSubmit className="sf-btn sf-btn-success sf-btn-block" pendingLabel="Placing order…">
              <span>Place order</span>
            </OnceSubmit>
          </div>
        </form>
      )}
    </div>
  );
}