import React, { useState, Suspense } from "react";
import { cn } from "../../utils/cn";

export interface TabbedDataProps {
  tabs: TabItem[];
  title?: string;
  defaultActiveTab?: string;
}

export interface TabItem {
  id: string;
  label: string;
  data?: Record<string, unknown> | string | string[];
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
    (tab) => tab.shouldShow === undefined || tab.shouldShow,
  );

  const [activeTab, setActiveTab] = useState<string>(
    defaultActiveTab || visibleTabs[0]?.id || "",
  );

  if (!visibleTabs.length) {
    return null;
  }

  return (
    <div className="card-panel overflow-hidden">
      {/* Header */}
      {title && (
        <div className="border-b border-border bg-surface-2/40 px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {title}
          </h2>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border px-3">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
              className={cn(
                "relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-accent"
                  : "text-muted hover:text-fg",
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-5">
        {visibleTabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? "block" : "hidden"}
          >
            {tab.content ? (
              <div className="text-fg">{tab.content}</div>
            ) : (
              tab.data && (
                <Suspense
                  fallback={
                    <div className="text-sm text-dim">Loading viewer…</div>
                  }
                >
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
