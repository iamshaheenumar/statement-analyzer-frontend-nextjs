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
  const getBorderColor = () => {
    if (highlight === "red") return "border-t-red-500";
    if (highlight === "green") return "border-t-green-500";
    return "border-t-blue-500";
  };

  const getIconBg = () => {
    if (highlight === "red") return "from-red-50 to-red-100";
    if (highlight === "green") return "from-green-50 to-green-100";
    return "from-blue-50 to-blue-100";
  };

  const getValueColor = () => {
    if (highlight === "red") return "text-red-600";
    if (highlight === "green") return "text-green-600";
    return "text-gray-900";
  };
  return (
    <div
      className={`group relative bg-white rounded-2xl p-6 shadow-md border-t-4 ${getBorderColor()} transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden`}
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={`inline-flex p-3.5 bg-gradient-to-br ${getIconBg()} rounded-2xl mb-4 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          {icon}
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {title}
        </p>

        {/* Value */}
        <p className={`text-3xl font-bold ${getValueColor()} tracking-tight`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>

      {/* Decorative corner accent */}
      <div
        className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 ${
          highlight === "red"
            ? "bg-red-500"
            : highlight === "green"
            ? "bg-green-500"
            : "bg-blue-500"
        } group-hover:scale-150 transition-transform duration-500`}
      ></div>
    </div>
  );
}
