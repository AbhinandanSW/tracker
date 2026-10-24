import * as SecureStore from 'expo-secure-store';

import type { Secrets } from '@/types';

const KEY = 'jobhunt-secrets-v1';

const EMPTY: Secrets = { githubToken: '', aiApiKey: '' };

export async function loadSecrets(): Promise<Secrets> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Secrets>) };
  } catch {
    return EMPTY;
  }
}

export async function saveSecrets(secrets: Secrets): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(secrets));
  } catch {
    // The device may be locked or the keychain unavailable.
  }
}

export async function clearSecrets(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Ignore.
  }
}
