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
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mb-8">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Search & Filter</h2>
          {hasFilters && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              <Filter className="w-3.5 h-3.5" /> Filters Active
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          disabled={!hasFilters}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            hasFilters
              ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
          title="Reset filters"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* active filter chips moved to TransactionsTable */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
            Search
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
            <div className="relative flex items-center bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl px-4 py-3.5 h-12 transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/20">
              <Search className="w-5 h-5 text-gray-400 mr-3 transition-colors group-hover:text-blue-500" />
              <input
                type="text"
                placeholder="Search transactions by description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400 text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
              From
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition-opacity duration-300"></div>
              <div className="relative flex items-center bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl px-4 py-3.5 h-12 w-full transition-all duration-300 focus-within:border-green-500 focus-within:shadow-lg focus-within:shadow-green-500/20">
                <CalendarDays className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-gray-700 text-sm font-medium min-w-0"
                />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
              To
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition-opacity duration-300"></div>
              <div className="relative flex items-center bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl px-4 py-3.5 h-12 w-full transition-all duration-300 focus-within:border-green-500 focus-within:shadow-lg focus-within:shadow-green-500/20">
                <CalendarDays className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-gray-700 text-sm font-medium min-w-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
