import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  // Prevent background scrolling and handle 'Escape' key
  useEffect(() => {
    if (open) {
      const originalOverflow = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onOpenChange(false);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with blur to mask background UI bleed */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      
      {/* Dialog Panel */}
      <div className="relative bg-background rounded-xl shadow-2xl border border-border/60 max-w-md w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export const DialogContent = ({ children, className }: DialogContentProps) => {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
};

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DialogHeader = ({ children, className }: DialogHeaderProps) => {
  return (
    <div className={cn('flex flex-col space-y-2 mb-4', className)}>
      {children}
    </div>
  );
};

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export const DialogTitle = ({ children, className }: DialogTitleProps) => {
  return (
    <h2 className={cn('text-lg font-semibold tracking-tight text-foreground', className)}>
      {children}
    </h2>
  );
};

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export const DialogFooter = ({ children, className }: DialogFooterProps) => {
  return (
    <div className={cn('flex items-center justify-end gap-2 mt-6', className)}>
      {children}
    </div>
  );
};