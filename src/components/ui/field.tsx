import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, icons } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Field({
  label,
  description,
  value,
  onChangeText,
  placeholder,
  secure = false,
  multiline = false,
  mono = false,
  containerStyle,
  inputStyle,
  ...rest
}: TextInputProps & {
  label: string;
  description?: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  mono?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {description ? (
          <ThemedText type="caption" themeColor="textTertiary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.inputShell,
          multiline && styles.multilineShell,
          {
            backgroundColor: theme.surface,
            borderColor: focused ? theme.accent : theme.border,
          },
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          selectionColor={theme.accent}
          secureTextEntry={secure && !revealed}
          multiline={multiline}
          autoCapitalize={rest.autoCapitalize ?? 'none'}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            mono && { fontFamily: 'monospace', fontSize: 12 },
            inputStyle,
            { color: theme.text },
            Platform.OS === 'web' && styles.webInput,
          ]}
          {...rest}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide value' : 'Show value'}
            onPress={() => setRevealed((current) => !current)}
            hitSlop={8}
            style={styles.eye}>
            <Icon name={revealed ? icons.eyeOff : icons.eye} size={17} color={theme.textTertiary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 42,
  },
  multilineShell: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 9,
    minHeight: 40,
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: 'top',
    lineHeight: 21,
  },
  webInput: {
    outlineStyle: 'none',
  } as object,
  eye: {
    paddingLeft: Spacing.two,
    alignSelf: 'center',
  },
});
