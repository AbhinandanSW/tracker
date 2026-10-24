import type { Secrets } from '@/types';

const KEY = 'jobhunt:secrets:v1';

const EMPTY: Secrets = { githubToken: '', aiApiKey: '' };

function read(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function loadSecrets(): Promise<Secrets> {
  const raw = read();
  if (!raw) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Secrets>) };
  } catch {
    return EMPTY;
  }
}

export async function saveSecrets(secrets: Secrets): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(secrets));
  } catch {
    // Private browsing may reject writes.
  }
}

export async function clearSecrets(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
