import React from "react";
import * as store from "../../lib/services/stateStore";
import { onKvChanged, onTrackerChanged } from "../../utils/events";

export type KVContextType = {
  getValue: <T>(key: string, fallback?: T) => Promise<T>;
  setValue: <T>(key: string, val: T) => Promise<void>;
};

const KVContext = React.createContext<KVContextType | null>(null);

export function KVProvider({ children }: { children: React.ReactNode }){
  const api = React.useMemo<KVContextType>(() => ({
    getValue: async <T,>(key: string, fallback?: T) => {
      return await store.get<T>(key, fallback as any);
    },
    setValue: async <T,>(key: string, val: T) => {
      await store.set<T>(key, val);
    }
  }), []);
  return <KVContext.Provider value={api}>{children}</KVContext.Provider>;
}

export function useKV<T = any>(key: string, fallback?: T){
  const ctx = React.useContext(KVContext);
  const [value, setValue] = React.useState<T>(fallback as T);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const v = await store.get<T>(key, fallback as any);
        if (alive) { setValue(v as T); setLoading(false); }
      } catch { if (alive) setLoading(false); }
    })();

    const offKv = onKvChanged((detail) => {
      if (detail.key === key) setValue(detail.val as T);
    });

    const offTracker = onTrackerChanged((detail) => {
      if (detail.key === key) setValue((detail.filled as any) as T);
    });

    return () => {
      alive = false;
      offKv();
      offTracker();
    };
  }, [key]);

  const update = React.useCallback(async (next: T) => {
    setValue(next);
    await store.set<T>(key, next);
  }, [key]);

  return { value, set: update, loading } as const;
}