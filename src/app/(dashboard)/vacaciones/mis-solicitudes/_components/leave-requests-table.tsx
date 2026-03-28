"use client";

import * as React from "react";
import {
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table";
import { cn } from "@/lib/utils";
import type { LeaveRequestWithDetails } from "@/lib/queries/leave-requests";
import { leaveRequestsColumns } from "./leave-requests-columns";

interface LeaveRequestsTableProps {
  data: LeaveRequestWithDetails[];
  isLoading: boolean;
}

export function LeaveRequestsTable({
  data,
  isLoading,
}: LeaveRequestsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "startDate", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: leaveRequestsColumns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 flex-col gap-4")}>
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
                      "bg-background",
                      header.column.columnDef.meta?.className
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group/row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "bg-background group-hover/row:bg-muted",
                        cell.column.columnDef.meta?.className
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
                  colSpan={leaveRequestsColumns.length}
                  className="h-24 text-center"
                >
                  No tienes solicitudes registradas.
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
