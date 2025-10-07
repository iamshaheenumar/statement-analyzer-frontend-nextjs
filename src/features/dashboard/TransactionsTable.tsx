import { format, parseISO } from "date-fns";
import { Transaction } from "./types";

type Props = {
  transactions: Transaction[];
};

export default function TransactionsTable({ transactions }: Props) {
  return (
    <div className="bg-white shadow rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              <th className="py-3 px-4 text-gray-600 font-semibold">Sl No</th>
              <th className="py-3 px-4 text-gray-600 font-semibold">Date</th>
              <th className="py-3 px-4 text-gray-600 font-semibold">
                Description
              </th>
              <th className="py-3 px-4 text-gray-600 font-semibold text-right">
                Debit (AED)
              </th>
              <th className="py-3 px-4 text-gray-600 font-semibold text-right">
                Credit (AED)
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-500 italic"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((t, i) => (
                <tr
                  key={i}
                  className="border-b last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4 text-gray-700">{i + 1}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {format(parseISO(t.transaction_date), "dd MMM yyyy")}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{t.description}</td>
                  <td className="py-3 px-4 text-right text-red-600">
                    {t.debit ? t.debit.toFixed(2) : "-"}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600">
                    {t.credit ? t.credit.toFixed(2) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
