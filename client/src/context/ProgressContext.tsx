import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import {
  getProgress,
  saveProgress,
  type ProgressPayload
} from "../services/mediaApi";
import type { UserProgress } from "../types/media";

type ProgressContextValue = {
  progressByItemId: Record<string, UserProgress>;
  refreshProgress: () => Promise<void>;
  upsertProgress: (payload: ProgressPayload) => Promise<void>;
  getItemProgress: (itemId: string) => UserProgress | undefined;
};

const STORAGE_KEY = "private-anime-progress";

const ProgressContext = createContext<ProgressContextValue | null>(null);

function toMap(items: UserProgress[]) {
  return items.reduce<Record<string, UserProgress>>((accumulator, item) => {
    accumulator[item.itemId] = item;
    return accumulator;
  }, {});
}

export function ProgressProvider({ children }: PropsWithChildren) {
  const [progressByItemId, setProgressByItemId] = useState<
    Record<string, UserProgress>
  >(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, UserProgress>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressByItemId));
  }, [progressByItemId]);

  const refreshProgress = useCallback(async () => {
    try {
      const items = await getProgress();
      setProgressByItemId(toMap(items));
    } catch {
      // Local storage remains the fallback when the server is unavailable.
    }
  }, []);

  useEffect(() => {
    void refreshProgress();
  }, [refreshProgress]);

  const upsertProgress = useCallback(async (payload: ProgressPayload) => {
    const optimistic: UserProgress = {
      itemId: payload.itemId,
      positionTicks: payload.positionTicks,
      runtimeTicks: payload.runtimeTicks,
      played: payload.played,
      updatedAt: new Date().toISOString()
    };

    setProgressByItemId((current) => ({
      ...current,
      [payload.itemId]: optimistic
    }));

    try {
      const persisted = await saveProgress(payload);
      setProgressByItemId((current) => ({
        ...current,
        [payload.itemId]: persisted
      }));
    } catch {
      // The optimistic local state is intentionally retained.
    }
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progressByItemId,
      refreshProgress,
      upsertProgress,
      getItemProgress: (itemId: string) => progressByItemId[itemId]
    }),
    [progressByItemId, refreshProgress, upsertProgress]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used inside ProgressProvider");
  }

  return context;
}
