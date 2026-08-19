import * as React from 'react';
import { Search, X } from 'lucide-react';

export interface ChatSearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'title'> {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onOpen: () => void;
  title?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export const ChatSearchBar = React.memo(function ChatSearchBar({
  value,
  onChangeText,
  onClear,
  isOpen,
  onOpen,
  title,
  placeholder = 'Search users...',
  className = '',
  ...props
}: ChatSearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClear();
    }
  };

  if (!isOpen) {
    return (
      <div className={`flex items-center justify-between gap-3 w-full ${className}`}>
        {/* Custom title / header message when collapsed */}
        <div className="flex-1 min-w-0">
          {typeof title === 'string' ? (
            <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
          ) : (
            title
          )}
        </div>

        {/* Trigger Button */}
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Search Icon */}
      <Search
        aria-hidden="true"
        className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none transition-colors"
      />

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search input"
        className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
        {...props}
      />

      {/* Clear / Close Button */}
      <button
        type="button"
        onClick={onClear}
        aria-label="Close search"
        className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});