"use client";

import { useMemo, useState } from "react";

export type BuyerPurchaseProductOption = {
  id: string;
  name: string;
  defaultCode: string | null;
  uomLabel: string | null;
  lastPurchasePrice: number | null;
};

export type BuyerPurchaseCurrencyOption = {
  id: string;
  code: string;
  label: string;
};

type Line = {
  key: string;
  productId: string;
  quantity: string;
  priceUnit: string;
  plannedDate: string;
};

function money(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function emptyLine(products: BuyerPurchaseProductOption[], key = "1"): Line {
  const product = products[0];
  return {
    key,
    productId: product?.id ?? "",
    quantity: "1",
    priceUnit: product?.lastPurchasePrice != null ? String(product.lastPurchasePrice) : "0",
    plannedDate: "",
  };
}

export function BuyerPurchaseLines({
  products,
  currencies,
  defaultCurrencyId,
  invalidFields = [],
}: {
  products: BuyerPurchaseProductOption[];
  currencies: BuyerPurchaseCurrencyOption[];
  defaultCurrencyId: string;
  invalidFields?: string[];
}) {
  const currencyInvalid = invalidFields.includes("currencyId") || invalidFields.includes("currency");
  const linesInvalid = invalidFields.includes("lines")
    || invalidFields.includes("productId")
    || invalidFields.includes("quantity")
    || invalidFields.includes("priceUnit");
  const [currencyId, setCurrencyId] = useState(defaultCurrencyId || currencies[0]?.id || "");
  const [lines, setLines] = useState<Line[]>([emptyLine(products)]);
  const byId = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const currencyLabel = currencies.find((row) => row.id === currencyId)?.code
    || currencies.find((row) => row.id === currencyId)?.label
    || "—";

  const orderTotal = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity);
    const priceUnit = Number(line.priceUnit);
    if (!Number.isFinite(quantity) || !Number.isFinite(priceUnit)) return sum;
    return sum + quantity * priceUnit;
  }, 0);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function selectProduct(index: number, productId: string) {
    const product = byId.get(productId);
    updateLine(index, {
      productId,
      priceUnit: product?.lastPurchasePrice != null
        ? String(product.lastPurchasePrice)
        : lines[index]?.priceUnit ?? "0",
    });
  }

  return (
    <div className={`sf-buyer-lines${linesInvalid ? " is-invalid" : ""}`}>
      <label className={`sf-field sf-buyer-currency-field${currencyInvalid ? " is-invalid" : ""}`}>
        Currency
        <select
          name="currencyId"
          required
          value={currencyId}
          aria-invalid={currencyInvalid}
          onChange={(event) => setCurrencyId(event.target.value)}
        >
          {currencies.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.code}{currency.label && currency.label !== currency.code ? ` — ${currency.label}` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="sf-cart-table-wrap">
        <table className="sf-cart-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className="is-num">Qty</th>
              <th scope="col">UoM</th>
              <th scope="col">Planned date</th>
              <th scope="col" className="is-num">Unit price</th>
              <th scope="col" className="is-num">Line total</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const product = byId.get(line.productId);
              const quantity = Number(line.quantity);
              const priceUnit = Number(line.priceUnit);
              const lineTotal =
                Number.isFinite(quantity) && Number.isFinite(priceUnit)
                  ? quantity * priceUnit
                  : 0;
              return (
                <tr key={line.key}>
                  <td>
                    <select
                      name="productId"
                      required
                      value={line.productId}
                      onChange={(event) => selectProduct(index, event.target.value)}
                    >
                      <option value="">Select raw product</option>
                      {products.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}{entry.defaultCode ? ` (${entry.defaultCode})` : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="is-num">
                    <input
                      name="quantity"
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={line.quantity}
                      onChange={(event) => updateLine(index, { quantity: event.target.value })}
                    />
                  </td>
                  <td>
                    <span className="sf-buyer-uom">{product?.uomLabel || "—"}</span>
                  </td>
                  <td>
                    <input
                      name="plannedDate"
                      type="date"
                      value={line.plannedDate}
                      onChange={(event) => updateLine(index, { plannedDate: event.target.value })}
                    />
                  </td>
                  <td className="is-num">
                    <input
                      name="priceUnit"
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={line.priceUnit}
                      onChange={(event) => updateLine(index, { priceUnit: event.target.value })}
                    />
                  </td>
                  <td className="is-num">
                    <span className="sf-buyer-line-total">
                      {money(lineTotal)} {currencyLabel}
                    </span>
                  </td>
                  <td>
                    {lines.length > 1 && (
                      <button
                        className="sf-text-link"
                        type="button"
                        onClick={() => setLines(lines.filter((entry) => entry.key !== line.key))}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={5}>Order total</th>
              <td className="is-num">
                <strong>{money(orderTotal)} {currencyLabel}</strong>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <button
        className="sf-btn is-subtle"
        type="button"
        onClick={() => setLines([
          ...lines,
          emptyLine(products, String(Date.now())),
        ])}
      >
        <span>Add line</span>
      </button>
    </div>
  );
}
