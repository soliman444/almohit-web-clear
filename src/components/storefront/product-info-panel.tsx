"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { duration, ease } from "../../lib/motion";
import type { DisplayCurrencyCode } from "../../config/currencies";
import { getCurrencyConfig } from "../../lib/currency/format";
import {
  useCurrencyCatalog,
  useDisplayCurrency,
  useFormatCatalogMoney,
} from "./display-currency";
import type { StorefrontProduct } from "../../lib/catalog/types";
import { storefrontCartProductId } from "../../lib/storefront-cart-product";
import { AddToCartForm } from "./add-to-cart-form";
import { ButtonLink } from "./button-link";
import { VariantPicker, resolveSelectedVariant } from "./variant-picker";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function ProductInfoPanel({
  product,
  showPrices,
  allowAddToCart = false,
  requestHref,
  notice,
  error,
  selection,
}: {
  product: StorefrontProduct;
  currency: DisplayCurrencyCode;
  showPrices: boolean;
  allowAddToCart?: boolean;
  requestHref: string;
  notice?: string;
  error?: string;
  selection?: {
    selected: Record<string, string>;
    onChange: (next: Record<string, string>) => void;
  };
}) {
  const formatMoney = useFormatCatalogMoney();
  const displayCurrency = useDisplayCurrency();
  const currencyCatalog = useCurrencyCatalog();
  const currencyConfig = getCurrencyConfig(displayCurrency, currencyCatalog);
  const reduce = useReducedMotion();
  const [internalSelected, setInternalSelected] = useState<Record<string, string>>({});
  const selected = selection?.selected ?? internalSelected;
  const setSelected = selection?.onChange ?? setInternalSelected;
  const variable = product.productType === "VARIABLE";
  const variant = variable ? resolveSelectedVariant(product, selected) : null;
  const sku = variant?.sku ?? product.sku;
  const inStock = variable ? Boolean(variant?.inStock) : product.inStock;
  const availableQuantity = variable ? variant?.availableQuantity : product.availableQuantity;
  const price = variable ? variant?.price : product.price ?? undefined;
  const cartProductId = storefrontCartProductId(product, variant?.id);

  const stockLabel = !variable || variant
    ? inStock
      ? "Ready to supply"
      : "Currently unavailable"
    : "Select options";

  const facts = [
    ["Collection", product.category.name],
    ["Brand", product.brand?.name ?? "Almohit"],
    ["SKU", sku],
    ["Minimum order", String(product.minOrderQuantity)],
    ["UOM", product.unitOfMeasure?.name],
  ] as const;

  const formattedPrice = price ? formatMoney(price.amount) : null;
  const priceAmount = formattedPrice
    ? formattedPrice.startsWith(currencyConfig.symbol)
      ? formattedPrice.slice(currencyConfig.symbol.length).trim()
      : formattedPrice
    : null;

  return (
    <motion.aside
      className="sf-pdp-panel is-rich"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={fade}
      transition={{ duration: duration.reveal, ease }}
    >
      <div className="sf-pdp-card">
        <div className="sf-pdp-card-top">
          <p className="sf-pdp-kicker">
            <Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link>
            {product.brand ? <span> · {product.brand.name}</span> : null}
          </p>
          <h1>{product.name}</h1>
          {product.shortDescription ? (
            <p className="sf-pdp-lede">{product.shortDescription}</p>
          ) : null}
        </div>

        <div className="sf-pdp-buy-head">
          <div className="sf-price-box">
            {!showPrices ? (
              <p>Price available to approved merchants</p>
            ) : formattedPrice && priceAmount ? (
              <>
                <span className="sf-pdp-price-label">Wholesale price</span>
                <p className="sf-pdp-price" aria-label={formattedPrice}>
                  <span className="sf-pdp-price-currency">{currencyConfig.symbol}</span>
                  <span className="sf-pdp-price-amount">{priceAmount}</span>
                </p>
              </>
            ) : variable && !variant ? (
              <p>Select options to see price</p>
            ) : (
              <p>This option is not priced for your account.</p>
            )}
          </div>

          <div className="sf-pdp-status" aria-label="Availability">
            <span className={`sf-pdp-status-dot${inStock ? " is-on" : ""}`} aria-hidden />
            <span>{stockLabel}</span>
          </div>
        </div>

        <div className="sf-pdp-meta-grid">
          {facts.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>

        {variable ? (
          <div className="sf-pdp-variants">
            <VariantPicker product={product} selected={selected} onChange={setSelected} />
          </div>
        ) : null}

        {notice ? <p className="sf-pdp-notice">{notice}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="sf-pdp-action">
          {showPrices && price && inStock && allowAddToCart && cartProductId ? (
            <AddToCartForm
              productId={cartProductId}
              minOrderQuantity={product.minOrderQuantity}
              next={`/products/${product.slug}`}
              inStock={inStock}
              availableQuantity={availableQuantity}
            />
          ) : !showPrices ? (
            <ButtonLink href={requestHref}>Request a trade account</ButtonLink>
          ) : allowAddToCart && variable && !variant ? (
            <p className="sf-pdp-hint">Select options before adding to cart.</p>
          ) : allowAddToCart && !inStock ? (
            <p className="sf-pdp-hint">Currently unavailable</p>
          ) : allowAddToCart && !cartProductId ? (
            <p className="sf-pdp-hint">This product cannot be added to the cart yet.</p>
          ) : null}
        </div>
      </div>
    </motion.aside>
  );
}
