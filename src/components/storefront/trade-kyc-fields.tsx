import type { AppRole } from "../../lib/trade-kyc";

const PAYMENT_LABEL: Record<string, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  both: "Bank transfer or cash",
};

export type TradeKycDefaults = {
  businessName?: string;
  taxNumber?: string;
  businessType?: string;
  phone?: string;
  city?: string;
  address?: string;
  managerName?: string;
  employeeName?: string;
  bankAccount?: string;
  paymentMethod?: string;
  notes?: string;
  shopImageUrl?: string | null;
};

function shown(value?: string | null) {
  const text = (value ?? "").trim();
  return text || "—";
}

function Field({
  label,
  name,
  defaultValue,
  readOnly,
  required,
  className,
  placeholder,
  as = "input",
  accept,
  displayValue,
  invalid,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  as?: "input" | "textarea" | "select" | "file" | "photo";
  accept?: string;
  displayValue?: string | null;
  invalid?: boolean;
}) {
  const cls = ["sf-biz-field", className, invalid ? "is-invalid" : ""].filter(Boolean).join(" ");
  if (readOnly) {
    if (as === "photo") {
      return (
        <div className={cls}>
          <span>{label}</span>
          {displayValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="sf-biz-photo" src={displayValue} alt="Shop photo" />
          ) : (
            <p className="sf-biz-readonly">—</p>
          )}
        </div>
      );
    }
    const value = as === "select"
      ? (PAYMENT_LABEL[defaultValue ?? ""] ?? shown(defaultValue))
      : shown(defaultValue);
    return (
      <div className={cls}>
        <span>{label}</span>
        <p className="sf-biz-readonly" dir="auto">{value}</p>
      </div>
    );
  }
  if (as === "textarea") {
    return (
      <label className={cls}>{label}
        <textarea name={name} defaultValue={defaultValue ?? ""} dir="auto" aria-invalid={invalid || undefined} />
      </label>
    );
  }
  if (as === "select") {
    return (
      <label className={cls}>{label}
        <select name={name} defaultValue={defaultValue ?? ""} required={required} aria-invalid={invalid || undefined}>
          <option value="">Select payment method</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="cash">Cash</option>
          <option value="both">Bank transfer or cash</option>
        </select>
      </label>
    );
  }
  if (as === "file") {
    return (
      <label className={cls}>{label}
        <input name={name} type="file" accept={accept} aria-invalid={invalid || undefined} />
      </label>
    );
  }
  return (
    <label className={cls}>{label}
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        dir="auto"
        aria-invalid={invalid || undefined}
      />
    </label>
  );
}

