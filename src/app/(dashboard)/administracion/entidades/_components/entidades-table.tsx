"use client";

import { type CSSProperties, useState } from "react";
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination, DataTableToolbar } from "@/components/data-table";
import type { Entidad } from "./entidades-schema";
import { entidadesColumns } from "./entidades-columns";

interface EntidadesTableProps {
  entidades: Entidad[];
}

export function EntidadesTable({ entidades }: EntidadesTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: entidades,
    columns: entidadesColumns,
    state: { sorting, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      className={cn(
        "max-sm:has-[div[role='toolbar']]:mb-16",
        "flex flex-1 flex-col gap-4"
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder="Buscar por nombre o código..."
        filters={[
          {
            columnId: "is_active",
            title: "Estado",
            options: [
              { label: "Activa", value: "true" },
              { label: "Inactiva", value: "false" },
            ],
          },
        ]}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "bg-background group-hover/row:bg-muted",
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="group/row"
                  style={{ "--row-index": index } as CSSProperties}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "bg-background group-hover/row:bg-muted",
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={entidadesColumns.length}
                  className="h-24 text-center"
                >
                  No hay sedes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
    </div>
  );
}
