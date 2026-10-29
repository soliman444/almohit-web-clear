import { NextRequest } from "next/server";
import { getOdooApiPrefix, getOdooApiUrl, ODOO_SESSION_COOKIE_NAME } from "../../../../../../lib/odoo/config";
import { nextOdooCookies, readOdooSessionCookie } from "../../../../../../lib/odoo/cookies";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ purchaseId: string; imageId: string }> },
) {
  const { purchaseId, imageId } = await context.params;
  const purchase = Number(purchaseId);
  const image = Number(imageId);
  if (!Number.isInteger(purchase) || purchase < 1 || !Number.isInteger(image) || image < 1) {
    return new Response("Not found", { status: 404 });
  }

  const adapter = await nextOdooCookies();
  const session = readOdooSessionCookie(adapter);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const upstream = `${getOdooApiUrl()}${getOdooApiPrefix()}/buyer/purchases/${purchase}/images/${image}`;
  try {
    const response = await fetch(upstream, {
      cache: "no-store",
      credentials: "omit",
      redirect: "manual",
      headers: {
        accept: "image/*,application/octet-stream",
        cookie: `${ODOO_SESSION_COOKIE_NAME}=${session}`,
      },
    });
    if (!response.ok || response.status >= 300) {
      return new Response("Image unavailable", { status: response.status >= 400 ? response.status : 502 });
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (contentType.includes("text/html") || contentType.includes("application/json")) {
      return new Response("Image unavailable", { status: 502 });
    }
    return new Response(response.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 503 });
  }
}
