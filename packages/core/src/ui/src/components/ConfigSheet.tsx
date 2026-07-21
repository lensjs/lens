import type React from "react";
import { useState, useEffect } from "react";
import { X, Settings, Check } from "lucide-react";
import type { LanguageTypeOption } from "../types";

interface ConfigSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigSheet: React.FC<ConfigSheetProps> = ({ isOpen, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageTypeOption>("ts");

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lens-copy-language");
    if (saved === "ts" || saved === "dart") {
      setSelectedLanguage(saved);
    }
  }, []);

  // Save preference to localStorage
  const handleLanguageChange = (language: LanguageTypeOption) => {
    setSelectedLanguage(language);
    localStorage.setItem("lens-copy-language", language);
    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("lens-language-change", {
        detail: { language },
      })
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-canvas/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Sheet */}
      <div
        className={`fixed top-0 start-0 h-full w-80 bg-surface border-l border-border shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Settings
                  size={20}
                  className="text-accent"
                />
              </div>
              <h2 className="text-lg font-semibold text-fg">
                Configuration
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
              aria-label="Close configuration"
            >
              <X size={20} className="text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-fg mb-2">
                  Copy Type Language
                </h3>
                <p className="text-sm text-muted mb-4">
                  Choose the default language format for copying data types from
                  JSON viewer.
                </p>
              </div>

              <div className="space-y-3">
                {/* TypeScript Option */}
                <button
                  onClick={() => handleLanguageChange("ts")}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedLanguage === "ts"
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded">
                        <span className="text-sm font-mono font-bold text-accent">
                          TS
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-fg">
                          TypeScript
                        </div>
                        <div className="text-sm text-muted">
                          JavaScript/TypeScript format
                        </div>
                      </div>
                    </div>
                    {selectedLanguage === "ts" && (
                      <Check
                        size={20}
                        className="text-accent"
                      />
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-surface-2 rounded text-left">
                    <code className="text-xs text-fg">
                      {`{\n  "name": string,\n  "age": number\n}`}
                    </code>
                  </div>
                </button>

                {/* Dart Option */}
                <button
                  onClick={() => handleLanguageChange("dart")}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedLanguage === "dart"
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded">
                        <span className="text-sm font-mono font-bold text-accent">
                          Dart
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-fg">
                          Dart
                        </div>
                        <div className="text-sm text-muted">
                          Dart/Flutter format
                        </div>
                      </div>
                    </div>
                    {selectedLanguage === "dart" && (
                      <Check
                        size={20}
                        className="text-accent"
                      />
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-surface-2 rounded text-left">
                    <code className="text-xs text-fg">
                      {`{\n  "name": String,\n  "age": int\n}`}
                    </code>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfigSheet;
