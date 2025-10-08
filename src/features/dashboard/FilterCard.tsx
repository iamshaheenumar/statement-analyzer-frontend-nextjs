import { Search } from "lucide-react";

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
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Search & Filter</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
          <div className="relative flex items-center bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/20">
            <svg
              className="w-5 h-5 text-gray-400 mr-3 transition-colors group-hover:text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
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
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
              From
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl text-sm text-gray-700 font-medium outline-none transition-all duration-300 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 hover:border-gray-300"
              />
            </div>
          </div>

          <div className="flex-1 relative group">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
              To
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl text-sm text-gray-700 font-medium outline-none transition-all duration-300 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 hover:border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
