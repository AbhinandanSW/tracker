import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { WebHeader } from '@/components/web-header';
import { useTheme } from '@/hooks/use-theme';
import { useApplications } from '@/providers/applications-provider';

export default function TabsLayoutWeb() {
  const theme = useTheme();
  const { sharedState } = useApplications();
  const trackerCount = Object.values(sharedState.records).filter(
    (record) => record.status !== 'open' && record.status !== 'hidden',
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <WebHeader trackerCount={trackerCount} />
      <View style={styles.body}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
