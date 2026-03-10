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
    <div className="card-panel overflow-hidden bg-slate-900 border-slate-800">
      {/* Header */}
      {title && (
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-lg font-semibold text-slate-100">
            {title}
          </h2>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800 bg-slate-900">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
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
            className={activeTab === tab.id ? "block animate-in fade-in duration-300" : "hidden"}
          >
            {tab.content ? (
              <div className="text-slate-300">{tab.content}</div>
            ) : (
              tab.data && (
                <Suspense fallback={<div className="text-slate-500 text-sm">Loading viewer…</div>}>
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
