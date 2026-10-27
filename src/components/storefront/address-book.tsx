"use client";

import Link from "next/link";
import { useState } from "react";
import {
  createAddressAction,
  deleteAddressAction,
  updateAddressAction,
} from "../../lib/actions/addresses";
import type { AddressDto } from "@/types/contracts";
import { OnceForm, OnceSubmit } from "./once-submit";

type BookAddress = AddressDto & {
  type?: "delivery" | "invoice";
  countryCode?: string | null;
  countryId?: string | null;
};

const COUNTRIES = [
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "YE", name: "Yemen" },
  { code: "KW", name: "Kuwait" },
  { code: "QA", name: "Qatar" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "EG", name: "Egypt" },
  { code: "JO", name: "Jordan" },
  { code: "IQ", name: "Iraq" },
];

function countryValue(address?: BookAddress) {
  const code = address?.countryCode || address?.country || "SA";
  return code.length === 2 ? code.toUpperCase() : "SA";
}

function countryName(codeOrName: string) {
  const code = codeOrName.length === 2 ? codeOrName.toUpperCase() : "";
  return COUNTRIES.find((item) => item.code === code)?.name ?? codeOrName;
}

function AddressFields({
  address,
  defaultType,
  defaultName,
  defaultPhone,
}: {
  address?: BookAddress;
  defaultType: "delivery" | "invoice";
  defaultName: string;
  defaultPhone: string;
}) {
  const country = countryValue(address);
  const known = COUNTRIES.some((item) => item.code === country);
  return (
    <div className="sf-address-form">
      <label className="sf-field">
        Type
        <select name="type" defaultValue={address?.type ?? defaultType} required>
          <option value="delivery">Delivery</option>
          <option value="invoice">Invoice</option>
        </select>
      </label>
      <label className="sf-field">Label<input name="label" defaultValue={address?.label ?? ""} placeholder="Warehouse, shop…" /></label>
      <label className="sf-field">
        Recipient
        <input name="recipient" required defaultValue={address?.recipient ?? defaultName} />
      </label>
      <label className="sf-field">Phone<input name="phone" defaultValue={address?.phone ?? defaultPhone} /></label>
      <label className="sf-field is-wide">
        Address line 1
        <input name="line1" required defaultValue={address?.line1 ?? ""} />
      </label>
      <label className="sf-field is-wide">Address line 2<input name="line2" defaultValue={address?.line2 ?? ""} /></label>
      <label className="sf-field">City<input name="city" required defaultValue={address?.city ?? ""} /></label>
      <label className="sf-field">
        Region
        <input name="region" defaultValue={address?.region ?? ""} />
      </label>
      <p className="muted is-wide">Region/state is optional. Yemen does not require a state.</p>
      <label className="sf-field">Postal code<input name="postalCode" defaultValue={address?.postalCode ?? ""} /></label>
      <label className="sf-field">
        Country
        <select name="country" defaultValue={known ? country : "SA"} required>
          {COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>{item.name}</option>
          ))}
        </select>
      </label>
      {address?.countryId && <input type="hidden" name="countryId" value={address.countryId} />}
    </div>
  );
}

