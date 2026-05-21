// Wrap app once. Use the toast() helper anywhere: toast.success("Saved").
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast, type ToastData, type ToastVariant } from "./toast";

interface PushArgs {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastApi {
  push: (args: PushArgs) => string;
  dismiss: (id: string) => void;
  info: (title: ReactNode, description?: ReactNode) => string;
  success: (title: ReactNode, description?: ReactNode) => string;
  warn: (title: ReactNode, description?: ReactNode) => string;
  danger: (title: ReactNode, description?: ReactNode) => string;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let counter = 0;
const nextId = () => `t-${Date.now()}-${++counter}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ title, description, variant = "info", duration = 4000 }: PushArgs) => {
      const id = nextId();
      setToasts((t) => [...t, { id, title, description, variant, duration }]);
      if (duration > 0) {
        const handle = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const handle of map.values()) window.clearTimeout(handle);
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      dismiss,
      info: (title, description) =>
        push({ title, description, variant: "info" }),
      success: (title, description) =>
        push({ title, description, variant: "success" }),
      warn: (title, description) =>
        push({ title, description, variant: "warn" }),
      danger: (title, description) =>
        push({ title, description, variant: "danger" }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
