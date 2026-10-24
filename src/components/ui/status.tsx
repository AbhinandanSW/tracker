import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, StatusTone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PIPELINE } from '@/lib/shared-state';
import type { JobStatus } from '@/types';

export function StatusPill({ status }: { status: Exclude<JobStatus, 'open'> }) {
  const theme = useTheme();
  const tone = StatusTone[status];
  return (
    <View style={[styles.pill, { backgroundColor: theme[tone.bg] }]}>
      <ThemedText style={[styles.pillText, { color: theme[tone.fg] }]}>{tone.label}</ThemedText>
    </View>
  );
}

export function StatusSelector({
  value,
  onChange,
  includeHidden = false,
}: {
  value: JobStatus;
  onChange: (status: JobStatus) => void;
  includeHidden?: boolean;
}) {
  const theme = useTheme();
  const options: { status: JobStatus; label: string; fg: keyof typeof theme; bg: keyof typeof theme }[] =
    [
      ...PIPELINE.map((item) => ({
        status: item.status as JobStatus,
        label: item.label,
        fg: StatusTone[item.status as Exclude<JobStatus, 'open' | 'hidden'>].fg,
        bg: StatusTone[item.status as Exclude<JobStatus, 'open' | 'hidden'>].bg,
      })),
      ...(includeHidden
        ? [{ status: 'hidden' as JobStatus, label: 'Hide', fg: StatusTone.hidden.fg, bg: StatusTone.hidden.bg }]
        : []),
    ];

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = value === option.status;
        return (
          <Pressable
            key={option.status}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(active ? 'open' : option.status)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: active ? theme[option.bg] : theme.surface,
                borderColor: active ? theme[option.fg] : theme.border,
              },
              pressed && { opacity: 0.7 },
            ]}>
            <ThemedText
              style={[
                styles.optionText,
                { color: active ? theme[option.fg] : theme.textSecondary },
                active && styles.optionTextActive,
              ]}>
              {active ? `${option.label} ✓` : option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    height: 34,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  optionTextActive: {
    fontWeight: '700',
  },
});