function AddressCard({
  address,
  returnTo,
  defaultName,
  defaultPhone,
}: {
  address: BookAddress;
  returnTo: string;
  defaultName: string;
  defaultPhone: string;
}) {
  const [editing, setEditing] = useState(false);
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  const cityLine = [address.city, address.region, address.postalCode].filter(Boolean).join(", ");

  return (
    <li>
      <article className="sf-invoice-row sf-address-card-row">
        <div className="sf-invoice-col sf-col-main">
          <span className="sf-invoice-number">{address.label || address.recipient}</span>
          <span className="sf-invoice-dates">{address.recipient}</span>
          {street ? <span className="sf-invoice-order">{street}</span> : null}
          {cityLine ? <span className="sf-invoice-order">{cityLine}</span> : null}
          <span className="sf-invoice-order">{countryName(address.country)}</span>
          {address.phone ? <span className="sf-invoice-due">{address.phone}</span> : null}
        </div>

        <div className="sf-invoice-col sf-col-status">
          <span className="sf-badge">{address.type === "invoice" ? "Invoice" : "Delivery"}</span>
          {address.isDefault ? <span className="sf-invoice-dates">Default</span> : null}
        </div>

        <div className="sf-invoice-col sf-col-amounts">
          {!editing && (
            <div className="actions">
              <button className="sf-btn is-subtle" type="button" onClick={() => setEditing(true)}>
                <span>Edit</span>
              </button>
              <OnceForm action={deleteAddressAction}>
                <input type="hidden" name="id" value={address.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <OnceSubmit className="sf-text-link" pendingLabel="Archiving…">Archive</OnceSubmit>
              </OnceForm>
            </div>
          )}
        </div>

        {editing && (
          <div className="sf-address-edit is-wide">
            <OnceForm className="sf-auth-form" action={updateAddressAction} style={{ padding: 0 }}>
              <input type="hidden" name="id" value={address.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <AddressFields
                address={address}
                defaultType={address.type === "invoice" ? "invoice" : "delivery"}
                defaultName={defaultName}
                defaultPhone={defaultPhone}
              />
              <div className="actions">
                <OnceSubmit className="sf-btn" pendingLabel="Saving…"><span>Save address</span></OnceSubmit>
                <button className="sf-btn is-subtle" type="button" onClick={() => setEditing(false)}>
                  <span>Cancel</span>
                </button>
              </div>
            </OnceForm>
          </div>
        )}
      </article>
    </li>
  );
}

function AddressGroup({
  title,
  empty,
  addresses,
  returnTo,
  defaultName,
  defaultPhone,
}: {
  title: string;
  empty: string;
  addresses: BookAddress[];
  returnTo: string;
  defaultName: string;
  defaultPhone: string;
}) {
  return (
    <section className="sf-address-section">
      <h2>{title}</h2>
      {addresses.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="sf-order-list sf-invoice-card">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              returnTo={returnTo}
              defaultName={defaultName}
              defaultPhone={defaultPhone}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function AddressBook({
  addresses,
  defaultName,
  defaultPhone,
  defaultType,
  returnTo,
  saved,
}: {
  addresses: BookAddress[];
  defaultName: string;
  defaultPhone: string;
  defaultType: "delivery" | "invoice";
  returnTo: string;
  saved?: boolean;
}) {
  const delivery = addresses.filter((item) => item.type === "delivery");
  const invoice = addresses.filter((item) => item.type === "invoice");
  const fromCheckout = returnTo === "/checkout";

  return (
    <>
      {saved && <p role="status">Address saved.</p>}
      {fromCheckout && (
        <p>
          <Link className="sf-btn" href="/checkout"><span>Back to checkout</span></Link>
        </p>
      )}

      <AddressGroup
        title="Delivery addresses"
        empty={fromCheckout ? "No delivery address yet. Add one below, then return to checkout." : "No delivery address yet."}
        addresses={delivery}
        returnTo={returnTo}
        defaultName={defaultName}
        defaultPhone={defaultPhone}
      />

      <AddressGroup
        title="Invoice addresses"
        empty={fromCheckout ? "No invoice address yet. Add one below, then return to checkout." : "No invoice address yet."}
        addresses={invoice}
        returnTo={returnTo}
        defaultName={defaultName}
        defaultPhone={defaultPhone}
      />

      <section className="sf-address-section">
        <h2>Add new address</h2>
        <p className="muted">Use this form only to create a new address. Existing addresses stay collapsed until you click Edit.</p>
        <OnceForm className="sf-auth-form" action={createAddressAction} style={{ padding: 0 }}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <AddressFields
            defaultType={defaultType}
            defaultName={defaultName}
            defaultPhone={defaultPhone}
          />
          <OnceSubmit className="sf-btn" pendingLabel="Adding…"><span>Add address</span></OnceSubmit>
        </OnceForm>
      </section>
    </>
  );
}
