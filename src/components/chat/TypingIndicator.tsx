export const TypingIndicator = () => {
  return (
    <div className="flex items-end gap-2">
      <div className="bg-muted text-muted-foreground rounded-2xl px-4 py-2 max-w-xs">
        <div className="flex items-center gap-1.5 h-4">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-100" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-200" />
        </div>
      </div>
    </div>
  );
};