'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface PatternFieldProps {
  label: string;
  value: string | string[];
  confidence?: number;
  sampleLines?: string[];
  onChange: (value: string | string[]) => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const cls =
    confidence >= 0.8 ? 'bg-success-muted text-success border-success/20' :
    confidence >= 0.5 ? 'bg-warning-muted text-warning border-warning/20' :
    'bg-danger-muted text-danger border-danger/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cls}`}>
      {pct}%
    </span>
  );
}

export default function PatternField({ label, value, confidence, sampleLines, onChange }: PatternFieldProps) {
  const [showSamples, setShowSamples] = useState(false);

  const primary = Array.isArray(value) ? (value[0] ?? '') : value;
  const fallbacks = Array.isArray(value) ? value.slice(1) : [];

  function updatePrimary(newPrimary: string) {
    if (fallbacks.length === 0) {
      onChange(newPrimary);
    } else {
      onChange([newPrimary, ...fallbacks]);
    }
  }

  function updateFallback(index: number, newVal: string) {
    const next = [...fallbacks];
    next[index] = newVal;
    onChange([primary, ...next]);
  }

  function removeFallback(index: number) {
    const next = fallbacks.filter((_, i) => i !== index);
    onChange(next.length === 0 ? primary : [primary, ...next]);
  }

  function addFallback() {
    onChange([primary, ...fallbacks, '']);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        {confidence !== undefined && <ConfidenceBadge confidence={confidence} />}
        {sampleLines && sampleLines.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSamples(v => !v)}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors ml-auto"
          >
            {showSamples ? 'hide samples' : `${sampleLines.length} sample${sampleLines.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      <textarea
        value={primary}
        onChange={e => updatePrimary(e.target.value)}
        rows={2}
        spellCheck={false}
        className="w-full px-3 py-2 text-xs font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        placeholder="Primary regex pattern…"
      />

      {fallbacks.length > 0 && (
        <div className="space-y-1.5 pl-3 border-l-2 border-border">
          <p className="text-[11px] text-text-muted uppercase font-mono tracking-widest">Fallbacks (tried in order)</p>
          {fallbacks.map((fb, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <textarea
                value={fb}
                onChange={e => updateFallback(i, e.target.value)}
                rows={1}
                spellCheck={false}
                className="flex-1 px-2.5 py-1.5 text-xs font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                placeholder={`Fallback ${i + 1}…`}
              />
              <button
                type="button"
                onClick={() => removeFallback(i)}
                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors shrink-0 mt-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addFallback}
        className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
      >
        <Plus className="w-3 h-3" /> Add fallback
      </button>

      {showSamples && sampleLines && sampleLines.length > 0 && (
        <div className="bg-base border border-border rounded-lg p-2.5 space-y-1">
          {sampleLines.map((line, i) => (
            <code key={i} className="block text-[11px] font-mono text-text-secondary truncate" title={line}>
              {line}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}
