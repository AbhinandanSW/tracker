import type { ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Page({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.page, { backgroundColor: theme.background }, style]}>{children}</View>;
}

export function PageScroll({
  children,
  contentStyle,
  safeTop = true,
  ...rest
}: ScrollViewProps & {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  safeTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const paddingTop =
    Platform.OS === 'web' ? Spacing.five : safeTop ? insets.top + Spacing.three : Spacing.three;
  const paddingBottom =
    Platform.OS === 'web' ? Spacing.seven : insets.bottom + BottomTabInset + Spacing.five;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingTop, paddingBottom },
        contentStyle,
      ]}
      {...rest}>
      {children}
    </ScrollView>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function usePagePadding() {
  const insets = useSafeAreaInsets();
  return {
    top: Platform.OS === 'web' ? Spacing.five : insets.top + Spacing.three,
    bottom:
      Platform.OS === 'web' ? Spacing.seven : insets.bottom + BottomTabInset + Spacing.five,
  };
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
});
