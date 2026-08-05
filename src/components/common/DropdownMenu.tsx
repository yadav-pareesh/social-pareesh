import { MoreVertical } from 'lucide-react';
import { type ReactNode, useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  trigger?: ReactNode;
  align?: 'right' | 'left';
  children: ReactNode;
}

export const DropdownMenu = ({ trigger, children, align }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(!open)} className='cursor-pointer'>
        {trigger ? trigger :<div className="ali"><MoreVertical className="h-5 w-5" /></div> }
      </button>
      {open && (
        <div
          role="menu"
          tabIndex={0}
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-48 bg-popover border rounded-lg shadow-lg z-1200`}
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownMenuContentProps {
  children: ReactNode;
}

export const DropdownMenuContent = ({ children }: DropdownMenuContentProps) => {
  return <div>{children}</div>;
};

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
}

export const DropdownMenuItem = ({ children, onClick }: DropdownMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 text-left hover:bg-accent border-b last:border-b-0 text-sm"
    >
      {children}
    </button>
  );
};

interface DropdownMenuTriggerProps {
  children: ReactNode;
}

export const DropdownMenuTrigger = ({ children }: DropdownMenuTriggerProps) => {
  return <>{children}</>;
};