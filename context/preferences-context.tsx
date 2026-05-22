"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "setdown-preferences-v1";

export type Units = "kg" | "lb";
export type WeekStart = "mon" | "sun";

export interface Preferences {
  units: Units;
  weekStart: WeekStart;
  explicitlySet: boolean;
}

const DEFAULTS: Preferences = {
  units: "kg",
  weekStart: "mon",
  explicitlySet: false,
};

function load(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

interface PreferencesContextValue {
  prefs: Preferences;
  hydrated: boolean;
  setUnits: (u: Units) => void;
  setWeekStart: (w: WeekStart) => void;
  weekStartsOn: 0 | 1;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  const setUnits = useCallback((units: Units) => {
    setPrefs((p) => ({ ...p, units, explicitlySet: true }));
  }, []);

  const setWeekStart = useCallback((weekStart: WeekStart) => {
    setPrefs((p) => ({ ...p, weekStart }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      hydrated,
      setUnits,
      setWeekStart,
      weekStartsOn: prefs.weekStart === "sun" ? 0 : 1,
    }),
    [prefs, hydrated, setUnits, setWeekStart],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