export function TradeKycFields({
  role,
  defaults = {},
  readOnly = false,
  invalidFields = [],
}: {
  role: AppRole;
  defaults?: TradeKycDefaults;
  readOnly?: boolean;
  invalidFields?: string[];
}) {
  const bad = (name: string) => invalidFields.includes(name);

  if (role === "buyer" || role === "marketer") {
    return (
      <>
        <section className="sf-biz-block">
          <h2>{role === "marketer" ? "Marketer" : "Office"}</h2>
          <div className="sf-biz-grid">
            <Field label={role === "marketer" ? "Full name" : "Sourcing office"} name="businessName" defaultValue={defaults.businessName} required readOnly={readOnly} invalid={bad("businessName")} />
            <Field label="Commercial registration" name="taxNumber" defaultValue={defaults.taxNumber} required readOnly={readOnly} invalid={bad("taxNumber")} />
            <Field label={role === "marketer" ? "Coverage area" : "What you source"} name="businessType" placeholder={role === "marketer" ? "Riyadh, Jeddah…" : "Dates, citrus, mixed fruit…"} defaultValue={defaults.businessType} required readOnly={readOnly} invalid={bad("businessType")} />
            <Field label="Phone" name="phone" defaultValue={defaults.phone} readOnly={readOnly} invalid={bad("phone")} />
          </div>
        </section>
        <section className="sf-biz-block">
          <h2>Location</h2>
          <div className="sf-biz-grid">
            <Field label="City" name="city" defaultValue={defaults.city} required readOnly={readOnly} invalid={bad("city")} />
            <Field label="Contact person" name="managerName" defaultValue={defaults.managerName} required readOnly={readOnly} invalid={bad("managerName")} />
            <Field label={role === "marketer" ? "Base address" : "Office address"} name="address" defaultValue={defaults.address} required className="is-span-2" readOnly={readOnly} invalid={bad("address")} />
            <Field label="Notes" name="notes" defaultValue={defaults.notes} as="textarea" className="is-wide" readOnly={readOnly} invalid={bad("notes")} />
          </div>
        </section>
      </>
    );
  }

  if (role === "distributor") {
    return (
      <>
        <section className="sf-biz-block">
          <h2>Company</h2>
          <div className="sf-biz-grid">
            <Field label="Company name" name="businessName" defaultValue={defaults.businessName} required readOnly={readOnly} invalid={bad("businessName")} />
            <Field label="Commercial registration" name="taxNumber" defaultValue={defaults.taxNumber} required readOnly={readOnly} invalid={bad("taxNumber")} />
            <Field label="Coverage area" name="businessType" placeholder="Riyadh, Jeddah, Eastern Province…" defaultValue={defaults.businessType} required readOnly={readOnly} invalid={bad("businessType")} />
            <Field label="Phone" name="phone" defaultValue={defaults.phone} readOnly={readOnly} invalid={bad("phone")} />
          </div>
        </section>
        <section className="sf-biz-block">
          <h2>Location</h2>
          <div className="sf-biz-grid">
            <Field label="Base city" name="city" defaultValue={defaults.city} required readOnly={readOnly} invalid={bad("city")} />
            <Field label="Contact person" name="managerName" defaultValue={defaults.managerName} required readOnly={readOnly} invalid={bad("managerName")} />
            <Field label="Depot address" name="address" defaultValue={defaults.address} required className="is-span-2" readOnly={readOnly} invalid={bad("address")} />
            <Field label="Notes" name="notes" defaultValue={defaults.notes} as="textarea" className="is-wide" readOnly={readOnly} invalid={bad("notes")} />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="sf-biz-block">
        <h2>Shop</h2>
        <div className="sf-biz-grid">
          <Field label="Shop name" name="businessName" defaultValue={defaults.businessName} required readOnly={readOnly} invalid={bad("businessName")} />
          <Field label="Commercial registration" name="taxNumber" defaultValue={defaults.taxNumber} required readOnly={readOnly} invalid={bad("taxNumber")} />
          <Field label="Business type" name="businessType" placeholder="Grocery, dates shop, wholesaler…" defaultValue={defaults.businessType} readOnly={readOnly} invalid={bad("businessType")} />
          <Field label="Phone" name="phone" defaultValue={defaults.phone} readOnly={readOnly} invalid={bad("phone")} />
          <Field label="City" name="city" defaultValue={defaults.city} required readOnly={readOnly} invalid={bad("city")} />
          <Field label="Shop address" name="address" defaultValue={defaults.address} required className="is-span-3" readOnly={readOnly} invalid={bad("address")} />
        </div>
      </section>
      <section className="sf-biz-block">
        <h2>People & payment</h2>
        <div className="sf-biz-grid">
          <Field label="Shop manager" name="managerName" defaultValue={defaults.managerName} required readOnly={readOnly} invalid={bad("managerName")} />
          <Field label="Other employee" name="employeeName" defaultValue={defaults.employeeName} readOnly={readOnly} invalid={bad("employeeName")} />
          <Field label="Bank account" name="bankAccount" defaultValue={defaults.bankAccount} required readOnly={readOnly} invalid={bad("bankAccount")} />
          <Field label="Payment method" name="paymentMethod" defaultValue={defaults.paymentMethod} as="select" required readOnly={readOnly} invalid={bad("paymentMethod")} />
          <Field
            label="Shop photo"
            name="shopImage"
            as={readOnly ? "photo" : "file"}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="is-span-2"
            readOnly={readOnly}
            displayValue={defaults.shopImageUrl}
            invalid={bad("shopImage")}
          />
          <Field label="Notes" name="notes" defaultValue={defaults.notes} as="textarea" className="is-span-2" readOnly={readOnly} invalid={bad("notes")} />
        </div>
      </section>
    </>
  );
}
