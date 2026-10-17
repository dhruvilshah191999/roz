/** Big number over a small label, used in rows of three on the Me page. */
export function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="p-3 rounded-xl bg-ground text-center">
      <div className="display text-[22px]">{value}</div>
      <div className="text-xs text-muted font-semibold">{label}</div>
    </div>
  );
}
