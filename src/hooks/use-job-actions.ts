import { useCallback } from 'react';

import { copyText } from '@/lib/clipboard';
import { openExternal } from '@/lib/open-url';
import { applicationPack, profileIsEmpty } from '@/lib/profile';
import { useApplications } from '@/providers/applications-provider';
import { useToast } from '@/providers/toast-provider';
import type { Job, JobStatus } from '@/types';

/**
 * Shared job actions used by the feed, the detail screen and the tracker.
 * Quick apply opens the posting, records the application and copies the
 * candidate's contact block in one tap.
 */
export function useJobActions() {
  const { setStatus, resetRecord, getRecord, sharedState } = useApplications();
  const { showToast } = useToast();

  const undoTo = useCallback(
    (job: Job, previous: JobStatus | 'open') => {
      if (previous === 'open') resetRecord(job);
      else setStatus(job, previous);
    },
    [resetRecord, setStatus],
  );

  const quickApply = useCallback(
    (job: Job) => {
      const previous = getRecord(job.id)?.status ?? 'open';
      openExternal(job.url);
      setStatus(job, 'applied');

      const pack = profileIsEmpty(sharedState.profile)
        ? ''
        : applicationPack(sharedState.profile, job);
      void copyText(pack).then((copied) => {
        showToast({
          message: copied
            ? `Opened ${job.company}. Marked applied and copied your details.`
            : `Opened ${job.company} and marked it applied.`,
          tone: 'success',
          actionLabel: 'Undo',
          onAction: () => undoTo(job, previous),
        });
      });
    },
    [getRecord, setStatus, sharedState.profile, showToast, undoTo],
  );

  const markApplied = useCallback(
    (job: Job) => {
      const previous = getRecord(job.id)?.status ?? 'open';
      setStatus(job, 'applied');
      showToast({
        message: `Marked ${job.company} as applied.`,
        tone: 'success',
        actionLabel: 'Undo',
        onAction: () => undoTo(job, previous),
      });
    },
    [getRecord, setStatus, showToast, undoTo],
  );

  const toggleSaved = useCallback(
    (job: Job) => {
      const wasSaved = getRecord(job.id)?.status === 'saved';
      if (wasSaved) resetRecord(job);
      else setStatus(job, 'saved');
      showToast({
        message: wasSaved ? `Removed ${job.title} from saved.` : `Saved ${job.title}.`,
        actionLabel: 'Undo',
        onAction: () => undoTo(job, wasSaved ? 'saved' : 'open'),
      });
    },
    [getRecord, resetRecord, setStatus, showToast, undoTo],
  );

  const toggleHidden = useCallback(
    (job: Job) => {
      const wasHidden = getRecord(job.id)?.status === 'hidden';
      if (wasHidden) resetRecord(job);
      else setStatus(job, 'hidden');
      showToast({
        message: wasHidden ? 'Restored to the feed.' : 'Hidden from the feed.',
        actionLabel: 'Undo',
        onAction: () => undoTo(job, wasHidden ? 'hidden' : 'open'),
      });
    },
    [getRecord, resetRecord, setStatus, showToast, undoTo],
  );

  const openPosting = useCallback((job: Job) => {
    openExternal(job.url);
  }, []);

  const copyPack = useCallback(
    (job?: Job) => {
      if (profileIsEmpty(sharedState.profile)) {
        showToast({ message: 'Add your profile in Settings first.', tone: 'error' });
        return;
      }
      const pack = applicationPack(sharedState.profile, job);
      if (!pack.trim()) {
        showToast({ message: 'Add your profile in Settings first.', tone: 'error' });
        return;
      }
      void copyText(pack).then((copied) => {
        showToast({
          message: copied ? 'Application details copied.' : 'Could not access the clipboard.',
          tone: copied ? 'success' : 'error',
        });
      });
    },
    [sharedState.profile, showToast],
  );

  return {
    quickApply,
    markApplied,
    toggleSaved,
    toggleHidden,
    openPosting,
    copyPack,
  };
}
