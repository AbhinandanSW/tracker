import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.halo, { backgroundColor: theme.accentWash }]}>
        <View style={[styles.iconShell, { backgroundColor: theme.accentSoft }]}>
          <Icon name={icon} size={28} color={theme.accent} />
        </View>
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.eight,
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  halo: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  description: {
    textAlign: 'center',
    maxWidth: 400,
  },
  action: {
    marginTop: Spacing.one,
  },
});
