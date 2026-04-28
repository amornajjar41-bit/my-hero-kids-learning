import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

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
  addPoints: (pts: number) => void;
  resetAll: () => Promise<void>;
  // 4B – screen time helpers
  isScreenBlocked: boolean;
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress>(defaultProgress);

  // 4B – Track the timestamp when the app came to foreground
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    (async () => {
      const p = await getJSON<Profile>(STORAGE_KEYS.profile);
      const raw = await getJSON<Progress>(STORAGE_KEYS.progress);
      const pr = raw ?? defaultProgress;
      setProfile(p);

      // Reset daily usage if it's a new day
      const today = todayISO();
      let next = { ...defaultProgress, ...pr };
      if (next.dailyUsageDate !== today) {
        next = { ...next, dailyUsageDate: today, dailyUsageMinutes: 0 };
      }
      // Reset todayPoints if it's a new day
      if (next.todayPointsDate !== today) {
        next = { ...next, todayPoints: 0, todayPointsDate: today };
      }
      setProgress(next);
      if (next !== pr) await setJSON(STORAGE_KEYS.progress, next);

      if (p) setSoundEnabled(p.soundOn);
      sessionStartRef.current = Date.now();
      setReady(true);
    })();
  }, []);

  // 4B – AppState listener: accumulate screen time while active
  useEffect(() => {
    const flush = async (minutes: number) => {
      if (minutes < 0.016) return; // < 1 second – ignore
      setProgress((prev) => {
        const today = todayISO();
        const base = prev.dailyUsageDate === today ? prev.dailyUsageMinutes : 0;
        const next: Progress = {
          ...prev,
          dailyUsageDate: today,
          dailyUsageMinutes: base + minutes,
        };
        setJSON(STORAGE_KEYS.progress, next);
        return next;
      });
    };

    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        sessionStartRef.current = Date.now();
      } else if (nextState === "background" || nextState === "inactive") {
        const elapsed = (Date.now() - sessionStartRef.current) / 60000;
        sessionStartRef.current = Date.now();
        flush(elapsed);
      }
    };

    const sub = AppState.addEventListener("change", handleChange);

    // Also tick every 60 seconds while active (for real-time block check)
    const ticker = setInterval(() => {
      if (AppState.currentState === "active") {
        const elapsed = (Date.now() - sessionStartRef.current) / 60000;
        sessionStartRef.current = Date.now();
        flush(elapsed);
      }
    }, 60_000);

    return () => {
      sub.remove();
      clearInterval(ticker);
    };
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

  // Change 7 – award points, reset daily counter automatically
  const addPoints = useCallback((pts: number) => {
    setProgress((prev) => {
      const today = todayISO();
      const todayBase = prev.todayPointsDate === today ? prev.todayPoints : 0;
      const next: Progress = {
        ...prev,
        pointsTotal: (prev.pointsTotal ?? 0) + pts,
        todayPoints: todayBase + pts,
        todayPointsDate: today,
      };
      setJSON(STORAGE_KEYS.progress, next);
      return next;
    });
  }, []);

  const resetAll = useCallback(async () => {
    setProfile(null);
    setProgress(defaultProgress);
    await Promise.all([
      setJSON(STORAGE_KEYS.profile, null as unknown as Profile),
      setJSON(STORAGE_KEYS.progress, defaultProgress),
      setJSON(STORAGE_KEYS.onboardingDone, false),
    ]);
  }, []);

  // 4B – derive whether screen is blocked
  const isScreenBlocked = useMemo(() => {
    if (!profile) return false;
    if (profile.screenLimitHours === 0) return false; // unlimited
    const today = todayISO();
    if (progress.dailyUsageDate !== today) return false;
    return progress.dailyUsageMinutes >= profile.screenLimitHours * 60;
  }, [profile, progress]);

  const value = useMemo<AppCtx>(
    () => ({
      ready,
      profile,
      progress,
      saveProfile,
      patchProfile,
      saveProgress,
      addPoints,
      resetAll,
      isScreenBlocked,
    }),
    [ready, profile, progress, saveProfile, patchProfile, saveProgress, addPoints, resetAll, isScreenBlocked],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be inside AppProvider");
  return v;
}
