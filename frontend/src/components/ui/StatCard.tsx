import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatCard({ title, value, color = "text-foreground" }: any) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
