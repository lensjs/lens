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
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>{" "}
        <p className="text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
              </div>
              <div className="flex-1">
                {typeof item.value === "string" ? (
                  <span className={`text-sm ${item.className || ""}`}>
                    {item.value}
                  </span>
                ) : (
                  item.value
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
