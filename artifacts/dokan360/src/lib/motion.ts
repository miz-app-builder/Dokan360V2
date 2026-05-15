import type { Variants } from "framer-motion";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ── Page / section entry ─────────────────────────────────── */
export const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.28, ease } },
};

export const slideInLeft: Variants = {
  hidden:  { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
};

/* ── Stagger container ────────────────────────────────────── */
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerFast: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0 } },
};

/* ── List items ───────────────────────────────────────────── */
export const listItem: Variants = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease } },
};

/* ── Reusable transition presets ──────────────────────────── */
export const spring = { type: "spring", stiffness: 380, damping: 30 } as const;
export const smoothTween = { duration: 0.25, ease } as const;

/* ── Standard viewport trigger props ─────────────────────── */
export const viewportOnce = { once: true, margin: "-40px" } as const;
