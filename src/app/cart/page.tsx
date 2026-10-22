import { StorefrontShell } from "../../components/storefront/shell";
import { StorefrontUnavailable } from "../../components/system/storefront-unavailable";
import { getCurrentCart } from "../../lib/commerce/cart";
import { getBusinessStatus, getCurrentCustomerSession } from "../../lib/session/customer";
import { safeApiCall } from "../../lib/odoo/safe";
import { getDisplayCurrencyState } from "../../lib/currency/display";
import { requireMerchant } from "../../lib/session/access";
// ملاحظة: سنحتاج إلى استيراد مكون السلة هنا
import { CartPageBody } from "../../components/storefront/cart-lines"; 

export const dynamic = "force-dynamic";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; minQty?: string; available?: string }>;
}) {
  const { error, minQty, available } = await searchParams;
  await requireMerchant();
  
  const loaded = await safeApiCall(async () => {
    const me = await getCurrentCustomerSession();
    const status = me.authenticated ? await getBusinessStatus() : { canViewWholesalePrices: false };
    const cart = me.authenticated ? await getCurrentCart() : null;
    return { me, canBuy: status.canViewWholesalePrices, cart };
  });
  
  if (!loaded.ok) return <StorefrontUnavailable />;
  const { me, canBuy, cart } = loaded.data;
  const { code: currency, catalog } = await getDisplayCurrencyState();

  return (
    <StorefrontShell>
      <main className="sf-account sf-cart-page">
        <div className="sf-page-container">
          
          <div className="sf-checkout-header">
            <p className="sf-kicker">Shopping Cart</p>
            <h1>Your Order List</h1>
          </div>

          {/* ✅ التصميم الشبكي الجديد (عمودين) */}
          <div className="sf-cart-layout">
            <div className="sf-cart-main">
              {/* هنا نمرر البيانات للمكون الذي يعرض المنتجات */}
              <CartPageBody
                initialCart={cart}
                error={error}
                minQty={minQty}
                availableQty={available}
                currency={currency}
                catalog={catalog}
                authenticated={me.authenticated}
                canBuy={canBuy}
              />
            </div>
            
            {/* العمود الجانبي (يمكنك إضافة أزرار الدفع هنا أو إبقاؤه فارغاً حالياً) */}
            <div className="sf-cart-sidebar">
               {/* سنضع هنا بطاقة الملخص لاحقاً إذا أردت */}
            </div>
          </div>

        </div>
      </main>
    </StorefrontShell>
  );
}