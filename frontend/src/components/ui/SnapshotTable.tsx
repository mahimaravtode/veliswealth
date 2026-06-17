import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, Search } from "lucide-react"

export default function SnapshotTable({ data, onRowClick }: any) {
  const [sorting, setSorting] = React.useState<any>([])

  const table = useReactTable({
    data,
    columns: [
        { accessorKey: "symbol", header: "SYMBOL", cell: (info: any) => <div className="font-bold">{info.getValue()?.split('.')[0] || 'N/A'}</div> },
        { accessorKey: "lastPrice", header: "LTP", cell: (info: any) => `₹${(info.getValue() || 0).toLocaleString()}` },
        { accessorKey: "change", header: "CHNG", cell: (info: any) => {
            const val = info.getValue() || 0;
            return <div className={val >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>{val}</div>
        }},
        { accessorKey: "changePercent", header: "%CHNG", cell: (info: any) => {
            const val = info.getValue() || 0;
            return <div className={val >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>{val}%</div>
        }},
        { accessorKey: "volume", header: "VOLUME (Lakhs)", cell: (info: any) => ((info.getValue() || 0) / 100000).toFixed(2) },
        { accessorKey: "marketCap", header: "VALUE (Cr)", cell: (info: any) => `₹${(((info.getValue() || 0) * (info.row.original.lastPrice || 0)) / 10000000).toFixed(2)}` },
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter stocks..." 
          value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""} 
          onChange={(event) => table.getColumn("symbol")?.setFilterValue(event.target.value)} 
          className="pl-9"
        />
      </div>
      <div className="rounded-3xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/30 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    onClick={header.column.getToggleSortingHandler()} 
                    className="cursor-pointer font-bold text-foreground text-xs uppercase tracking-wider hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" 
                onClick={() => onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-right first:text-left font-medium py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
