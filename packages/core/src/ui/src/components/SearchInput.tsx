"use client";

import type React from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  showResultCount?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  resultCount,
  showResultCount = false,
}) => {
  return (
    <div className="mb-4 flex flex-col items-end">
      <div className="relative w-full sm:w-[40%] lg:w-[30%]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all duration-200 shadow-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-full p-1 transition-all duration-200"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {value && showResultCount && resultCount !== undefined && (
        <p className="mt-2 text-xs text-slate-500">
          Found {resultCount} result{resultCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default SearchInput;
