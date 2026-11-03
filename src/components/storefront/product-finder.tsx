import type { StorefrontCategoryCard } from "../../lib/catalog/types";
import type { FinderQuery } from "../../lib/catalog/filters";

export function ProductFinder({
  categories,
  brands = [],
  query = {},
  compact = false,
  action = "/products",
  hash,
}: {
  categories: StorefrontCategoryCard[];
  brands?: Array<{ slug: string; name: string }>;
  query?: FinderQuery;
  compact?: boolean;
  action?: string;
  hash?: string;
}) {
  const roots = categories.filter((item) => !item.parentId);
  const formAction = hash ? `${action}${hash.startsWith("#") ? hash : `#${hash}`}` : action;

  const fields = (
    <>
      <label className="field is-search">
        Search
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Product name or SKU"
          autoComplete="off"
        />
      </label>
      <label className="field">
        Category
        <select name="category" defaultValue={query.category ?? ""}>
          <option value="">All collections</option>
          {roots.map((item) => (
            <option key={item.id} value={item.slug}>{item.name}</option>
          ))}
        </select>
      </label>
      {brands.length > 0 && (
        <label className="field">
          Brand
          <select name="brand" defaultValue={query.brand ?? ""}>
            <option value="">All brands</option>
            {brands.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        Minimum MOQ
        <input
          type="number"
          name="min_moq"
          min="0"
          step="0.01"
          defaultValue={query.min_moq ?? ""}
          placeholder="Any"
        />
      </label>
      <label className="field">
        Maximum MOQ
        <input
          type="number"
          name="max_moq"
          min="0"
          step="0.01"
          defaultValue={query.max_moq ?? ""}
          placeholder="Any"
        />
      </label>
      <label className="field">
        Availability
        <select name="availability" defaultValue={query.availability ?? ""}>
          <option value="">All</option>
          <option value="in-stock">Ready to supply</option>
        </select>
      </label>
      <label className="field">
        Sort
        <select
          name="sort"
          defaultValue={
            query.sort === "name_asc" ||
            query.sort === "name_desc" ||
            query.sort === "oldest"
              ? query.sort
              : "newest"
          }
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
      </label>
      <button className="btn" type="submit">Find products</button>
    </>
  );

  if (compact) {
    return (
      <section className="sf-finder is-compact" id="finder">
        <form className="sf-finder-form" action={formAction} method="get">
          {fields}
        </form>
      </section>
    );
  }

  return (
    <section className="sf-finder is-invite" id="finder">
      <form className="sf-finder-card" action={formAction} method="get">
        <h2>Find the right products for your business.</h2>
        <div className="sf-finder-form is-invite">
          {fields}
        </div>
      </form>
    </section>
  );
}
