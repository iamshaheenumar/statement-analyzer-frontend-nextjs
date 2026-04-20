import { Search, X, Filter, RotateCcw, CalendarDays } from "lucide-react";

type Props = {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  setSearchTerm: (v: string) => void;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
};

export default function FilterCard({
  searchTerm,
  setSearchTerm,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
}: Props) {
  const hasFilters = Boolean(searchTerm?.trim() || dateFrom || dateTo);

  const handleReset = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border mb-8">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-muted ring-1 ring-accent/20 flex items-center justify-center">
            <Search className="w-4 h-4 text-accent" />
          </div>
          <h2 className="font-display text-base font-bold text-text-primary">Search & Filter</h2>
          {hasFilters && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-accent bg-accent-muted border border-accent/20">
              <Filter className="w-3.5 h-3.5" />
              Filters Active
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          disabled={!hasFilters}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            hasFilters
              ? "bg-elevated hover:bg-overlay text-text-secondary"
              : "bg-base text-text-muted cursor-not-allowed"
          }`}
          title="Reset filters"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2 ml-1">
            Search
          </label>
          <div className="relative flex items-center bg-base border border-border rounded-xl px-4 h-11 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all duration-150">
            <Search className="w-4 h-4 text-text-muted mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search transactions by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none bg-transparent text-text-primary placeholder:text-text-muted text-sm font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="ml-2 w-5 h-5 rounded-full bg-elevated hover:bg-overlay flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-text-secondary" />
              </button>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "From", value: dateFrom, onChange: setDateFrom },
            { label: "To", value: dateTo, onChange: setDateTo },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="min-w-0">
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2 ml-1">
                {label}
              </label>
              <div className="flex items-center bg-base border border-border rounded-xl px-4 h-11 w-full focus-within:border-success focus-within:ring-1 focus-within:ring-success transition-all duration-150">
                <CalendarDays className="w-4 h-4 text-text-muted mr-3 shrink-0" />
                <input
                  type="date"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-text-secondary text-sm font-mono min-w-0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
