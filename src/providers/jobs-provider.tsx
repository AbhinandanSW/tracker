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

import { toDayKey } from '@/lib/format';
import { sortJobs } from '@/lib/job-filter';
import { othersUrlFrom } from '@/lib/settings';
import { StorageKeys, loadJson, saveJson } from '@/lib/storage';
import { useSettings } from '@/providers/settings-provider';
import type { Job, JobFeed, JobSearchLink } from '@/types';

type JobsStatus = 'idle' | 'loading' | 'refreshing' | 'error';

type JobsCache = {
  fetchedAt: string;
  updated: string | null;
  links: JobSearchLink[];
  jobs: Job[];
};

type JobsContextValue = {
  jobs: Job[];
  links: JobSearchLink[];
  updated: string | null;
  fetchedAt: string | null;
  status: JobsStatus;
  error: string | null;
  fromCache: boolean;
  hydrated: boolean;
  refresh: () => Promise<void>;
};

const JobsContext = createContext<JobsContextValue | null>(null);
const STALE_MS = 10 * 60 * 1000;

function normalizeFeed(feed: JobFeed | null, match: boolean, today: string): Job[] {
  if (!feed || !Array.isArray(feed.jobs)) return [];
  return feed.jobs
    .filter((job) => job && job.id && job.title)
    .map((job) => ({
      ...job,
      day: job.day || job.first_seen || today,
      first_seen: job.first_seen || job.day || today,
      skills: job.skills ?? [],
      match,
    }));
}

function mergeJobs(matched: Job[], general: Job[]): Job[] {
  const byId = new Map<string, Job>();
  for (const job of general) byId.set(job.id, job);
  for (const job of matched) byId.set(job.id, job);
  return sortJobs([...byId.values()]);
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Request failed (${response.status}).`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const { settings, hydrated: settingsHydrated } = useSettings();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [links, setLinks] = useState<JobSearchLink[]>([]);
  const [updated, setUpdated] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<JobsStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const inFlightRef = useRef(false);
  const lastUrlRef = useRef(settings.jobsUrl);
  const jobsRef = useRef<Job[]>([]);
  const cacheLoadedRef = useRef(false);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus(jobsRef.current.length ? 'refreshing' : 'loading');
    setError(null);

    const today = toDayKey();
    try {
      const matchedFeed = (await fetchJson(settings.jobsUrl)) as JobFeed;
      let generalFeed: JobFeed | null = null;
      try {
        generalFeed = (await fetchJson(othersUrlFrom(settings.jobsUrl))) as JobFeed;
      } catch {
        // The general feed is optional; a missing others.json should not block the main feed.
      }

      const matched = normalizeFeed(matchedFeed, true, today);
      const general = normalizeFeed(generalFeed, false, today);
      const nextJobs = mergeJobs(matched, general);
      const nextLinks = matchedFeed.links ?? [];
      const stamp = new Date().toISOString();
      const remoteUpdated = matchedFeed.updated ?? null;

      jobsRef.current = nextJobs;
      setJobs(nextJobs);
      setLinks(nextLinks);
      setUpdated(remoteUpdated);
      setFetchedAt(stamp);
      setFromCache(false);
      setStatus('idle');

      void saveJson(StorageKeys.jobsCache, {
        fetchedAt: stamp,
        updated: remoteUpdated,
        links: nextLinks,
        jobs: nextJobs,
      });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error && fetchError.name === 'AbortError'
          ? 'The job feed took too long to respond.'
          : fetchError instanceof Error
            ? fetchError.message
            : 'Could not load the job feed.';
      setError(message);
      setStatus('error');
      setFromCache(jobsRef.current.length > 0);
    } finally {
      inFlightRef.current = false;
    }
  }, [settings.jobsUrl]);

  // Restore the cached feed, then fetch if it is stale or missing.
  useEffect(() => {
    if (!settingsHydrated || cacheLoadedRef.current) return;
    cacheLoadedRef.current = true;
    let alive = true;
    loadJson<JobsCache | null>(StorageKeys.jobsCache, null).then((cache) => {
      if (!alive) return;
      const cacheIsFresh =
        cache?.fetchedAt && Date.now() - new Date(cache.fetchedAt).getTime() < STALE_MS;
      if (cache?.jobs?.length) {
        jobsRef.current = cache.jobs;
        setJobs(cache.jobs);
        setLinks(cache.links ?? []);
        setUpdated(cache.updated ?? null);
        setFetchedAt(cache.fetchedAt);
        setFromCache(true);
        setStatus(cacheIsFresh ? 'idle' : 'refreshing');
      }
      setHydrated(true);
      if (!cacheIsFresh) void refresh();
    });
    return () => {
      alive = false;
    };
    // refresh is stable for a given URL.
  }, [refresh, settingsHydrated]);

  // A changed feed URL should replace the cached feed.
  useEffect(() => {
    if (!settingsHydrated) return;
    if (lastUrlRef.current === settings.jobsUrl) return;
    lastUrlRef.current = settings.jobsUrl;
    jobsRef.current = [];
    setJobs([]);
    setLinks([]);
    setUpdated(null);
    setFetchedAt(null);
    setFromCache(false);
    void refresh();
  }, [refresh, settings.jobsUrl, settingsHydrated]);

  // Keep the feed reasonably fresh while the app stays open.
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - new Date(fetchedAt ?? 0).getTime() > STALE_MS) void refresh();
    }, 60_000);
    return () => clearInterval(timer);
  }, [fetchedAt, refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && Date.now() - new Date(fetchedAt ?? 0).getTime() > STALE_MS) {
        void refresh();
      }
    });
    return () => subscription.remove();
  }, [fetchedAt, refresh]);

  const value = useMemo<JobsContextValue>(
    () => ({
      jobs,
      links,
      updated,
      fetchedAt,
      status,
      error,
      fromCache,
      hydrated,
      refresh,
    }),
    [jobs, links, updated, fetchedAt, status, error, fromCache, hydrated, refresh],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): JobsContextValue {
  const value = useContext(JobsContext);
  if (!value) throw new Error('useJobs must be used inside JobsProvider');
  return value;
}
