"use client";

import { motion } from "framer-motion";
import { cardHover } from "@/lib/motion";

export default function SummaryCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: "red" | "green";
}) {
  const iconBg = highlight === "red"
    ? "bg-danger-muted"
    : highlight === "green"
    ? "bg-success-muted"
    : "bg-accent-muted";

  const valueColor = highlight === "red"
    ? "text-danger"
    : highlight === "green"
    ? "text-success"
    : "text-text-primary";

  const glowColor = highlight === "red"
    ? "[#ff336633]"
    : highlight === "green"
    ? "[#00ff871a]"
    : "[#00d4ff33]";

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={cardHover}
      className={`group relative bg-surface rounded-xl p-4 border border-border transition-all duration-200 hover:border-border-bright hover:bg-elevated hover:shadow-[0_0_20px_${glowColor}] overflow-hidden`}
    >
      <div className={`inline-flex p-2.5 ${iconBg} rounded-xl mb-3 transition-transform duration-200 group-hover:scale-105`}>
        {icon}
      </div>

      <p className="text-xs font-semibold font-mono text-text-muted uppercase tracking-widest mb-1.5">
        {title}
      </p>

      <p className={`font-display text-2xl sm:text-3xl font-bold ${valueColor} tracking-tight tabular-nums`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>

      {/* Decorative corner orb */}
      <div
        className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-5 ${
          highlight === "red" ? "bg-danger" : highlight === "green" ? "bg-success" : "bg-accent"
        } group-hover:scale-125 transition-transform duration-500`}
      />
    </motion.div>
  );
}
