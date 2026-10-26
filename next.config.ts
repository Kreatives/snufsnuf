import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Prototype: pagina's gebruiken per-request datums (agenda, slots), dus geen
     prerender-caching. Zet dit later per pagina aan met "use cache". */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
