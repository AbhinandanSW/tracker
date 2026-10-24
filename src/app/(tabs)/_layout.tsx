import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { Icon, icons } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  const iconPill = (focused: boolean, icon: (typeof icons)[keyof typeof icons], color: ColorValue) => (
    <View
      style={[
        styles.iconPill,
        focused && { backgroundColor: theme.accentSoft },
      ]}>
      <Icon name={icon} size={22} color={color} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) =>
            iconPill(focused, focused ? icons.jobsSelected : icons.jobs, color),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color, focused }) =>
            iconPill(focused, focused ? icons.trackerSelected : icons.tracker, color),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) =>
            iconPill(focused, focused ? icons.settingsSelected : icons.settings, color),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    minWidth: 44,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
