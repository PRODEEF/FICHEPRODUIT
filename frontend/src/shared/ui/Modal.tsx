import { useEffect, type ReactNode } from 'react';

import { cn } from '../lib/cn';

type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  panelClassName?: string;
};

export function Modal({
  open,
  title,
  children,
  onClose,
  className,
  panelClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/45 p-6 backdrop-blur',
        className,
      )}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-[28rem] rounded-2xl border border-soft bg-bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
          panelClassName,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
