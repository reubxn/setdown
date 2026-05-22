/**
 * Design tokens shared between CSS and JS.
 *
 * Source of truth: css custom properties in app/globals.css.
 * This file mirrors them as TS constants for use in chart libraries (recharts),
 * inline styles, and other JS-driven sizing where css vars aren't ergonomic.
 *
 * Keep in sync with globals.css when values change.
 */

export const colors = {
  bgBase: "#0a0a0b",
  bgElevated: "#131418",
  bgSunken: "#060608",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  borderStrong: "rgba(255, 255, 255, 0.12)",
  textPrimary: "#ffffff",
  textSecondary: "#c2c8d0",
  textMuted: "#7d8b9a",
  accent: "#00c2ff",
  accentHover: "#00a8e0",
  accentMuted: "rgba(0, 194, 255, 0.16)",
  danger: "#ff4d4f",
  warn: "#ffb020",
  success: "#22c55e",
} as const;

/** 4px base scale. Use these for padding, gaps, margins. */
export const spacing = {
  px: "1px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

/** Type scale in px. Numbers are sizes; lineHeight is unitless. */
export const typography = {
  display: { size: 48, lineHeight: 1.1, weight: 600, tracking: "-0.02em" },
  h1: { size: 32, lineHeight: 1.2, weight: 600, tracking: "-0.01em" },
  h2: { size: 24, lineHeight: 1.25, weight: 600, tracking: "-0.005em" },
  h3: { size: 20, lineHeight: 1.3, weight: 600, tracking: "0" },
  body: { size: 14, lineHeight: 1.5, weight: 400, tracking: "0" },
  bodyLg: { size: 16, lineHeight: 1.5, weight: 400, tracking: "0" },
  small: { size: 13, lineHeight: 1.4, weight: 400, tracking: "0" },
  caption: { size: 12, lineHeight: 1.4, weight: 500, tracking: "0.02em" },
  micro: { size: 10, lineHeight: 1.3, weight: 500, tracking: "0.08em" },
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const shadows = {
  card: "0 1px 2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)",
  elevated:
    "0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)",
} as const;

/** Container query breakpoints used by ui primitives. */
export const containerBreakpoints = {
  xs: 320,
  sm: 480,
  md: 640,
  lg: 800,
  xl: 1024,
} as const;

/** Chart-specific tokens consumed by recharts components. */
export const chart = {
  accent: colors.accent,
  axis: colors.textMuted,
  grid: colors.borderSubtle,
  tooltipBg: colors.bgElevated,
  tooltipBorder: colors.borderStrong,
  series: [
    colors.accent,
    "#5ec2ff",
    "#ffb020",
    "#c084fc",
    "#ff4d4f",
    "#7d8b9a",
  ],
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type TypographyToken = keyof typeof typography;
