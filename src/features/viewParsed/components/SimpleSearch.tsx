import { Search } from "lucide-react";

type Props = { value: string; onChange: (v: string) => void };

export default function SimpleSearch({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search transactions…"
        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono text-text-primary bg-surface border border-border rounded-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-150"
      />
    </div>
  );
}
