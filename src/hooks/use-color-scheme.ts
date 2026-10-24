import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppearance } from '@/providers/appearance-provider';

/**
 * The active color scheme: the user's explicit choice when set, otherwise the
 * operating system preference.
 */
export function useColorScheme() {
  const appearance = useAppearance();
  const system = useSystemColorScheme();
  return appearance ?? system;
}
