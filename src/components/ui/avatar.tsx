import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { avatarColor, initials } from '@/lib/format';

export function Avatar({
  name,
  size = 44,
  radius,
}: {
  name: string;
  size?: number;
  radius?: number;
}) {
  const background = avatarColor(name || '?');
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radius ?? Math.round(size * 0.3),
          backgroundColor: background,
        },
      ]}>
      <ThemedText
        style={[
          styles.initials,
          { fontSize: Math.max(11, Math.round(size * 0.32)), lineHeight: size },
        ]}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
