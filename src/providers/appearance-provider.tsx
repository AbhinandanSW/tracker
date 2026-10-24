import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useSettings } from '@/providers/settings-provider';

export type ColorScheme = 'light' | 'dark';

const AppearanceContext = createContext<ColorScheme | null>(null);

/**
 * Resolves the user's theme choice against the operating system preference.
 * Every themed component reads the result through `useColorScheme`.
 */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const system = useSystemColorScheme();
  const { settings } = useSettings();

  const scheme: ColorScheme =
    settings.themeMode === 'system'
      ? system === 'dark'
        ? 'dark'
        : 'light'
      : settings.themeMode;

  const value = useMemo(() => scheme, [scheme]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): ColorScheme | null {
  return useContext(AppearanceContext);
}
