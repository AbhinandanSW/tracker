import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'body'
    | 'title'
    | 'subtitle'
    | 'heading'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'label'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (type === 'link' || type === 'linkPrimary' ? 'accent' : 'text')];

  return <Text style={[styles.base, { color }, styles[type], style]} {...rest} />;
}

const platformFont = Platform.select({ web: Fonts.sans, default: undefined });

const styles = StyleSheet.create({
  base: {
    fontFamily: platformFont,
  },
  default: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  small: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: Platform.select({ android: '700', default: '500' }),
  },
});
