import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Tests use dynamic imports and loosely-typed DB rows; `any` is expected here.
  {
    files: ["tests/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  // Images are served from Cloudflare R2 (a CDN) or are arbitrary user uploads
  // (KYC documents, receipts, beneficiary photos). Next's server-side image
  // optimizer adds load without benefit for already-CDN'd assets and needs
  // per-host config for arbitrary uploads, so plain <img> is the right choice.
  {
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;
