"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  CreditCard,
  Sparkles,
  ChevronDown,
  Check,
  Building2,
} from "lucide-react";
import type { BankOption, BankSelection, SavedCard } from "./types";

type Props = {
  value: BankSelection;
  onChange: (v: BankSelection) => void;
  savedCards: SavedCard[];
  bankOptions: BankOption[];
};

function selectionLabel(value: BankSelection): string {
  if (value.type === "auto") return "Auto Detect";
  if (value.type === "ai") return "Parse with AI";
  if (value.type === "saved_card") {
    const c = value.card;
    return c.nickname || `${c.bank}${c.cardVariant ? ` ${c.cardVariant}` : ""} ${c.cardType === "credit" ? "Credit" : "Debit"}`;
  }
  return value.cardVariant
    ? `${value.bank} · ${value.cardVariant}`
    : `${value.bank} · ${value.cardType === "credit" ? "Credit" : "Debit"}`;
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

export default function BankSelector({ value, onChange, savedCards, bankOptions }: Props) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const isAi = value.type === "ai";

  const panel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="bg-surface border border-border rounded-xl shadow-surface overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="py-1.5 max-h-80 overflow-y-auto">

        {/* Auto Detect */}
        <div className="px-1.5">
          <OptionRow
            icon={<Zap className="w-4 h-4" />}
            label="Auto Detect"
            sublabel="Let the parser identify your bank"
            selected={value.type === "auto"}
            onClick={() => { onChange({ type: "auto" }); setOpen(false); }}
          />
        </div>

        {/* My Cards */}
        {savedCards.length > 0 && (
          <>
            <div className="mx-3 my-1.5 border-t border-border" />
            <SectionLabel label="My Cards" />
            <div className="px-1.5 space-y-0.5">
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
          </>
        )}

        {/* Banks */}
        {bankOptions.length > 0 && (
          <>
            <div className="mx-3 my-1.5 border-t border-border" />
            <SectionLabel label="Banks" />
            <div className="px-1.5 space-y-0.5">
              {bankOptions.map((bo) =>
                bo.options.map((opt) => {
                  const selected = value.type === "bank" && value.configId === opt.configId;
                  return (
                    <OptionRow
                      key={opt.configId}
                      icon={<Building2 className="w-4 h-4" />}
                      label={bo.bank}
                      sublabel={opt.cardVariant || undefined}
                      badge={<CardTypeBadge type={opt.cardType} />}
                      selected={selected}
                      onClick={() => {
                        onChange({
                          type: "bank",
                          configId: opt.configId,
                          bank: bo.bank,
                          cardType: opt.cardType,
                          cardVariant: opt.cardVariant,
                        });
                        setOpen(false);
                      }}
                    />
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Parse with AI */}
        <div className="mx-3 my-1.5 border-t border-border" />
        <div className="px-1.5 pb-1">
          <OptionRow
            icon={<Sparkles className="w-4 h-4 text-accent" />}
            label="Parse with AI"
            sublabel="For unsupported banks — reads any format"
            selected={value.type === "ai"}
            onClick={() => { onChange({ type: "ai" }); setOpen(false); }}
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-2">
        Bank / Card
      </label>

      {/* Trigger */}
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
          {value.type === "auto" && <Zap className="w-4 h-4" />}
          {value.type === "ai" && <Sparkles className="w-4 h-4 text-accent" />}
          {value.type === "saved_card" && <CreditCard className="w-4 h-4" />}
          {value.type === "bank" && <Building2 className="w-4 h-4" />}
        </span>
        <span
          className={`flex-1 text-left truncate font-medium ${
            isAi ? "text-accent" : "text-text-primary"
          }`}
        >
          {selectionLabel(value)}
        </span>
        {value.type === "bank" && <CardTypeBadge type={value.cardType} />}
        {value.type === "saved_card" && (
          <CardTypeBadge type={value.card.cardType as "credit" | "debit"} />
        )}
        <ChevronDown
          className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Portal — renders outside overflow-hidden ancestors */}
      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}
