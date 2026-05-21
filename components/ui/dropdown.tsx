// <Dropdown trigger={<Button>Menu</Button>}><DropdownItem onSelect={..}>Item</DropdownItem></Dropdown>
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
  cloneElement,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "./utils";

const DropdownCloseContext = createContext<() => void>(() => {});

export interface DropdownProps {
  trigger: ReactElement<HTMLAttributes<HTMLElement>>;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "start",
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const first = menuRef.current?.querySelector<HTMLElement>(
        "[role='menuitem']:not([aria-disabled='true'])",
      );
      first?.focus();
    }
  }, [open]);

  const originalOnClick = trigger.props.onClick;
  const triggerEl = cloneElement(trigger, {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": id,
    onClick: (e: ReactMouseEvent<HTMLElement>) => {
      originalOnClick?.(e);
      setOpen((v) => !v);
    },
  } as HTMLAttributes<HTMLElement>);

  const handleMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        "[role='menuitem']:not([aria-disabled='true'])",
      ) ?? [],
    );
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const close = useCallback(() => setOpen(false), []);

  return (
    <div ref={rootRef} className="relative inline-block">
      {triggerEl}
      {open ? (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          onKeyDown={handleMenuKey}
          className={cn(
            "absolute z-50 mt-2 min-w-[180px] rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-elevated)] py-1",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          <DropdownCloseContext.Provider value={close}>
            {children}
          </DropdownCloseContext.Provider>
        </div>
      ) : null}
    </div>
  );
}

export interface DropdownItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  onSelect?: () => void;
  variant?: "default" | "danger";
}

export function DropdownItem({
  className,
  onSelect,
  onClick,
  variant = "default",
  children,
  ...rest
}: DropdownItemProps) {
  const close = useContext(DropdownCloseContext);
  const handle = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onSelect?.();
      close();
    },
    [onClick, onSelect, close],
  );
  return (
    <button
      role="menuitem"
      type="button"
      onClick={handle}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left outline-none transition-colors",
        variant === "danger"
          ? "text-[var(--danger)] hover:bg-[var(--danger)]/10 focus:bg-[var(--danger)]/10"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)] focus:bg-[var(--bg-sunken)] focus:text-[var(--text-primary)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return (
    <div role="separator" className="my-1 h-px bg-[var(--border-subtle)]" />
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      {children}
    </div>
  );
}
