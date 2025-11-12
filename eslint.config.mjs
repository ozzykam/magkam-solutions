import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow any type (can be fixed later)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars as warnings
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow unescaped entities (apostrophes)
      "react/no-unescaped-entities": "warn",
      // Relax exhaustive-deps warnings
      "react-hooks/exhaustive-deps": "warn",
      // Allow img elements (can optimize later)
      "@next/next/no-img-element": "warn",
      // Allow prefer-const warnings
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
