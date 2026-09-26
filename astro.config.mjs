// @ts-check
import { defineConfig } from "astro/config";

// Static output, hosted on Vercel at https://mission-llm.com (DNS on Cloudflare).
export default defineConfig({
  site: "https://mission-llm.com",
  output: "static",
  trailingSlash: "ignore",
  build: {
    // /download -> dist/download/index.html, served as /download by the local server and Vercel.
    format: "directory",
    // Keep every stylesheet external so the pages stay cacheable and CSP-friendly.
    inlineStylesheets: "never",
  },
  // No client-side prefetching: the site must stay quiet on constrained government networks.
  prefetch: false,
  devToolbar: { enabled: false },
  vite: {
    build: {
      // Fonts and small assets stay as files, never inlined as data URIs.
      assetsInlineLimit: 0,
    },
  },
});
