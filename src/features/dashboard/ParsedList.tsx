import { ParsedResponse } from "@/features/dashboard/types";
import { format } from "date-fns";

type Props = {
  parsedList: ParsedResponse[];
  onSelect: (data: ParsedResponse) => void;
};

export default function ParsedList({ parsedList, onSelect }: Props) {
  if (parsedList.length === 0)
    return (
      <div className="bg-white shadow rounded-2xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3 px-1">
          🧾 Recent Parsed Statements
        </h2>
        <p className="text-gray-500 text-sm italic text-center">
          No recent statements yet
        </p>
      </div>
    );

  return (
    <div className="bg-white shadow rounded-2xl p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-600 mb-3 px-1">
        🧾 Recent Parsed Statements
      </h2>
      <ul className="divide-y">
        {parsedList.map((p, i) => (
          <li
            key={i}
            onClick={() => onSelect(p)}
            className="py-2 px-1 flex justify-between items-center hover:bg-gray-50 cursor-pointer rounded"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{p.bank}</p>
              <p className="text-xs text-gray-500">
                {p.summary.record_count} txns • Net{" "}
                {p.summary.net_change.toFixed(2)} AED
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {format(new Date(), "dd MMM yyyy")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
