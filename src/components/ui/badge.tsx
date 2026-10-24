import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Badge({
  label,
  fg = 'textSecondary',
  bg = 'surfaceAlt',
  icon,
  style,
}: {
  label: string | number;
  fg?: ThemeColor;
  bg?: ThemeColor;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme[bg] }, style]}>
      {icon}
      <ThemedText style={[styles.badgeText, { color: theme[fg] }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
