import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // Category/product Odoo media uses ?unique=… cache-busters; omit `search` to allow any query.
    localPatterns: [
      { pathname: "/odoo-media/**" },
      { pathname: "/brand/**", search: "" },
      { pathname: "/heroes/**", search: "" },
    ],
    qualities: [75, 90, 100],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "trading.m-arabi.com" },
    ],
  },
};

export default nextConfig;
