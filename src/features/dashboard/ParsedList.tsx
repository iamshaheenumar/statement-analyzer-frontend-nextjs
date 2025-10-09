const ParsedList = ({ parsedList, onSelect }: any) => {
  if (!parsedList || parsedList.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Recent Parsed Statements
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">
            No recent statements yet
          </p>
          <p className="text-sm text-gray-400">
            Upload a statement to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Recent Parsed Statements
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {parsedList.length} statement{parsedList.length !== 1 ? "s" : ""}{" "}
              available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <span className="text-xs font-semibold text-orange-700">Cached</span>
        </div>
      </div>

      <div className="space-y-3">
        {parsedList.map((p: any, i: number) => (
          <button
            key={i}
            onClick={() => onSelect(p)}
            className="w-full group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border-2 border-gray-200 hover:border-orange-300 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                      className="w-4 h-4 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {p.bank}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 ml-11">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-gray-600">
                      {p.summary.record_count} transactions
                    </span>
                  </div>

                  <div className="h-4 w-px bg-gray-300"></div>

                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span
                      className={`text-sm font-bold ${
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

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Parsed</p>
                  <p className="text-xs font-semibold text-gray-600">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ParsedList;
