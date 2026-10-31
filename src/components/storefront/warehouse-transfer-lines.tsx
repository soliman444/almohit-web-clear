"use client";

import { useState } from "react";

type Line = { key: string; productId: string; quantity: string };

function blank(): Line {
  return { key: `${Date.now()}-${Math.random()}`, productId: "", quantity: "" };
}

export function WarehouseTransferLines({
  invalid = false,
}: {
  invalid?: boolean;
}) {
  const [lines, setLines] = useState<Line[]>([blank(), blank()]);

  return (
    <div className="sf-wh-lines">
      <div className="sf-cart-table-wrap">
        <table className={`sf-cart-table${invalid ? " is-invalid" : ""}`}>
          <thead>
            <tr>
              <th scope="col">Product ID</th>
              <th scope="col" className="is-num">Quantity</th>
              <th scope="col"><span className="sf-sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key}>
                <td>
                  <input
                    name="productId"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 42"
                    value={line.productId}
                    aria-invalid={invalid || undefined}
                    onChange={(event) => {
                      const productId = event.target.value;
                      setLines((prev) =>
                        prev.map((row) => (row.key === line.key ? { ...row, productId } : row)),
                      );
                    }}
                  />
                </td>
                <td className="is-num">
                  <input
                    name="lineQuantity"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={line.quantity}
                    aria-invalid={invalid || undefined}
                    onChange={(event) => {
                      const quantity = event.target.value;
                      setLines((prev) =>
                        prev.map((row) => (row.key === line.key ? { ...row, quantity } : row)),
                      );
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="sf-text-link"
                    onClick={() => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.key !== line.key)))}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="sf-btn is-subtle"
        onClick={() => setLines((prev) => [...prev, blank()])}
      >
        <span>Add line</span>
      </button>
      <p className="muted">Use product IDs from the stock list. Quantity must be positive.</p>
    </div>
  );
}
