export default function SummaryCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: "red" | "green";
}) {
  return (
    <div
      className={`rounded-2xl p-4 bg-white shadow-sm border-t-4 flex flex-col items-center justify-center space-y-2
      ${
        highlight === "red"
          ? "border-red-500"
          : highlight === "green"
          ? "border-green-500"
          : "border-blue-500"
      }`}
    >
      <div className="bg-gray-100 rounded-full p-2">{icon}</div>
      <p className="text-sm text-gray-500 text-center">{title}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}
