import type { Variants } from "framer-motion";

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const cardHover: Variants = {
  rest:  { y: 0 },
  hover: { y: -2, transition: { duration: 0.15, ease: "easeOut" } },
  tap:   { scale: 0.99, transition: { duration: 0.1 } },
};

export const dropzoneVariants: Variants = {
  idle:     { scale: 1 },
  dragging: { scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } },
  accepted: { scale: 1 },
};

export const fileEntryVariants: Variants = {
  initial: { opacity: 0, height: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    height: "auto",
    scale: 1,
    transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.15 } },
};

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0 },
};

export const modalPanel: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
  },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
};

export const tableRow: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const savingPhaseContent: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit:    { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15, ease: "easeIn" } },
};
