import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { mergeSettings } from '@/lib/settings';
import { loadSecrets, saveSecrets } from '@/lib/secrets';
import { StorageKeys, loadJson, saveJson } from '@/lib/storage';
import type { Secrets, Settings } from '@/types';

type SettingsContextValue = {
  settings: Settings;
  secrets: Secrets;
  hydrated: boolean;
  updateSettings: (updater: (current: Settings) => Settings) => void;
  setGithubToken: (token: string) => void;
  setAiApiKey: (key: string) => void;
  clearGithubToken: () => void;
  clearAiApiKey: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => mergeSettings(null));
  const [secrets, setSecrets] = useState<Secrets>({ githubToken: '', aiApiKey: '' });
  const [hydrated, setHydrated] = useState(false);
  const secretsRef = useRef(secrets);

  useEffect(() => {
    let alive = true;
    Promise.all([loadJson<Partial<Settings> | null>(StorageKeys.settings, null), loadSecrets()]).then(
      ([saved, storedSecrets]) => {
        if (!alive) return;
        setSettings(mergeSettings(saved));
        setSecrets(storedSecrets);
        secretsRef.current = storedSecrets;
        setHydrated(true);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      void saveJson(StorageKeys.settings, settings);
    }, 250);
    return () => clearTimeout(timer);
  }, [hydrated, settings]);

  const updateSettings = useCallback((updater: (current: Settings) => Settings) => {
    setSettings((current) => mergeSettings(updater(current)));
  }, []);

  const persistSecrets = useCallback((next: Secrets) => {
    setSecrets(next);
    secretsRef.current = next;
    void saveSecrets(next);
  }, []);

  const setGithubToken = useCallback(
    (token: string) => persistSecrets({ ...secretsRef.current, githubToken: token.trim() }),
    [persistSecrets],
  );

  const setAiApiKey = useCallback(
    (key: string) => persistSecrets({ ...secretsRef.current, aiApiKey: key.trim() }),
    [persistSecrets],
  );

  const clearGithubToken = useCallback(
    () => persistSecrets({ ...secretsRef.current, githubToken: '' }),
    [persistSecrets],
  );

  const clearAiApiKey = useCallback(
    () => persistSecrets({ ...secretsRef.current, aiApiKey: '' }),
    [persistSecrets],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      secrets,
      hydrated,
      updateSettings,
      setGithubToken,
      setAiApiKey,
      clearGithubToken,
      clearAiApiKey,
    }),
    [
      settings,
      secrets,
      hydrated,
      updateSettings,
      setGithubToken,
      setAiApiKey,
      clearGithubToken,
      clearAiApiKey,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
