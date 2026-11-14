export type AccountRole =
  | "merchant"
  | "buyer"
  | "distributor"
  | "marketer"
  | "warehouse_manager";

export type AccountNavItem = {
  href: string;
  label: string;
  description: string;
  primary?: boolean;
};

export function labelAccountRole(role: string | null | undefined): string {
  switch (role) {
    case "buyer":
      return "Buyer";
    case "distributor":
      return "Distributor";
    case "marketer":
      return "Marketer";
    case "warehouse_manager":
      return "Warehouse manager";
    case "merchant":
      return "Merchant";
    default:
      return "Account";
  }
}

export function labelTradeStatus(state: string | null | undefined): string {
  if (!state) return "Unknown";
  return `${state.charAt(0).toUpperCase()}${state.slice(1)}`;
}

export function roleDeskCopy(role: AccountRole): { kicker: string; title: string; blurb: string } {
  switch (role) {
    case "buyer":
      return {
        kicker: "Buyer desk",
        title: "Procurement workspace.",
        blurb: "Source from suppliers into inventory. The sales catalog stays separate.",
      };
    case "marketer":
      return {
        kicker: "Marketer desk",
        title: "Merchant enrollment.",
        blurb: "Register shops you visit and track their approval status.",
      };
    case "warehouse_manager":
      return {
        kicker: "Warehouse desk",
        title: "Stock operations.",
        blurb: "Receive inbound stock, dispatch sales issues, and move inventory between warehouses.",
      };
    case "distributor":
      return {
        kicker: "Delivery desk",
        title: "Route deliveries.",
        blurb: "See assigned deliveries and update progress from the road.",
      };
    case "merchant":
    default:
      return {
        kicker: "Merchant",
        title: "Your trade account.",
        blurb: "Orders, invoices, payments, and delivery addresses.",
      };
  }
}

/** Operational links for a role. Trade account is appended separately. */
export function roleWorkspaceLinks(role: AccountRole): AccountNavItem[] {
  switch (role) {
    case "buyer":
      return [
        {
          href: "/account/buyer",
          label: "Procurement",
          description: "Open the buyer hub.",
          primary: true,
        },
        {
          href: "/account/buyer/suppliers",
          label: "Suppliers",
          description: "Farms and vendor records.",
        },
        {
          href: "/account/buyer/products",
          label: "Products",
          description: "Procurement product cards.",
        },
        {
          href: "/account/buyer/purchases",
          label: "Purchases",
          description: "Purchase orders and confirmations.",
        },
        {
          href: "/account/buyer/receipts",
          label: "Receipts",
          description: "Incoming stock receipts.",
        },
      ];
    case "marketer":
      return [
        {
          href: "/account/merchants",
          label: "My merchants",
          description: "Shops you enrolled.",
          primary: true,
        },
        {
          href: "/account/merchants/new",
          label: "Add merchant",
          description: "Register a shop while on site.",
        },
      ];
    case "warehouse_manager":
      return [
        {
          href: "/account/warehouse",
          label: "Warehouse desk",
          description: "Snapshot and assigned warehouses.",
          primary: true,
        },
        {
          href: "/account/warehouse/stock",
          label: "Stock",
          description: "On-hand quantities.",
        },
        {
          href: "/account/warehouse/receipts",
          label: "Receipts",
          description: "Inbound receipts to confirm.",
        },
        {
          href: "/account/warehouse/issues",
          label: "Issues",
          description: "Sales issues to dispatch.",
        },
        {
          href: "/account/warehouse/transfers",
          label: "Transfers",
          description: "Moves between warehouses.",
        },
        {
          href: "/account/warehouse/inventory",
          label: "Inventory",
          description: "Counts and variance sessions.",
        },
      ];
    case "distributor":
      return [
        {
          href: "/account/deliveries",
          label: "Deliveries",
          description: "Assigned routes and status updates.",
          primary: true,
        },
      ];
    case "merchant":
      return [
        {
          href: "/account/orders",
          label: "Orders",
          description: "Wholesale order history.",
          primary: true,
        },
        {
          href: "/account/invoices",
          label: "Invoices",
          description: "Open and paid invoices.",
        },
        {
          href: "/account/payments",
          label: "Payments",
          description: "Payment submissions.",
        },
        {
          href: "/account/addresses",
          label: "Addresses",
          description: "Shipping and billing addresses.",
        },
        {
          href: "/cart",
          label: "Cart",
          description: "Continue shopping.",
        },
      ];
    default:
      return [];
  }
}

export function accountDashboardLinks(
  role: AccountRole,
  tradeStatus: string,
): AccountNavItem[] {
  const approved = tradeStatus === "approved";
  const overview: AccountNavItem = {
    href: "/account",
    label: "Overview",
    description: "Desk home and status.",
    primary: true,
  };
  const trade: AccountNavItem = {
    href: "/account/business",
    label: "Trade account",
    description: approved
      ? "KYC and trade profile."
      : "Submit or review your trade application.",
    primary: !approved,
  };

  if (!approved) return [overview, trade];

  const workspace = roleWorkspaceLinks(role).map((item) => ({
    ...item,
    primary: false,
  }));
  return [overview, ...workspace, trade];
}

export function usesAccountDesk(role: AccountRole): boolean {
  return role !== "merchant";
}

export function asAccountRole(role: string | null | undefined): AccountRole {
  if (
    role === "buyer"
    || role === "distributor"
    || role === "marketer"
    || role === "warehouse_manager"
    || role === "merchant"
  ) {
    return role;
  }
  return "merchant";
}
