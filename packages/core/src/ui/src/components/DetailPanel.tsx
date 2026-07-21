import React from "react";

export type DetailItem = {
  label: string;
  value: string | React.ReactNode;
  className?: string;
};

interface DetailPanelProps {
  title: string;
  items: DetailItem[];
  emptyMessage?: string;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  title,
  items,
  emptyMessage = "No data available",
}) => {
  const isEmpty =
    !items || items.length === 0 || items.every((item) => !item.value);

  return (
    <div className="card-panel overflow-hidden">
      <div className="border-b border-border bg-surface-2/40 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h2>
      </div>

      {isEmpty ? (
        <p className="px-5 py-8 text-center text-sm text-dim">{emptyMessage}</p>
      ) : (
        <dl className="divide-y divide-border">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-1 px-5 py-2.5 sm:flex-row sm:items-start sm:gap-4"
            >
              <dt className="w-full flex-shrink-0 text-xs font-medium uppercase tracking-wide text-dim sm:w-36 sm:pt-0.5">
                {item.label}
              </dt>
              <dd className="min-w-0 flex-1">
                {typeof item.value === "string" ? (
                  <span className={`text-sm text-fg ${item.className || ""}`}>
                    {item.value}
                  </span>
                ) : (
                  <div className="text-fg">{item.value}</div>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default DetailPanel;
