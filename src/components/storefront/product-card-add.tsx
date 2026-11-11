"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "../../lib/actions/cart";
import { commerceMessage } from "../../lib/commerce/errors";
import { useCartSession } from "./cart-session";

export function ProductCardAddButton({
  productId,
  minOrderQuantity,
  availableQuantity,
  productName,
}: {
  productId: string;
  minOrderQuantity: number;
  availableQuantity?: number;
  productName: string;
}) {
  const { replaceCart } = useCartSession();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="sf-product-add-wrap">
      <button
        type="button"
        className="sf-product-add"
        disabled={pending}
        aria-busy={pending}
        aria-label={`Add ${productName} to cart`}
        title={error ?? "Add to cart"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const quantity = minOrderQuantity;
          if (
            availableQuantity != null
            && Number.isFinite(availableQuantity)
            && quantity > availableQuantity
          ) {
            setError(commerceMessage("STOCK", undefined, availableQuantity));
            return;
          }
          setError(null);
          const formData = new FormData();
          formData.set("productId", productId);
          formData.set("quantity", String(quantity));
          formData.set("next", "/");
          startTransition(async () => {
            const result = await addToCartAction(formData);
            if (!result.ok) {
              setError(
                commerceMessage(
                  result.error,
                  result.minOrderQuantity,
                  result.availableQuantity,
                ),
              );
              return;
            }
            replaceCart(result.cart);
          });
        }}
      >
        <span aria-hidden>{pending ? "…" : "+"}</span>
      </button>
      {error ? (
        <span className="sf-product-add-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
