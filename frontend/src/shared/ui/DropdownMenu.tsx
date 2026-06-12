import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';

import { cn } from '../lib/cn';

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu');
  }
  return context;
}

type DropdownMenuProps = {
  children: ReactNode;
};

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <DropdownMenuContext value={{ open, setOpen, menuId, triggerRef }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext>
  );
}

type DropdownMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function DropdownMenuTrigger({
  children,
  className,
  onClick,
  ...props
}: DropdownMenuTriggerProps) {
  const { open, setOpen, menuId, triggerRef } = useDropdownMenuContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      className={className}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={(event) => {
        setOpen(!open);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

type DropdownMenuContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  align?: 'start' | 'end';
};

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, menuId, triggerRef } = useDropdownMenuContext();
  const contentRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen, triggerRef]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      id={menuId}
      role="menu"
      className={cn(
        'absolute top-[calc(100%+0.375rem)] z-[120] min-w-[11rem] overflow-hidden rounded-xl border border-soft bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.1)]',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type DropdownMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function DropdownMenuItem({
  children,
  className,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext();

  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'block w-full px-3.5 py-2.5 text-left text-sm font-semibold text-text-primary transition-[background,color] duration-150 hover:bg-purple-50 hover:text-purple-700',
        className,
      )}
      onClick={(event) => {
        setOpen(false);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
