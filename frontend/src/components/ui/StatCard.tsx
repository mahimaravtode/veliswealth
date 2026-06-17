import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ 
  title, 
  value, 
  color = "text-foreground",
  icon: Icon,
  subtitle,
}: { 
  title: string; 
  value: string; 
  color?: string;
  icon?: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
        {Icon && (
          <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors duration-300">
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-black", color)}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
