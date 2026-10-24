import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Chip({
  label,
  count,
  selected = false,
  onPress,
  compact = false,
  icon,
}: {
  label: string;
  count?: number;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  icon?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.compact,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && { opacity: 0.75, transform: [{ scale: 0.985 }] },
      ]}>
      {icon}
      <ThemedText
        style={[
          styles.label,
          { color: selected ? theme.accentText : theme.textSecondary },
          selected && styles.selectedLabel,
        ]}>
        {label}
      </ThemedText>
      {typeof count === 'number' ? (
        <View
          style={[
            styles.count,
            { backgroundColor: selected ? 'rgba(0,0,0,0.18)' : theme.surfaceAlt },
          ]}>
          <ThemedText
            style={[styles.countText, { color: selected ? theme.accentText : theme.textTertiary }]}>
            {count}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  idle: {
    opacity: 0.92,
  },
  compact: {
    height: 30,
    paddingHorizontal: 11,
  },
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  selectedLabel: {
    fontWeight: '700',
  },
  count: {
    borderRadius: Radius.pill,
    minWidth: 20,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
});
