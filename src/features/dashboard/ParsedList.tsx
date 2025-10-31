import {
  AlertCircle,
  Trash2,
  ClipboardList,
  FileText,
  CircleDollarSign,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { ParsedData, ParsedDataWithId } from "./types";
import { useState } from "react";

type Props = {
  parsedList: ParsedDataWithId[];
  onSelect: (item: string) => void;
  onDelete?: (id: string) => void;
};

const ParsedList = ({ parsedList, onSelect, onDelete }: Props) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete?.(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (!parsedList || parsedList.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Unsaved Statements
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-1 text-center">
            No recent statements yet
          </p>
          <p className="text-sm text-gray-400 text-center">
            Upload a statement to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Unsaved Statements
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {parsedList.length} statement{parsedList.length !== 1 ? "s" : ""}{" "}
              available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <span className="text-xs font-semibold text-orange-700">Unsaved</span>
        </div>
      </div>

      <div className="space-y-3">
        {parsedList.map((p, i) => (
          <div
            key={i}
            className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border-2 border-gray-200 hover:border-orange-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

            <button
              onClick={() => onSelect(p.id)}
              className="relative w-full p-4 sm:p-5 text-left"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Section - Bank Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                      {p.bank}
                    </h3>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-0 sm:pl-11">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">
                        {p.summary.record_count} transactions
                      </span>
                    </div>

                    <div className="hidden sm:block h-4 w-px bg-gray-300"></div>

                    <div className="flex items-center gap-1.5">
                      <CircleDollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span
                        className={`text-xs sm:text-sm font-bold whitespace-nowrap ${
                          p.summary.net_change >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Net {p.summary.net_change >= 0 ? "+" : ""}
                        {p.summary.net_change.toFixed(2)} AED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Date & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-3 pl-0 sm:pl-11 lg:pl-0">
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-gray-400 mb-1">Parsed</p>
                    <p className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </div>
            </button>

            {/* Delete Button */}
            {onDelete && (
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className={`group/delete p-2 rounded-xl transition-all duration-300 ${
                    deleteConfirm === p.id
                      ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                      : "bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-300"
                  }`}
                  title={
                    deleteConfirm === p.id
                      ? "Click again to confirm"
                      : "Delete statement"
                  }
                >
                  {deleteConfirm === p.id ? (
                    <AlertCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover/delete:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
            )}

            {/* Delete Confirmation Tooltip */}
            {deleteConfirm === p.id && (
              <div className="absolute top-14 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg z-20 whitespace-nowrap animate-pulse">
                Click again to confirm
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParsedList;
