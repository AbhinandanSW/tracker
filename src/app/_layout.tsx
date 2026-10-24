import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppearanceProvider } from '@/providers/appearance-provider';
import { ApplicationsProvider } from '@/providers/applications-provider';
import { JobsProvider } from '@/providers/jobs-provider';
import { SettingsProvider } from '@/providers/settings-provider';
import { ToastProvider } from '@/providers/toast-provider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppearanceProvider>
        <ThemedRoot />
      </AppearanceProvider>
    </SettingsProvider>
  );
}

function ThemedRoot() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const theme = Colors[dark ? 'dark' : 'light'];
  const base = dark ? DarkTheme : DefaultTheme;

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('jobhunt-fonts')) return;
    const link = document.createElement('link');
    link.id = 'jobhunt-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.backgroundColor = theme.background;
    document.body.style.backgroundColor = theme.background;
  }, [theme.background]);

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: theme.accent,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.danger,
        },
      }}>
      <ToastProvider>
        <ApplicationsProvider>
          <JobsProvider>
            <StatusBar style={dark ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="job/[id]"
                options={{ animation: Platform.OS === 'web' ? 'none' : 'default' }}
              />
            </Stack>
          </JobsProvider>
        </ApplicationsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
