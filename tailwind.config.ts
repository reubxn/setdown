import type { Config } from "tailwindcss";
import containerQueries from "@tailwindcss/container-queries";

/**
 * Tailwind v4 is configured primarily via CSS-first directives in
 * `app/globals.css` (@theme, @plugin, @utility). This file exists for
 * tools/ides that expect a JS config and to make the plugin set
 * explicit in source. Theme tokens live in globals.css.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  plugins: [containerQueries],
};

export default config;
