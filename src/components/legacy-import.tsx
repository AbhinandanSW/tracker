import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { readLegacyStatuses, recordsFromLegacyStatuses } from '@/lib/legacy-tracker';
import { useApplications } from '@/providers/applications-provider';
import { useJobs } from '@/providers/jobs-provider';
import { useToast } from '@/providers/toast-provider';

/**
 * The old dashboard and this app share an origin on GitHub Pages. Move its
 * Saved / Applied / Hidden flags into the richer tracker once, automatically.
 * Vercel users can paste the JSON in Settings → Old dashboard.
 */
export function LegacyImport() {
  const {
    hydrated: applicationsHydrated,
    sharedState,
    importRecords,
  } = useApplications();
  const { hydrated: jobsHydrated, jobs, status: jobsStatus } = useJobs();
  const { showToast } = useToast();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current || !applicationsHydrated || !jobsHydrated) return;
    if (!jobs.length && (jobsStatus === 'loading' || jobsStatus === 'refreshing')) return;

    if (Platform.OS !== 'web') {
      attemptedRef.current = true;
      return;
    }

    const statuses = readLegacyStatuses();
    if (!statuses) {
      attemptedRef.current = true;
      return;
    }

    attemptedRef.current = true;
    const { records } = recordsFromLegacyStatuses(statuses, jobs, sharedState.records);
    const result = importRecords(records);

    if (result.imported) {
      showToast({
        message: `Imported ${result.imported} job${result.imported === 1 ? '' : 's'} from the old dashboard.`,
        tone: 'success',
      });
    }
  }, [
    applicationsHydrated,
    importRecords,
    jobs,
    jobsHydrated,
    jobsStatus,
    sharedState.records,
    showToast,
  ]);

  return null;
}
