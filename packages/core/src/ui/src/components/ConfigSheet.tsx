"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { X, Settings, Check } from "lucide-react";

interface ConfigSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigSheet: React.FC<ConfigSheetProps> = ({ isOpen, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<"ts" | "dart">("ts");

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lens-copy-language");
    if (saved === "ts" || saved === "dart") {
      setSelectedLanguage(saved);
    }
  }, []);

  // Save preference to localStorage
  const handleLanguageChange = (language: "ts" | "dart") => {
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Sheet */}
      <div
        className={`fixed top-0 start-0 h-full w-80 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Settings
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Configuration
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label="Close configuration"
            >
              <X size={20} className="text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Copy Type Language
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                        <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                          TS
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          TypeScript
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          JavaScript/TypeScript format
                        </div>
                      </div>
                    </div>
                    {selectedLanguage === "ts" && (
                      <Check
                        size={20}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-left">
                    <code className="text-xs text-neutral-700 dark:text-neutral-300">
                      {`{\n  "name": string,\n  "age": number\n}`}
                    </code>
                  </div>
                </button>

                {/* Dart Option */}
                <button
                  onClick={() => handleLanguageChange("dart")}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedLanguage === "dart"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded">
                        <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          Dart
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          Dart
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Dart/Flutter format
                        </div>
                      </div>
                    </div>
                    {selectedLanguage === "dart" && (
                      <Check
                        size={20}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-left">
                    <code className="text-xs text-neutral-700 dark:text-neutral-300">
                      {`{\n  "name": String,\n  "age": int\n}`}
                    </code>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
