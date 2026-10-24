/**
 * Job Hunt design tokens.
 *
 * Warm neutral canvas, a single indigo accent with a violet companion for
 * gradients, and a small set of semantic colours for the application pipeline.
 * Both modes are tuned for WCAG AA body text contrast.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F7F5F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F1EEE7',
    surfaceRaised: '#FFFFFF',
    border: '#E7E3D9',
    borderStrong: '#D5D0C5',
    text: '#181A1F',
    textSecondary: '#5F646D',
    textTertiary: '#656B75',
    accent: '#4F46E5',
    accentStrong: '#7C3AED',
    accentSoft: '#EEF0FF',
    accentWash: '#F7F5FF',
    accentText: '#FFFFFF',
    sun: '#9A5A05',
    sunSoft: '#FFF3DE',
    success: '#0E7C4A',
    successSoft: '#E3F5EB',
    warning: '#A75A00',
    warningSoft: '#FFF0DC',
    danger: '#B93838',
    dangerSoft: '#FBE8E8',
    purple: '#6A3FD1',
    purpleSoft: '#F0EAFF',
    hidden: '#6B7280',
    hiddenSoft: '#ECEEF1',
    heroStart: '#1E1B4B',
    heroEnd: '#4338CA',
    heroText: '#FFFFFF',
    heroMuted: 'rgba(255, 255, 255, 0.72)',
    heroChip: 'rgba(255, 255, 255, 0.14)',
    heroBorder: 'rgba(255, 255, 255, 0.2)',
    shadow: '#1B1A2E',
    overlay: 'rgba(12, 14, 18, 0.42)',
  },
  dark: {
    background: '#0A0B0F',
    surface: '#14161C',
    surfaceAlt: '#1D2028',
    surfaceRaised: '#1A1D24',
    border: '#282C34',
    borderStrong: '#3A3F49',
    text: '#F5F4EF',
    textSecondary: '#A6ABB5',
    textTertiary: '#8A919C',
    accent: '#A5B4FC',
    accentStrong: '#C4B5FD',
    accentSoft: '#1D2340',
    accentWash: '#171B2E',
    accentText: '#0A0F1F',
    sun: '#FBBF24',
    sunSoft: '#33260F',
    success: '#5DD39E',
    successSoft: '#122B22',
    warning: '#F2B36B',
    warningSoft: '#33240F',
    danger: '#FF8A8A',
    dangerSoft: '#331717',
    purple: '#B49CFF',
    purpleSoft: '#241B3D',
    hidden: '#9AA1AB',
    hiddenSoft: '#22262B',
    heroStart: '#1B1A3A',
    heroEnd: '#312E81',
    heroText: '#FFFFFF',
    heroMuted: 'rgba(255, 255, 255, 0.7)',
    heroChip: 'rgba(255, 255, 255, 0.1)',
    heroBorder: 'rgba(255, 255, 255, 0.16)',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.62)',
  },
} as const;

export type Theme = (typeof Colors)['light'];
export type ThemeColor = keyof Theme;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 26,
  xxl: 34,
} as const;

export const Shadow = {
  card: Platform.select({
    web: {
      boxShadow: '0 1px 2px rgba(27, 26, 46, 0.04), 0 10px 30px rgba(27, 26, 46, 0.06)',
    },
    default: {
      shadowColor: '#1B1A2E',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
    },
  })!,
  lifted: Platform.select({
    web: {
      boxShadow: '0 2px 6px rgba(27, 26, 46, 0.06), 0 18px 44px rgba(27, 26, 46, 0.12)',
    },
    default: {
      shadowColor: '#1B1A2E',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
      elevation: 8,
    },
  })!,
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 64, android: 84, default: 0 }) ?? 0;
export const MaxContentWidth = 920;
export const WideContentWidth = 920;

export const StatusTone: Record<
  'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'hidden',
  { fg: ThemeColor; bg: ThemeColor; label: string }
> = {
  saved: { fg: 'accent', bg: 'accentSoft', label: 'Saved' },
  applied: { fg: 'sun', bg: 'sunSoft', label: 'Applied' },
  interview: { fg: 'purple', bg: 'purpleSoft', label: 'Interview' },
  offer: { fg: 'success', bg: 'successSoft', label: 'Offer' },
  rejected: { fg: 'danger', bg: 'dangerSoft', label: 'Rejected' },
  hidden: { fg: 'hidden', bg: 'hiddenSoft', label: 'Hidden' },
};
