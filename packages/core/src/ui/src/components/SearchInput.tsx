import type React from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  inputRef,
}) => {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface/70 py-2 pl-10 pr-10 text-sm text-fg shadow-sm transition-colors placeholder:text-dim hover:border-border-strong focus:border-accent/60 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-dim transition-colors hover:bg-surface-2 hover:text-fg"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
