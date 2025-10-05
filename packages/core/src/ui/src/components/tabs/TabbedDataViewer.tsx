"use client";

import React, { useState, Suspense } from "react";

export interface TabbedDataProps {
  tabs: TabItem[];
  title?: string;
  defaultActiveTab?: string;
}

export interface TabItem {
  id: string;
  label: string;
  data?: Record<string, any> | string | string[];
  content?: React.ReactNode;
  shouldShow?: boolean;
}

// Lazy load JsonViewer
const JsonViewer = React.lazy(() => import("../JsonViewer"));

const TabbedDataViewer: React.FC<TabbedDataProps> = ({
  tabs,
  title,
  defaultActiveTab,
}) => {
  const visibleTabs = tabs.filter(
    (tab) => tab.shouldShow === undefined || tab.shouldShow
  );

  const [activeTab, setActiveTab] = useState<string>(
    defaultActiveTab || visibleTabs[0]?.id || ""
  );

  if (!visibleTabs.length) {
    return null;
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-[15px] shadow-sm">
      {/* Header */}
      {title && (
        <div className="px-6 py-4 rounded-t-[15px] border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b rounded-[15px] border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {visibleTabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? "block" : "hidden"}
          >
            {tab.content ? (
              <div>{tab.content}</div>
            ) : (
              tab.data && (
                <Suspense fallback={<div>Loading viewer…</div>}>
                  <JsonViewer data={tab.data} />
                </Suspense>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabbedDataViewer;
