import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

/**
 * Opens a posting in a way that keeps the app state intact.
 *
 * On web we open a new tab synchronously, otherwise the browser treats the
 * navigation as a popup. On native the in-app browser is friendlier than
 * kicking the user out to a full browser app.
 */
export function openExternal(url: string): void {
  if (!url) return;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  WebBrowser.openBrowserAsync(url).catch(() => {
    void Linking.openURL(url).catch(() => undefined);
  });
}
