"use client";

import { type Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./faceted-filter";

interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FilterConfig {
  columnId: string;
  title: string;
  options: FilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: FilterConfig[];
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Filtrar...",
  searchKey,
  filters,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!table.getState().globalFilter;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={
            searchKey
              ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
              : ((table.getState().globalFilter as string) ?? "")
          }
          onChange={(event) =>
            searchKey
              ? table.getColumn(searchKey)?.setFilterValue(event.target.value)
              : table.setGlobalFilter(event.target.value)
          }
          className="h-8 w-37.5 lg:w-62.5"
        />
        <div className="flex gap-x-2">
          {filters?.map((filter) => {
            const column = table.getColumn(filter.columnId);
            return column ? (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            ) : null;
          })}
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Restablecer
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
