"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface CopyTypeButtonProps {
  data: Record<string, unknown> | string | string[] | unknown;
}

const CopyTypeButton: React.FC<CopyTypeButtonProps> = ({ data }) => {
  const [typeCopied, setTypeCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"ts" | "dart">("ts");

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lens-copy-language");
    if (saved === "ts" || saved === "dart") {
      setSelectedLanguage(saved);
    }
  }, []);

  const getDataType = (
    value: Record<string, unknown> | string | string[] | unknown,
    language: "ts" | "dart" = "ts"
  ): string => {
    if (value === null) return "null";
    if (value === undefined) return language === "dart" ? "null" : "undefined";
    if (Array.isArray(value)) {
      // For arrays, show the type of elements
      if (value.length === 0)
        return language === "dart" ? "List<dynamic>" : "[]";
      const elementTypes = [
        ...new Set(value.map((item) => getDataType(item, language))),
      ];
      if (elementTypes.length === 1) {
        if (language === "dart") {
          return `List<${elementTypes[0]}>`;
        }
        return `${elementTypes[0]}[]`;
      }
      if (language === "dart") {
        return `List<dynamic>`;
      }
      return `(${elementTypes.join(" | ")})[]`;
    }
    if (typeof value === "object" && value !== null) {
      // For objects, create a type structure
      const typeStructure: Record<string, string> = {};
      for (const [key, val] of Object.entries(value)) {
        typeStructure[key] = getDataType(val, language);
      }
      // Convert to string and remove quotes from type values
      const jsonString = JSON.stringify(typeStructure, null, 2);

      if (language === "dart") {
        return jsonString.replace(
          /"(String|int|double|bool|null|List<[^>]+>|Map<[^>]+>)"/g,
          "$1"
        );
      }

      return jsonString.replace(
        /"(string|number|boolean|null|undefined|bigint|symbol)"/g,
        "$1"
      );
    }

    // Convert primitive types
    if (language === "dart") {
      switch (typeof value) {
        case "string":
          return "String";
        case "number":
          return Number.isInteger(value as number) ? "int" : "double";
        case "boolean":
          return "bool";
        default:
          return typeof value;
      }
    }

    return typeof value;
  };

  const copyDataType = async () => {
    try {
      const dataType = getDataType(data, selectedLanguage);
      await navigator.clipboard.writeText(dataType);
      setTypeCopied(true);
      setTimeout(() => setTypeCopied(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy data type: ", err);
    }
  };

  return (
    <button
      onClick={copyDataType}
      className={`px-3 py-2 rounded-md transition-colors ${
        typeCopied
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:bg-slate-800 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-slate-700"
      }`}
      title={
        typeCopied
          ? "Type copied!"
          : `Copy data type (${selectedLanguage.toUpperCase()})`
      }
    >
      {typeCopied ? <Check size={15} /> : selectedLanguage.toUpperCase()}
    </button>
  );
};

export default CopyTypeButton;
