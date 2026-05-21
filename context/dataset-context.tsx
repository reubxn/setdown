"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { WorkoutDataset } from "@/lib/types";
import { loadDataset, saveDataset, clearDataset } from "@/lib/storage";

interface DatasetContextValue {
  dataset: WorkoutDataset | null;
  loading: boolean;
  setDataset: (d: WorkoutDataset) => Promise<void>;
  clearData: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDatasetState] = useState<WorkoutDataset | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadDataset();
    setDatasetState(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setDataset = useCallback(async (d: WorkoutDataset) => {
    await saveDataset(d);
    setDatasetState(d);
  }, []);

  const clearData = useCallback(async () => {
    await clearDataset();
    setDatasetState(null);
  }, []);

  return (
    <DatasetContext.Provider
      value={{ dataset, loading, setDataset, clearData, refresh }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used within DatasetProvider");
  return ctx;
}
