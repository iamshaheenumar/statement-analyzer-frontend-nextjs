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
    <div className="bg-white shadow rounded-2xl p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-600 mb-3 px-1">
        🔍 Search & Filter
      </h2>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 w-full md:w-1/2 bg-gray-50">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by description..."
            className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400 text-sm"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 gap-2 w-full md:w-auto bg-gray-50">
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
