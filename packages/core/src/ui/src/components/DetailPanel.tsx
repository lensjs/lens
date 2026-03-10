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
  if (!items || items.length === 0 || items.every((item) => !item.value)) {
    return (
      <div className="card-panel p-6 bg-slate-900 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          {title}
        </h2>
        <p className="text-center text-slate-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="card-panel overflow-hidden bg-slate-900 border-slate-800">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50">
        <h2 className="text-lg font-semibold text-slate-100">
          {title}
        </h2>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-start gap-2"
            >
              <div className="w-full sm:w-32 flex-shrink-0">
                <span className="text-sm font-medium text-slate-500">
                  {item.label}
                </span>
              </div>
              <div className="flex-1">
                {typeof item.value === "string" ? (
                  <span className={`text-sm text-slate-300 ${item.className || ""}`}>
                    {item.value}
                  </span>
                ) : (
                  <div className="text-slate-300">{item.value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
