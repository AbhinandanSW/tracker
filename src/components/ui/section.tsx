import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, icons, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SectionCard({
  title,
  description,
  icon,
  right,
  children,
  style,
  contentStyle,
}: {
  title?: string;
  description?: string;
  icon?: IconName;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}>
      {title || description || right ? (
        <View style={styles.header}>
          {icon ? <IconChip icon={icon} size={34} /> : null}
          <View style={styles.headerText}>
            {title ? (
              <ThemedText type="heading" style={styles.title}>
                {title}
              </ThemedText>
            ) : null}
            {description ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
                {description}
              </ThemedText>
            ) : null}
          </View>
          {right}
        </View>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function CollapsibleSection({
  icon,
  title,
  summary,
  description,
  expanded,
  onToggle,
  right,
  children,
}: {
  icon: IconName;
  title: string;
  summary: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  right?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: expanded ? theme.borderStrong : theme.border },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}. ${summary}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.72 }]}>
        <IconChip icon={icon} size={38} active={expanded} />
        <View style={styles.headerText}>
          <ThemedText type="heading" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            {expanded && description ? description : summary}
          </ThemedText>
        </View>
        {right}
        <View
          style={[
            styles.chevron,
            { backgroundColor: theme.surfaceAlt, transform: [{ rotate: expanded ? '180deg' : '0deg' }] },
          ]}>
          <Icon name={icons.chevronDown} size={16} color={theme.textSecondary} />
        </View>
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

export function IconChip({
  icon,
  size = 36,
  active = false,
}: {
  icon: IconName;
  size?: number;
  active?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.iconChip,
        {
          width: size,
          height: size,
          backgroundColor: active ? theme.accent : theme.accentSoft,
        },
      ]}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={active ? theme.accentText : theme.accent} />
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

export function Row({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  description: {
    maxWidth: 620,
  },
  iconChip: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
