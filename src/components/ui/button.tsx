import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label?: string;
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  label,
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const palette = {
    primary: { backgroundColor: theme.accent, borderColor: theme.accent, color: theme.accentText },
    secondary: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      color: theme.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: theme.textSecondary,
    },
    danger: {
      backgroundColor: theme.dangerSoft,
      borderColor: theme.dangerSoft,
      color: theme.danger,
    },
    success: {
      backgroundColor: theme.successSoft,
      borderColor: theme.successSoft,
      color: theme.success,
    },
    subtle: {
      backgroundColor: theme.surfaceAlt,
      borderColor: theme.surfaceAlt,
      color: theme.text,
    },
  }[variant];

  const dimensions = {
    sm: { height: 32, paddingHorizontal: Spacing.three, gap: 6 },
    md: { height: 40, paddingHorizontal: Spacing.four, gap: 8 },
    lg: { height: 48, paddingHorizontal: Spacing.five, gap: 10 },
  }[size];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        dimensions,
        palette,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.color} />
      ) : (
        <>
          {icon}
          {children ?? (
            <ThemedText
              style={[
                styles.label,
                { color: palette.color, fontSize: size === 'lg' ? 15 : 14 },
                textStyle,
              ]}>
              {label}
            </ThemedText>
          )}
          {iconRight}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.74,
  },
  label: {
    fontWeight: '600',
    lineHeight: 18,
  },
});
