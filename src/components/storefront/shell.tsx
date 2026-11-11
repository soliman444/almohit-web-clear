import { getDisplayCurrencyState } from "../../lib/currency/display";
import { getBusinessStatus } from "../../lib/session/customer";
import { DisplayCurrencyProvider } from "./display-currency";
import { FloatingDock } from "./floating-dock";
import { PageFade } from "./page-fade";
import { PriceAccessProvider } from "./price-access";
import { SiteFooter } from "./site-footer";
import { StorefrontHeader } from "./storefront-header";

export async function StorefrontShell({
  children,
  transparentHeader,
}: {
  children: React.ReactNode;
  transparentHeader?: boolean;
}) {
  const [{ code: currency, catalog }, status] = await Promise.all([
    getDisplayCurrencyState(),
    getBusinessStatus(),
  ]);
  return (
    <DisplayCurrencyProvider currency={currency} catalog={catalog}>
      <PriceAccessProvider canViewWholesalePrices={status.canViewWholesalePrices}>
        <div className="sf">
          <div className="sf-site-backdrop" aria-hidden>
            <span className="sf-site-backdrop-wash" />
            <span className="sf-site-backdrop-orb is-leaf" />
            <span className="sf-site-backdrop-orb is-warm" />
            <span className="sf-site-backdrop-grid" />
            <span className="sf-site-backdrop-grain" />
          </div>
          <StorefrontHeader transparent={transparentHeader} currency={currency} currencies={catalog}>
            <PageFade className="sf-site-stage">{children}</PageFade>
            <SiteFooter />
            <FloatingDock />
          </StorefrontHeader>
        </div>
      </PriceAccessProvider>
    </DisplayCurrencyProvider>
  );
}
