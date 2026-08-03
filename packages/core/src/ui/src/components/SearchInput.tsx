import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Debounce (ms) before `onChange` fires — keeps server search off every keystroke. */
  debounceMs?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  inputRef,
  debounceMs = 300,
}) => {
  // Local text stays responsive while `onChange` (which drives a server fetch)
  // is debounced. Re-sync when the controlling value changes externally.
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setText(value), [value]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const emit = (next: string) => {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), debounceMs);
  };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    setText("");
    onChange("");
  };

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface/70 py-2 pl-10 pr-10 text-sm text-fg shadow-sm transition-colors placeholder:text-dim hover:border-border-strong focus:border-accent/60 focus:outline-none"
        value={text}
        onChange={(e) => emit(e.target.value)}
      />
      {text && (
        <button
          onClick={clear}
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
