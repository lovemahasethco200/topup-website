type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  const normalized = (status || "").toLowerCase();

  let classes =
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";

  if (normalized === "completed") {
    classes =
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (normalized === "processing") {
    classes =
      "border-amber-500/30 bg-amber-500/10 text-amber-300";
  } else if (normalized === "cancelled") {
    classes =
      "border-rose-500/30 bg-rose-500/10 text-rose-300";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {status || "Pending"}
    </span>
  );
}