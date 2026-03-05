"use client";

import { useState } from "react";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
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
import { type DirectorioUser } from "./directorio-schema";
import { directorioColumns as columns } from "./directorio-columns";

const SEDES = [
  { label: "Madrid", value: "Madrid" },
  { label: "Barcelona", value: "Barcelona" },
  { label: "Valencia", value: "Valencia" },
  { label: "Bilbao", value: "Bilbao" },
  { label: "Sevilla", value: "Sevilla" },
];

const PUESTOS = [
  { label: "Administrativa", value: "Administrativa" },
  { label: "Analista de Datos", value: "Analista de Datos" },
  { label: "Arquitecto de Software", value: "Arquitecto de Software" },
  { label: "Contable Senior", value: "Contable Senior" },
  { label: "Coordinadora de Proyectos", value: "Coordinadora de Proyectos" },
  { label: "Desarrollador Senior", value: "Desarrollador Senior" },
  { label: "Directora de Marketing", value: "Directora de Marketing" },
  { label: "Directora de Operaciones", value: "Directora de Operaciones" },
  { label: "Diseñadora UX/UI", value: "Diseñadora UX/UI" },
  { label: "Jefa de Recursos Humanos", value: "Jefa de Recursos Humanos" },
  { label: "Responsable Comercial", value: "Responsable Comercial" },
  { label: "Responsable de Sede", value: "Responsable de Sede" },
  { label: "Responsable de TI", value: "Responsable de TI" },
  { label: "Técnica de Soporte", value: "Técnica de Soporte" },
  { label: "Técnico de Infraestructura", value: "Técnico de Infraestructura" },
];

type DirectorioTableProps = {
  data: DirectorioUser[];
};

export function DirectorioTable({ data }: DirectorioTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnFilters,
    },
    enableRowSelection: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <DataTableToolbar
        table={table}
        searchPlaceholder="Buscar por nombre..."
        searchKey="nombre"
        filters={[
          { columnId: "ubicacion", title: "Sede", options: SEDES },
          { columnId: "puesto", title: "Puesto", options: PUESTOS },
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
                      "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se han encontrado resultados.
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
