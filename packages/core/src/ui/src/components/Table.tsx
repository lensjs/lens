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
    <div className="relative overflow-x-auto card-panel border-none shadow-none bg-transparent">
      <table className="w-full text-start border-separate border-spacing-y-2 px-1">
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                className={twMerge(
                  "min-w-32 bg-slate-900/50 p-4 text-xs font-bold uppercase tracking-wider text-slate-400 first:rounded-s-lg last:rounded-e-lg",
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
        <tbody className="before:block before:h-2">
          {!data.length && (
            <tr>
              <td
                colSpan={columns.length}
                className="p-10 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800"
              >
                No Entries Recorded Yet!
              </td>
            </tr>
          )}
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="group hover:scale-[1.002] transition-all duration-200"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={twMerge(
                    "p-4 first:rounded-s-xl last:rounded-e-xl bg-slate-900 border-y border-slate-800 first:border-l last:border-r shadow-sm transition-all group-hover:border-slate-700 group-hover:shadow-md",
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
                    <span className="text-slate-300 font-medium">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
