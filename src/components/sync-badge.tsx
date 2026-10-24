import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, icons } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { relativeTime } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import { useApplications } from '@/providers/applications-provider';

export function SyncBadge({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  const { syncStatus, lastSyncedAt, syncNow, syncError, dirty } = useApplications();

  const state = (() => {
    if (syncStatus === 'syncing') {
      return { label: 'Syncing', color: theme.accent, bg: theme.accentSoft };
    }
    if (syncStatus === 'error') {
      return { label: 'Sync error', color: theme.danger, bg: theme.dangerSoft };
    }
    if (syncStatus === 'off') {
      return { label: 'Local only', color: theme.textTertiary, bg: theme.surfaceAlt };
    }
    if (dirty || syncStatus === 'pending') {
      return { label: 'Unsynced', color: theme.warning, bg: theme.warningSoft };
    }
    return {
      label: lastSyncedAt ? `Synced ${relativeTime(lastSyncedAt)}` : 'Ready to sync',
      color: theme.success,
      bg: theme.successSoft,
    };
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        syncStatus === 'off'
          ? 'Local only. Open sync settings.'
          : `${state.label}${syncError ? `. ${syncError}` : ''}. Sync now.`
      }
      onPress={() => {
        if (syncStatus === 'off') {
          router.push('/settings');
          return;
        }
        void syncNow();
      }}
      style={({ pressed }) => [
        styles.badge,
        { backgroundColor: state.bg },
        pressed && { opacity: 0.7 },
      ]}>
      {syncStatus === 'syncing' ? (
        <ActivityIndicator size="small" color={state.color} />
      ) : (
        <View style={[styles.dot, { backgroundColor: state.color }]} />
      )}
      {compact ? null : (
        <ThemedText style={[styles.label, { color: state.color }]} numberOfLines={1}>
          {state.label}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function SyncIcon({ size = 18 }: { size?: number }) {
  const theme = useTheme();
  const { syncStatus } = useApplications();
  const color =
    syncStatus === 'error'
      ? theme.danger
      : syncStatus === 'pending'
        ? theme.warning
        : syncStatus === 'off'
          ? theme.textTertiary
          : theme.success;
  return <Icon name={syncStatus === 'off' ? icons.cloudOff : icons.cloud} size={size} color={color} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    maxWidth: 200,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
