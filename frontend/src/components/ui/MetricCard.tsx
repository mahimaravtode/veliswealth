export default function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted rounded-lg border border-border">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-foreground">{value}</p>
    </div>
  );
}
