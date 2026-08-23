export const Switch = ({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  // 1. Update the type signature to provide the new state
  onCheckedChange: (checked: boolean) => void; 
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-label={ariaLabel}
    aria-checked={checked}
    disabled={disabled}
    // 2. Pass the inverted boolean to the parent function when clicked
    onClick={() => onCheckedChange(!checked)} 
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? 'bg-primary' : 'bg-muted'
    }`}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);