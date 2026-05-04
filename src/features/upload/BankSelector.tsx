"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CreditCard, ChevronDown, Check } from "lucide-react";
import type { BankSelection, SavedCard } from "./types";

type Props = {
  value: BankSelection;
  onChange: (v: BankSelection) => void;
  savedCards: SavedCard[];
};

function selectionLabel(value: BankSelection): string {
  if (value.type === "saved_card") {
    const c = value.card;
    return c.nickname || `${c.bank}${c.cardVariant ? ` ${c.cardVariant}` : ""} ${c.cardType === "credit" ? "Credit" : "Debit"}`;
  }
  return "None";
}

function CardTypeBadge({ type }: { type: "credit" | "debit" }) {
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
        type === "credit"
          ? "bg-accent/10 text-accent"
          : "bg-success/10 text-success"
      }`}
    >
      {type === "credit" ? "Credit" : "Debit"}
    </span>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-2 pb-1">
      <span className="text-[10px] font-semibold tracking-wider uppercase text-text-muted">
        {label}
      </span>
    </div>
  );
}

function OptionRow({
  icon,
  label,
  sublabel,
  badge,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors rounded-lg mx-1 ${
        selected
          ? "bg-accent-muted text-accent"
          : "text-text-secondary hover:bg-elevated hover:text-text-primary"
      }`}
      style={{ width: "calc(100% - 8px)" }}
    >
      <span className={`flex-shrink-0 ${selected ? "text-accent" : "text-text-muted"}`}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{label}</span>
        {sublabel && (
          <span className="block text-xs text-text-muted truncate">{sublabel}</span>
        )}
      </span>
      {badge && <span className="flex-shrink-0">{badge}</span>}
      {selected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-accent" />}
    </button>
  );
}

export default function BankSelector({ value, onChange, savedCards }: Props) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleScroll = (e: Event) => {
      if (panelRef.current && panelRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(true);
  };

  if (savedCards.length === 0) {
    return (
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">
          Saved Card{" "}
          <span className="text-text-muted font-normal">— optional, auto-fills password</span>
        </label>
        <button
          type="button"
          disabled
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-base text-sm text-text-muted cursor-not-allowed"
        >
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">No saved cards</span>
        </button>
      </div>
    );
  }

  const panel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="bg-surface border border-border rounded-xl shadow-surface overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="py-1.5 max-h-80 overflow-y-auto">
        <SectionLabel label="My Cards" />
        <div className="px-1.5 space-y-0.5">
          {/* None option */}
          <OptionRow
            icon={<CreditCard className="w-4 h-4" />}
            label="None"
            sublabel="Enter password manually if needed"
            selected={value.type === "none"}
            onClick={() => { onChange({ type: "none" }); setOpen(false); }}
          />
          {savedCards.map((card) => {
            const cardLabel =
              card.nickname ||
              `${card.bank}${card.cardVariant ? ` ${card.cardVariant}` : ""}`;
            const selected = value.type === "saved_card" && value.card.id === card.id;
            return (
              <OptionRow
                key={card.id}
                icon={<CreditCard className="w-4 h-4" />}
                label={cardLabel}
                sublabel={card.password ? "Password saved" : undefined}
                badge={<CardTypeBadge type={card.cardType as "credit" | "debit"} />}
                selected={selected}
                onClick={() => {
                  onChange({ type: "saved_card", card });
                  setOpen(false);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-2">
        Saved Card{" "}
        <span className="text-text-muted font-normal">— optional, auto-fills password</span>
      </label>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-all ${
          open
            ? "border-accent ring-2 ring-accent/20 bg-base"
            : "border-border bg-base hover:border-border-bright"
        }`}
      >
        <span className="text-text-muted flex-shrink-0">
          <CreditCard className="w-4 h-4" />
        </span>
        <span className="flex-1 text-left truncate font-medium text-text-primary">
          {selectionLabel(value)}
        </span>
        {value.type === "saved_card" && (
          <CardTypeBadge type={value.card.cardType as "credit" | "debit"} />
        )}
        <ChevronDown
          className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}
