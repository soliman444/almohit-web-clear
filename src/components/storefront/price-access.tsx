"use client";

import { createContext, useContext, type ReactNode } from "react";

const PriceAccessContext = createContext(false);

export function PriceAccessProvider({
  canViewWholesalePrices,
  children,
}: {
  canViewWholesalePrices: boolean;
  children: ReactNode;
}) {
  return (
    <PriceAccessContext.Provider value={canViewWholesalePrices}>
      {children}
    </PriceAccessContext.Provider>
  );
}

export function useCanViewWholesalePrices() {
  return useContext(PriceAccessContext);
}
