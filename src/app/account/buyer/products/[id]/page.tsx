import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StorefrontShell } from "../../../../../components/storefront/shell";
import { StorefrontUnavailable } from "../../../../../components/system/storefront-unavailable";
import { ApiClientError } from "../../../../../lib/odoo/errors";
import { getBuyerProduct } from "../../../../../lib/odoo/buyer";
import { parseOdooRecordId } from "../../../../../lib/odoo/catalog";
import { safeApiCall } from "../../../../../lib/odoo/safe";
import { requireBuyer } from "../../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function BuyerProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireBuyer();
  const { id } = await params;
  const { created } = await searchParams;
  const loaded = await safeApiCall(() => loadProduct(id));
  if (!loaded.ok) return <StorefrontUnavailable />;
  const product = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page">
        <Link className="sf-text-link" href="/account/buyer/products">All products</Link>
        <p className="sf-kicker">Product</p>
        <h1>{product.name}</h1>
        {created && <p className="sf-invoice-banner" role="status">Product created.</p>}
        {product.imageUrl && (
          <div className="sf-buyer-product-image">
            <Image src={product.imageUrl} alt={product.name} width={240} height={240} />
          </div>
        )}
        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table sf-delivery-meta">
            <tbody>
              <tr><th scope="row">Code</th><td>{product.defaultCode || "—"}</td></tr>
              <tr><th scope="row">Barcode</th><td>{product.barcode || "—"}</td></tr>
              <tr><th scope="row">Type</th><td>{product.type}</td></tr>
              <tr><th scope="row">Category</th><td>{product.category?.name || "—"}</td></tr>
              <tr><th scope="row">Brand</th><td>{product.brand?.name || "—"}</td></tr>
              <tr><th scope="row">UoM</th><td>{product.uom?.name || "—"}</td></tr>
              <tr><th scope="row">Purchase UoM</th><td>{product.purchaseUom?.name || "—"}</td></tr>
              <tr><th scope="row">Standard cost</th><td>{product.standardCost.toFixed(2)}</td></tr>
              <tr>
                <th scope="row">Last purchase</th>
                <td>{product.lastPurchasePrice == null ? "—" : product.lastPurchasePrice.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          <Link className="sf-btn" href="/account/buyer/purchases/new">
            <span>Create purchase</span>
            <span className="sf-arrow" aria-hidden>→</span>
          </Link>
        </p>
      </main>
    </StorefrontShell>
  );
}

async function loadProduct(id: string) {
  const productId = parseOdooRecordId(id);
  if (!productId) notFound();
  try {
    return await getBuyerProduct(productId);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 404 || error.code === "BUYER_PRODUCT_NOT_FOUND")) {
      notFound();
    }
    throw error;
  }
}
