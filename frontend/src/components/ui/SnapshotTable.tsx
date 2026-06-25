import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowUpDown } from "lucide-react"

export default function SnapshotTable({ data, onRowClick }: any) {
  const [sorting, setSorting] = React.useState<any>([])

  const table = useReactTable({
    data,
    columns: [
        { accessorKey: "symbol", header: "SYMBOL", cell: (info: any) => <div className="font-bold">{info.getValue()?.split('.')[0] || 'N/A'}</div> },
        { accessorKey: "lastPrice", header: "LTP", cell: (info: any) => `₹${(info.getValue() || 0).toLocaleString()}` },
        { accessorKey: "change", header: "CHNG", cell: (info: any) => {
            const val = info.getValue() || 0;
            return <div className={val >= 0 ? 'text-success' : 'text-destructive'}>{val}</div>
        }},
        { accessorKey: "changePercent", header: "%CHNG", cell: (info: any) => {
            const val = info.getValue() || 0;
            return <div className={val >= 0 ? 'text-success' : 'text-destructive'}>{val}%</div>
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
      <Input placeholder="Filter stocks..." value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("symbol")?.setFilterValue(event.target.value)} className="max-w-sm" />
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer font-bold text-foreground">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-accent transition-colors cursor-pointer" onClick={() => onRowClick(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-right first:text-left font-medium">
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
