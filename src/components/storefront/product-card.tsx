"use client";

import Link from "next/link";
import { primaryImage, viewTransitionName } from "../../lib/catalog/media";
import { getCurrencyConfig } from "../../lib/currency/format";
import { storefrontCartProductId } from "../../lib/storefront-cart-product";
import type { StorefrontProduct } from "../../lib/catalog/types";
import {
  useCurrencyCatalog,
  useDisplayCurrency,
  useFormatCatalogMoney,
} from "./display-currency";
import { MediaFrame } from "./media-frame";
import { useCanViewWholesalePrices } from "./price-access";
import { ProductCardAddButton } from "./product-card-add";
import { Reveal } from "./reveal";

export function ProductCard({
  product,
  index = 0,
  size = "default",
}: {
  product: StorefrontProduct;
  index?: number;
  size?: "default" | "wide" | "feature";
}) {
  const image = primaryImage(product);
  const formatMoney = useFormatCatalogMoney();
  const displayCurrency = useDisplayCurrency();
  const currencyCatalog = useCurrencyCatalog();
  const currencyConfig = getCurrencyConfig(displayCurrency, currencyCatalog);
  const canViewWholesalePrices = useCanViewWholesalePrices();
  const visiblePrice = canViewWholesalePrices ? product.price : null;
  const formattedPrice = visiblePrice ? formatMoney(visiblePrice.amount) : null;
  const priceAmount = formattedPrice
    ? formattedPrice.startsWith(currencyConfig.symbol)
      ? formattedPrice.slice(currencyConfig.symbol.length).trim()
      : formattedPrice
    : null;
  const cartProductId = storefrontCartProductId(product);
  const canQuickAdd = Boolean(
    canViewWholesalePrices
      && visiblePrice
      && product.inStock
      && cartProductId,
  );

  return (
    <Reveal delay={Math.min(index, 3) * 0.07}>
      <article className={`sf-product is-card is-${size}`}>
        <Link className="sf-product-link" href={`/products/${product.slug}`}>
          <div
            className="sf-product-media"
            data-view
            style={{ viewTransitionName: viewTransitionName(product.slug) }}
          >
            <MediaFrame
              src={image?.src}
              alt={image?.alt || product.name}
              seed={product.slug}
              sizes={
                size === "feature"
                  ? "70vw"
                  : size === "wide"
                    ? "56vw"
                    : "(max-width: 700px) 48vw, 24vw"
              }
              preset="product-card"
              fit="cover"
              fitMode="COVER"
              focalX={image?.focalX ?? 50}
              focalY={image?.focalY ?? 50}
              scale={1}
              allowFallback={false}
              className="is-primary"
            />
            <span className={`sf-product-stock${product.inStock ? " is-ready" : ""}`}>
              {product.inStock ? "In stock" : "Unavailable"}
            </span>
          </div>

          <div className="sf-product-meta">
            <p className="sf-product-kicker">{product.category.name}</p>
            <h3>{product.name}</h3>
          </div>
        </Link>

        <div className="sf-product-footer">
          <span className="sf-product-moq">MOQ {product.minOrderQuantity}</span>
          {formattedPrice && priceAmount ? (
            <div className={`sf-product-buy${canQuickAdd ? " has-add" : ""}`}>
              <span className="sf-product-price" aria-label={formattedPrice}>
                <span className="sf-product-price-currency">{currencyConfig.symbol}</span>
                <span className="sf-product-price-amount">{priceAmount}</span>
              </span>
              {canQuickAdd && cartProductId ? (
                <ProductCardAddButton
                  productId={cartProductId}
                  minOrderQuantity={product.minOrderQuantity}
                  availableQuantity={product.availableQuantity}
                  productName={product.name}
                />
              ) : null}
            </div>
          ) : (
            <span className="sf-price-note is-locked">Price after approval</span>
          )}
        </div>
      </article>
    </Reveal>
  );
}
