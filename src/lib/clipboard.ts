import * as Clipboard from 'expo-clipboard';

/** Returns false when the platform refuses clipboard access (rare, but possible on web). */
export async function copyText(text: string): Promise<boolean> {
  if (!text.trim()) return false;
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
