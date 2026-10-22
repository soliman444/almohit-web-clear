"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CommerceError, commerceErrorCode } from "../commerce/errors";
import { requireMerchant } from "../session/access";
import { checkoutOdooCart, mapOdooCheckoutError } from "../odoo/checkout";

function value(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function withError(path: string, error: unknown) {
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("error", commerceErrorCode(error));
  if (error instanceof CommerceError && error.details?.minOrderQuantity != null) {
    url.searchParams.set("minQty", String(error.details.minOrderQuantity));
  }
  if (error instanceof CommerceError && error.details?.availableQuantity != null) {
    url.searchParams.set("available", String(error.details.availableQuantity));
  }
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function revalidateStore() {
  revalidatePath("/", "layout");
  revalidatePath("/products", "layout");
  revalidatePath("/categories", "layout");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/account", "layout");
  revalidatePath("/account/orders");
  revalidatePath("/account/invoices");
  revalidatePath("/account/payments");
  revalidatePath("/account/addresses");
}

export async function placeOdooOrderAction(formData: FormData) {
  await requireMerchant();

  const rawShipping = value(formData, "shippingAddressId");

  let shippingAddressId: number | undefined;

  if (rawShipping !== "") {
    const parsed = Number(rawShipping);

    if (
      !/^[1-9]\d*$/.test(rawShipping) ||
      !Number.isSafeInteger(parsed)
    ) {
      redirect(
        withError("/checkout", new CommerceError("ADDRESS")),
      );
    }

    shippingAddressId = parsed;
  }

  let orderId = "";

  try {
    const order = await checkoutOdooCart(
      shippingAddressId === undefined
        ? {}
        : { shipping_address_id: shippingAddressId },
    );

    orderId = order.id;
  } catch (error) {
    const path =
      shippingAddressId === undefined
        ? "/checkout"
        : `/checkout?shipping=${shippingAddressId}`;

    redirect(
      withError(path, mapOdooCheckoutError(error)),
    );
  }

  revalidateStore();

  redirect(`/account/orders/${orderId}?placed=1`);
}