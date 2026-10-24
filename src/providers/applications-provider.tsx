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
import { AppState } from 'react-native';

import { readJsonFile, writeJsonFile } from '@/lib/github';
import {
  buildRecord,
  createEmptyState,
  jobFromSnapshot,
  mergeSharedStates,
  normalizeState,
  snapshotFromJob,
} from '@/lib/shared-state';
import { hasSyncConfig } from '@/lib/settings';
import { StorageKeys, loadJson, saveJson } from '@/lib/storage';
import { useSettings } from '@/providers/settings-provider';
import { useToast } from '@/providers/toast-provider';
import type {
  ApplicationRecord,
  Job,
  JobSnapshot,
  JobStatus,
  Profile,
  SharedState,
  SyncStatus,
} from '@/types';

type ApplicationsContextValue = {
  sharedState: SharedState;
  hydrated: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  dirty: boolean;
  getRecord: (jobId: string) => ApplicationRecord | undefined;
  setStatus: (job: Job, status: JobStatus, extra?: Partial<ApplicationRecord>) => void;
  updateRecord: (job: Job | JobSnapshot, patch: Partial<ApplicationRecord>) => void;
  resetRecord: (job: Job | JobSnapshot) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  syncNow: () => Promise<void>;
};

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

function signature(state: SharedState): string {
  return JSON.stringify({ records: state.records, profile: state.profile });
}

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const { settings, secrets, hydrated: settingsHydrated } = useSettings();
  const { showToast } = useToast();

  const [state, setState] = useState<SharedState>(() => createEmptyState());
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const stateRef = useRef(state);
  const dirtyRef = useRef(false);
  const syncingRef = useRef(false);
  const pendingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSyncRef = useRef(false);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const configReady = hasSyncConfig(settings.sync) && Boolean(secrets.githubToken);

  // Load the local copy first so the app is usable offline and before any network call.
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadJson<Partial<SharedState> | null>(StorageKeys.sharedState, null),
      loadJson<string | null>(StorageKeys.lastSync, null),
    ]).then(([saved, lastSync]) => {
      if (!alive) return;
      const next = normalizeState(saved);
      stateRef.current = next;
      setState(next);
      if (lastSync) {
        setLastSyncedAt(lastSync);
      }
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Persist locally on every change, debounced so typing in notes is cheap.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      void saveJson(StorageKeys.sharedState, state);
    }, 200);
    return () => clearTimeout(timer);
  }, [hydrated, state]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
    if (configReady) setSyncStatus('pending');
  }, [configReady]);

  const fullSync = useCallback(
    async (reason: 'startup' | 'save' | 'manual' | 'resume'): Promise<boolean> => {
      if (!configReady) {
        setSyncStatus('off');
        return false;
      }
      if (syncingRef.current) {
        pendingRef.current = true;
        return false;
      }

      syncingRef.current = true;
      setSyncStatus('syncing');
      setSyncError(null);

      try {
        const remoteFile = await readJsonFile<Partial<SharedState>>(
          settings.sync,
          secrets.githubToken,
        );
        const remote = remoteFile.data ? normalizeState(remoteFile.data) : null;
        const merged = mergeSharedStates(stateRef.current, remote);

        if (signature(merged) !== signature(stateRef.current)) {
          stateRef.current = merged;
          setState(merged);
        }

        const remoteSignature = remote ? signature(remote) : '';
        if (!remote || signature(merged) !== remoteSignature) {
          await writeJsonFile(
            settings.sync,
            secrets.githubToken,
            merged,
            remoteFile.sha,
            `chore: sync job hunt state (${reason})`,
          );
        }

        const stamp = new Date().toISOString();
        dirtyRef.current = false;
        lastErrorRef.current = null;
        setDirty(false);
        setLastSyncedAt(stamp);
        setSyncStatus('idle');
        void saveJson(StorageKeys.lastSync, stamp);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed.';
        lastErrorRef.current = message;
        setSyncError(message);
        setSyncStatus('error');
        return false;
      } finally {
        syncingRef.current = false;
        if (pendingRef.current) {
          pendingRef.current = false;
          setTimeout(() => {
            if (dirtyRef.current) void fullSync('save');
          }, 400);
        }
      }
    },
    [configReady, secrets.githubToken, settings.sync],
  );

  const schedulePush = useCallback(() => {
    if (!configReady) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null;
      void fullSync('save');
    }, 1600);
  }, [configReady, fullSync]);

  useEffect(() => {
    if (!hydrated || !settingsHydrated) return;
    if (!configReady) {
      initialSyncRef.current = false;
      return;
    }
    if (!initialSyncRef.current) {
      initialSyncRef.current = true;
      void fullSync('startup');
    }
  }, [configReady, fullSync, hydrated, settingsHydrated]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && configReady && (dirtyRef.current || syncStatus === 'error')) {
        void fullSync('resume');
      }
    });
    return () => subscription.remove();
  }, [configReady, fullSync, syncStatus]);

  useEffect(
    () => () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    },
    [],
  );

  const commit = useCallback(
    (updater: (current: SharedState) => SharedState) => {
      setState((current) => {
        const next = updater(current);
        stateRef.current = next;
        return next;
      });
      markDirty();
      schedulePush();
    },
    [markDirty, schedulePush],
  );

  const getRecord = useCallback((jobId: string) => state.records[jobId], [state.records]);

  const setStatus = useCallback(
    (job: Job, status: JobStatus, extra: Partial<ApplicationRecord> = {}) => {
      commit((current) => {
        const previous = current.records[job.id];
        return {
          ...current,
          updatedAt: new Date().toISOString(),
          records: {
            ...current.records,
            [job.id]: buildRecord(previous, status, jobFromSnapshot(job), extra),
          },
        };
      });
    },
    [commit],
  );

  const updateRecord = useCallback(
    (job: Job | JobSnapshot, patch: Partial<ApplicationRecord>) => {
      commit((current) => {
        const previous = current.records[job.id];
        const nextStatus = patch.status ?? previous?.status ?? 'saved';
        const record: ApplicationRecord = {
          ...(previous ?? buildRecord(undefined, nextStatus, jobFromSnapshot(job))),
          ...patch,
          status: nextStatus,
          job: previous?.job ?? snapshotFromJob(jobFromSnapshot(job)),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...current,
          updatedAt: record.updatedAt,
          records: { ...current.records, [job.id]: record },
        };
      });
    },
    [commit],
  );

  const resetRecord = useCallback(
    (job: Job | JobSnapshot) => {
      commit((current) => {
        const previous = current.records[job.id];
        const record = buildRecord(previous, 'open', jobFromSnapshot(job));
        return {
          ...current,
          updatedAt: record.updatedAt,
          records: {
            ...current.records,
            [job.id]: { ...record, followUpAt: undefined, resumeVersion: undefined },
          },
        };
      });
    },
    [commit],
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      commit((current) => {
        const now = new Date().toISOString();
        return {
          ...current,
          updatedAt: now,
          profile: { ...current.profile, ...patch },
          profileUpdatedAt: now,
        };
      });
    },
    [commit],
  );

  const syncNow = useCallback(async () => {
    if (!configReady) {
      showToast({ message: 'Add a GitHub token and data repo in Settings first.', tone: 'error' });
      return;
    }
    const ok = await fullSync('manual');
    showToast({
      message: ok ? 'Synced with GitHub.' : (lastErrorRef.current ?? 'Sync failed.'),
      tone: ok ? 'success' : 'error',
    });
  }, [configReady, fullSync, showToast]);

  const value = useMemo<ApplicationsContextValue>(
    () => ({
      sharedState: state,
      hydrated,
      syncStatus: configReady ? syncStatus : 'off',
      syncError,
      lastSyncedAt,
      dirty,
      getRecord,
      setStatus,
      updateRecord,
      resetRecord,
      updateProfile,
      syncNow,
    }),
    [
      configReady,
      state,
      hydrated,
      syncStatus,
      syncError,
      lastSyncedAt,
      dirty,
      getRecord,
      setStatus,
      updateRecord,
      resetRecord,
      updateProfile,
      syncNow,
    ],
  );

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
}

export function useApplications(): ApplicationsContextValue {
  const value = useContext(ApplicationsContext);
  if (!value) throw new Error('useApplications must be used inside ApplicationsProvider');
  return value;
}
