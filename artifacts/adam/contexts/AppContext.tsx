import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  defaultProgress,
  getJSON,
  setJSON,
  STORAGE_KEYS,
  type Profile,
  type Progress,
} from "@/lib/storage";
import { setSoundEnabled } from "@/lib/audio";
import { todayISO } from "@/lib/utils";

type AppCtx = {
  ready: boolean;
  profile: Profile | null;
  progress: Progress;
  saveProfile: (p: Profile) => Promise<void>;
  patchProfile: (patch: Partial<Profile>) => Promise<void>;
  saveProgress: (
    p: Progress | ((prev: Progress) => Progress),
  ) => Promise<void>;
  resetAll: () => Promise<void>;
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress>(defaultProgress);

  useEffect(() => {
    (async () => {
      const p = await getJSON<Profile>(STORAGE_KEYS.profile);
      const pr =
        (await getJSON<Progress>(STORAGE_KEYS.progress)) ?? defaultProgress;
      setProfile(p);
      setProgress(pr);
      if (p) setSoundEnabled(p.soundOn);
      // Reset daily usage if it's a new day
      if (pr.dailyUsageDate !== todayISO()) {
        const next = { ...pr, dailyUsageDate: todayISO(), dailyUsageMinutes: 0 };
        setProgress(next);
        await setJSON(STORAGE_KEYS.progress, next);
      }
      setReady(true);
    })();
  }, []);

  const saveProfile = useCallback(async (p: Profile) => {
    setProfile(p);
    setSoundEnabled(p.soundOn);
    await setJSON(STORAGE_KEYS.profile, p);
  }, []);

  const patchProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!profile) return;
      const next = { ...profile, ...patch };
      await saveProfile(next);
    },
    [profile, saveProfile],
  );

  const saveProgress = useCallback(
    async (p: Progress | ((prev: Progress) => Progress)) => {
      setProgress((prev) => {
        const next = typeof p === "function" ? p(prev) : p;
        setJSON(STORAGE_KEYS.progress, next);
        return next;
      });
    },
    [],
  );

  const resetAll = useCallback(async () => {
    setProfile(null);
    setProgress(defaultProgress);
    await Promise.all([
      setJSON(STORAGE_KEYS.profile, null as unknown as Profile),
      setJSON(STORAGE_KEYS.progress, defaultProgress),
    ]);
  }, []);

  const value = useMemo<AppCtx>(
    () => ({
      ready,
      profile,
      progress,
      saveProfile,
      patchProfile,
      saveProgress,
      resetAll,
    }),
    [ready, profile, progress, saveProfile, patchProfile, saveProgress, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be inside AppProvider");
  return v;
}
