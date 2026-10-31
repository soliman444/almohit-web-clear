import Link from "next/link";
import { StorefrontShell } from "../../../../components/storefront/shell";
import { WarehouseUnassigned } from "../../../../components/storefront/warehouse-unassigned";
import { StorefrontUnavailable } from "../../../../components/system/storefront-unavailable";
import { getMyWarehouses, listWarehouseStock } from "../../../../lib/odoo/warehouse";
import { safeWarehouseCall } from "../../../../lib/odoo/safe";
import { requireWarehouseManager } from "../../../../lib/session/access";

export const dynamic = "force-dynamic";

export default async function WarehouseStockPage({
  searchParams,
}: {
  searchParams: Promise<{ warehouseId?: string; page?: string }>;
}) {
  await requireWarehouseManager();
  const query = await searchParams;
  const warehouseId = query.warehouseId?.trim() || undefined;
  const page = Math.max(1, Number(query.page) || 1);

  const loaded = await safeWarehouseCall(async () => {
    const [access, stock] = await Promise.all([
      getMyWarehouses(),
      listWarehouseStock({ warehouseId, page, pageSize: 40 }),
    ]);
    return { access, stock };
  });
  if (!loaded.ok) {
    if (loaded.reason === "WAREHOUSE_ASSIGNMENT_REQUIRED") {
      return <WarehouseUnassigned />;
    }
    return <StorefrontUnavailable />;
  }
  const { access, stock } = loaded.data;

  return (
    <StorefrontShell>
      <main className="sf-account sf-invoice-page sf-wh-page">
        <Link className="sf-text-link" href="/account/warehouse">Warehouse desk</Link>
        <p className="sf-kicker">Stock</p>
        <h1>On-hand stock.</h1>
        <p className="muted">{stock.total} quant{stock.total === 1 ? "" : "s"} in assigned locations.</p>

        {access.warehouses.length > 1 && (
          <form className="sf-wh-filters" method="get">
            <label className="sf-field">
              Warehouse
              <select name="warehouseId" defaultValue={warehouseId ?? ""}>
                <option value="">All assigned</option>
                {access.warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </label>
            <button className="sf-btn is-subtle" type="submit"><span>Filter</span></button>
          </form>
        )}

        <div className="sf-cart-table-wrap">
          <table className="sf-cart-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Warehouse</th>
                <th scope="col">Location</th>
                <th scope="col" className="is-num">On hand</th>
                <th scope="col" className="is-num">Reserved</th>
                <th scope="col" className="is-num">Available</th>
              </tr>
            </thead>
            <tbody>
              {stock.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">No stock rows for this filter.</td>
                </tr>
              ) : stock.items.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    {row.product.name}
                    {row.product.defaultCode ? (
                      <span className="sf-wh-code"> · {row.product.defaultCode}</span>
                    ) : null}
                    <span className="sf-wh-code"> · id {row.product.id}</span>
                  </th>
                  <td>{row.warehouse?.name || "—"}</td>
                  <td>{row.location?.name || "—"}</td>
                  <td className="is-num">
                    {row.quantity}{row.product.uom ? ` ${row.product.uom.name}` : ""}
                  </td>
                  <td className="is-num">{row.reserved}</td>
                  <td className="is-num">{row.available}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(stock.page > 1 || stock.page < stock.pages) && (
          <div className="sf-wh-pager">
            {stock.page > 1 && (
              <Link
                className="sf-text-link"
                href={`/account/warehouse/stock?page=${stock.page - 1}${warehouseId ? `&warehouseId=${warehouseId}` : ""}`}
              >
                Previous
              </Link>
            )}
            <span className="muted">Page {stock.page} of {stock.pages}</span>
            {stock.page < stock.pages && (
              <Link
                className="sf-text-link"
                href={`/account/warehouse/stock?page=${stock.page + 1}${warehouseId ? `&warehouseId=${warehouseId}` : ""}`}
              >
                Next
              </Link>
            )}
          </div>
        )}
      </main>
    </StorefrontShell>
  );
}
