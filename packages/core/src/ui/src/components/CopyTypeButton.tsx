"use client";

import React, { useState, useCallback } from "react";
import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
} from "quicktype-core";
import { Check, ChevronDown, FileCode, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

const SUPPORTED_LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "dart", label: "Dart" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "flow", label: "Flow" },
  { value: "csharp", label: "C#" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
];

interface CopyTypeButtonProps {
  data: Record<string, unknown> | string | string[] | unknown;
}

const CopyTypeButton: React.FC<CopyTypeButtonProps> = ({ data }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedType, setGeneratedType] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [showSelect, setShowSelect] = useState(false);

  const generateType = useCallback(
    async (lang: string, jsonObject: unknown) => {
      setIsGenerating(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonInput = jsonInputForTargetLanguage(lang as any);

        // Add JSON samples to quicktype
        await jsonInput.addSource({
          name: "Response",
          samples: [JSON.stringify(jsonObject, null, 2)],
        });

        const inputData = new InputData();
        inputData.addInput(jsonInput);

        const result = await quicktype({
          inputData,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lang: lang as any,
          inferMaps: false,
          rendererOptions: {
            "just-types": true,
            "runtime-typecheck": false,
          },
        });

        setGeneratedType(result.lines.join("\n"));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Error generating type:", error);
        setGeneratedType(
          `// Error generating ${lang} type\n// ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    generateType(newLanguage, data);
  };

  const copyTypeToClipboard = async () => {
    if (!generatedType) return;

    try {
      await navigator.clipboard.writeText(generatedType);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  React.useEffect(() => {
    if (data) {
      generateType(selectedLanguage, data);
    }
  }, [data, selectedLanguage, generateType]);

  const getCopyIcon = () => {
    switch (copyStatus) {
      case "success":
        return <Check className="w-4 h-4" />;
      case "error":
        return <X className="w-4 h-4" />;
      default:
        return <FileCode className="w-4 h-4" />;
    }
  };

  // Get copy button class based on status
  const getCopyButtonClass = () => {
    const baseClass =
      "p-1.5 rounded-md transition-all duration-200 flex items-center justify-center min-w-[28px] h-7";
    switch (copyStatus) {
      case "success":
        return `${baseClass} bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`;
      case "error":
        return `${baseClass} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClass} bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:bg-slate-800 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-slate-700`;
    }
  };

  // Get the current language info
  const getCurrentLanguage = () => {
    return SUPPORTED_LANGUAGES.find((lang) => lang.value === selectedLanguage);
  };

  if (
    !data ||
    (typeof data === "object" && Object.keys(data).length === 0) ||
    (Array.isArray(data) && data.length === 0)
  ) {
    return <div />;
  }
  return (
    <div className="flex items-center gap-1">
      {/* Language Selector with icon only display */}
      <div
        className={twMerge(
          "relative group",
          showSelect
            ? ""
            : "opacity-0 hover:opacity-100 transition-opacity duration-300",
        )}
      >
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="appearance-none bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:bg-slate-800 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-slate-700 rounded-md px-2 pr-6 text-xs font-medium focus:outline-none transition-all duration-200 cursor-pointer min-w-[50px] h-7"
          disabled={isGenerating}
          title={getCurrentLanguage()?.label || "Select Language"}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
          <ChevronDown className="text-neutral-500 dark:text-neutral-400 size-3" />
        </div>
      </div>

      {/* Copy Button */}
      <div className="relative group">
        <button
          onClick={copyTypeToClipboard}
          onMouseEnter={() => {
            setShowSelect(true);
          }}
          onMouseLeave={() => {
            setShowSelect(false);
          }}
          disabled={isGenerating || !generatedType}
          className={getCopyButtonClass()}
          title={
            copyStatus === "success"
              ? "Copied!"
              : copyStatus === "error"
                ? "Copy failed"
                : "Copy Type Definition"
          }
        >
          <span className="text-xs">{getCopyIcon()}</span>
        </button>
      </div>
    </div>
  );
};

export default CopyTypeButton;
