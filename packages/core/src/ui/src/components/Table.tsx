import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

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
}

function Table<T>({ columns: columnsProp, data }: TableProps<T>) {
  const columns = columnsProp.filter((column) => !column.hidden);

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-start">
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                className={twMerge(
                  "min-w-32 bg-gray-50  dark:bg-neutral-900 p-5 text-sm font-semibold text-gray-900 dark:text-neutral-200 first:rounded-s-lg last:rounded-e-lg",
                  column.position === "end" ? "text-end" : "",
                )}
              >
                <div
                  className={twMerge(
                    "flex items-center gap-2",
                    column.position === "end" ? "justify-end" : "justify-start",
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
              <td colSpan={columns.length} className="p-5 text-center text-neutral-400">
                    No Entries Recorded Yet!
              </td>
            </tr>
          )}
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="max-h-none overflow-hidden rounded-lg text-sm font-medium text-gray-800 dark:text-neutral-400 even:[&_td]:bg-gray-25 dark:even:[&_td]:bg-neutral-950 transition-colors"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={twMerge(
                    "p-5 first:rounded-s-lg last:rounded-e-lg bg-white dark:bg-transparent",
                    column.position === "end" ? "text-end" : "text-start",
                  )}
                >
                  <div
                    className={twMerge(
                      "flex items-center gap-1",
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
                    {column.render
                      ? column.render(row)
                      : column.key
                        ? String(getNestedValue(row, column.key) ?? "-")
                        : column.value
                          ? column.value(row)
                          : "-"}
                    {column.suffix && column.suffix(row)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
