// @ts-check
import { defineConfig } from "astro/config";

// Static output only. The site is served locally from dist/ and will go to Vercel later,
// once the owner picks the domain. TODO: set `site` to the production origin at that point
// so canonical URLs and the sitemap can be absolute.
export default defineConfig({
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
