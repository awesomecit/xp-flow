import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/** Chiavi di feature: si estendono qui, mai stringhe libere nei componenti. */
export const FEATURE_FLAGS = [
  "billing",
  "analytics",
  "betaUi",
  "offlineMode",
  /** XP Flow Monitor: interazioni di scrittura sul flusso (slice futura). */
  "interaction",
  /** XP Flow Monitor: notifiche verso Telegram (slice futura). */
  "telegram",
] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export type FlagMap = Record<FeatureFlag, boolean>;

export const DEFAULT_FLAGS: FlagMap = {
  billing: false,
  analytics: true,
  betaUi: false,
  offlineMode: false,
  interaction: false,
  telegram: false,
};

type FeatureFlagContextValue = {
  flags: FlagMap;
  isEnabled: (flag: FeatureFlag) => boolean;
  setFlag: (flag: FeatureFlag, enabled: boolean) => void;
};

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

export function FeatureFlagProvider({
  children,
  initialFlags,
}: {
  children: ReactNode;
  initialFlags?: Partial<FlagMap>;
}) {
  const [flags, setFlags] = useState<FlagMap>({ ...DEFAULT_FLAGS, ...initialFlags });

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      isEnabled: (flag) => flags[flag],
      setFlag: (flag, enabled) => setFlags((prev) => ({ ...prev, [flag]: enabled })),
    }),
    [flags],
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlags(): FeatureFlagContextValue {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error("useFeatureFlags must be used inside <FeatureFlagProvider>");
  return ctx;
}

export function useFeature(flag: FeatureFlag): boolean {
  return useFeatureFlags().isEnabled(flag);
}
