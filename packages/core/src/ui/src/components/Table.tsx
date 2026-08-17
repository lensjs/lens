import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import NoData from "./table/NoData";

type Position = "start" | "end";

export function getNestedValue<T>(obj: T, path: string): unknown {
  if (!path.trim()) return obj;

  return path.split(".").reduce<unknown>((acc, key) => {
    if (typeof acc === "object" && acc !== null && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

type BaseColumn<T> = {
  name: string;
  position?: Position;
  class?: string;
  prefix?: (row: T) => ReactNode;
  suffix?: (row: T) => ReactNode;
  headPrefix?: () => ReactNode;
  icon?: (row: T) => ReactNode;
  hidden?: boolean;
};

export type TableColumn<T> =
  | (BaseColumn<T> & {
      key: string;
      render?: undefined;
      value?: undefined;
    })
  | (BaseColumn<T> & {
      render: (row: T) => ReactNode;
      key?: undefined;
      value?: undefined;
    })
  | (BaseColumn<T> & {
      key?: undefined;
      render?: undefined;
      value: (row: T) => string | number;
    });

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  isRowSelected?: (row: T) => boolean;
}

function Table<T>({
  columns: columnsProp,
  data,
  emptyMessage,
  onRowClick,
  isRowSelected,
}: TableProps<T>) {
  const columns = columnsProp.filter((column) => !column.hidden);

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-start">
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  "min-w-32 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dim",
                  column.position === "end" && "text-end",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    column.position === "end"
                      ? "justify-end"
                      : "justify-start",
                  )}
                >
                  {column.headPrefix && column.headPrefix()}
                  {column.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!data.length && (
            <tr>
              <td colSpan={columns.length} className="px-0 pt-2">
                <div className="card-panel">
                  <NoData message={emptyMessage} />
                </div>
              </td>
            </tr>
          )}
          {data.map((row, rowIndex) => {
            const selected = isRowSelected?.(row) ?? false;
            return (
            <tr
              key={rowIndex}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              aria-selected={selected || undefined}
              className={cn(
                "group transition-colors",
                onRowClick && "cursor-pointer",
                selected ? "bg-accent/10" : "hover:bg-surface-2/40",
              )}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    "border-b border-border px-4 py-3 align-middle transition-colors",
                    column.position === "end" ? "text-end" : "text-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      colIndex < columns.length - 1 &&
                        column.position !== "end" &&
                        "pe-8",
                      column.class,
                      column.position === "end"
                        ? "justify-end"
                        : "justify-start",
                    )}
                  >
                    {column.icon && column.icon(row)}
                    {column.prefix && column.prefix(row)}
                    <span className="font-medium text-fg">
                      {column.render
                        ? column.render(row)
                        : column.key
                          ? String(getNestedValue(row, column.key) ?? "-")
                          : column.value
                            ? column.value(row)
                            : "-"}
                    </span>
                    {column.suffix && column.suffix(row)}
                  </div>
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
