import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useState } from "react";

export default function DataTable({ data, columns, onRowClick }) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="card-static p-8 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data to display</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--surface-600)" }}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr style={{ background: "var(--surface-700)", borderBottom: "1px solid var(--surface-600)" }}>
            {table.getHeaderGroups().map((hg) =>
              hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-4 py-2.5 cursor-pointer select-none text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                  onClick={h.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    <span style={{ color: "var(--thunder-gold)", opacity: h.column.getIsSorted() ? 1 : 0 }}>
                      {h.column.getIsSorted() === "asc" ? "↑" : h.column.getIsSorted() === "desc" ? "↓" : ""}
                    </span>
                  </span>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                background: i % 2 === 0 ? "var(--surface-800)" : "var(--surface-700)",
                borderBottom: "1px solid var(--surface-600)",
                transition: "var(--transition-fast)",
                cursor: onRowClick ? "pointer" : undefined,
              }}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-600)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--surface-800)" : "var(--surface-700)")}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
