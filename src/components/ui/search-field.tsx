import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon, icons } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search jobs',
  ...rest
}: TextInputProps & { value: string; onChangeText: (value: string) => void }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: focused ? theme.accent : theme.border,
        },
      ]}>
      <Icon name={icons.search} size={18} color={theme.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        selectionColor={theme.accent}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, { color: theme.text }, Platform.OS === 'web' && styles.webInput]}
        {...rest}
      />
      {value ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={({ pressed }) => [styles.clear, pressed && { opacity: 0.6 }]}>
          <Icon name={icons.close} size={16} color={theme.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingVertical: 0,
  },
  webInput: {
    outlineStyle: 'none',
  } as object,
  clear: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
