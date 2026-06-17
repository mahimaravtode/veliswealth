export default function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="p-4 bg-muted/50 rounded-2xl border border-border/30 hover:border-primary/20 transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-black text-foreground">{value}</p>
    </div>
  );
}
