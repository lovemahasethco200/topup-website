type Props = {
  label: string;
  value: string;
};

export default function InfoBox({ label, value }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>

      <p className="mt-1 break-all text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}