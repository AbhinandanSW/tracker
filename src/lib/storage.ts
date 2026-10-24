import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail on private browsing or a full disk. The in-memory state
    // remains usable for this session.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

export const StorageKeys = {
  settings: 'jobhunt:settings:v1',
  sharedState: 'jobhunt:state:v1',
  jobsCache: 'jobhunt:jobs-cache:v1',
  dismissedSetup: 'jobhunt:dismissed-setup:v1',
  lastSync: 'jobhunt:last-sync:v1',
} as const;
