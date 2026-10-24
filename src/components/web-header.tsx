import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SyncBadge } from '@/components/sync-badge';
import { ThemedText } from '@/components/themed-text';
import { Icon, icons } from '@/components/ui/icon';
import { Radius, Spacing, WideContentWidth } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-provider';

const NAV = [
  { href: '/', label: 'Jobs', match: '/', icon: icons.jobs },
  { href: '/tracker', label: 'Tracker', match: '/tracker', icon: icons.tracker },
  { href: '/settings', label: 'Settings', match: '/settings', icon: icons.settings },
] as const;

export const WEB_HEADER_HEIGHT = 64;

export function WebHeader({ trackerCount }: { trackerCount?: number }) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { updateSettings } = useSettings();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const compact = width < 640;
  const tiny = width < 520;
  const mini = width < 350;
  const nextMode = scheme === 'dark' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: theme.surface, borderBottomColor: theme.border },
      ]}>
      <View style={[styles.inner, compact && styles.innerCompact]}>
        {mini ? null : (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={compact ? 'Job Hunt home' : undefined}
            onPress={() => router.push('/')}
            style={({ pressed }) => [styles.brand, pressed && { opacity: 0.7 }]}>
            <LinearGradient
              colors={[theme.accent, theme.accentStrong]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mark}>
              <Icon name={icons.jobsSelected} size={17} color={theme.accentText} />
            </LinearGradient>
            {compact ? null : (
              <View>
                <ThemedText type="heading" style={styles.brandText}>
                  Job Hunt
                </ThemedText>
                <ThemedText style={[styles.brandTag, { color: theme.textTertiary }]}>
                  Personal workspace
                </ThemedText>
              </View>
            )}
          </Pressable>
        )}

        <View style={styles.nav}>
          {NAV.map((item) => {
            const active =
              item.match === '/' ? pathname === '/' : pathname.startsWith(item.match);
            const color = active ? theme.accent : theme.textSecondary;
            return (
              <Pressable
                key={item.href}
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.navItem,
                  active && { backgroundColor: theme.accentSoft },
                  pressed && { opacity: 0.7 },
                ]}>
                {compact ? null : <Icon name={item.icon} size={15} color={color} />}
                <ThemedText style={[styles.navLabel, { color }]}>{item.label}</ThemedText>
                {item.match === '/tracker' && trackerCount ? (
                  <View
                    style={[
                      styles.count,
                      { backgroundColor: active ? theme.accent : theme.surfaceAlt },
                    ]}>
                    <ThemedText
                      style={[
                        styles.countText,
                        { color: active ? theme.accentText : theme.textSecondary },
                      ]}>
                      {trackerCount}
                    </ThemedText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.right}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${nextMode} mode`}
            onPress={() =>
              updateSettings((current) => ({ ...current, themeMode: nextMode }))
            }
            style={({ pressed }) => [
              styles.themeButton,
              { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
              pressed && { opacity: 0.65 },
            ]}>
            <Icon
              name={scheme === 'dark' ? icons.sun : icons.moon}
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>
          {tiny ? null : <SyncBadge compact={compact} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
  },
  inner: {
    width: '100%',
    maxWidth: WideContentWidth,
    alignSelf: 'center',
    height: WEB_HEADER_HEIGHT,
    paddingHorizontal: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.five,
  },
  innerCompact: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.4,
  },
  brandTag: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 'auto',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  navLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  themeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
