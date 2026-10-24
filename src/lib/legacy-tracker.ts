import { buildRecord } from '@/lib/shared-state';
import type { ApplicationRecord, Job, SharedState } from '@/types';

/** The old GitHub Pages dashboard stored its buttons under this key. */
export const LEGACY_STATUS_KEY = 'jobstatus:v1';

export type LegacyStatus = 'saved' | 'applied' | 'hidden';
export type LegacyStatuses = Record<string, LegacyStatus>;

function isLegacyStatus(value: unknown): value is LegacyStatus {
  return value === 'saved' || value === 'applied' || value === 'hidden';
}

/** Parse the JSON copied from localStorage["jobstatus:v1"]. */
export function parseLegacyStatuses(raw: string | null | undefined): LegacyStatuses | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const statuses: LegacyStatuses = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (id && isLegacyStatus(value)) statuses[id] = value;
    }
    return Object.keys(statuses).length ? statuses : null;
  } catch {
    return null;
  }
}

/** Read the old dashboard's choices when the app shares its origin. */
export function readLegacyStatuses(): LegacyStatuses | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseLegacyStatuses(window.localStorage.getItem(LEGACY_STATUS_KEY));
  } catch {
    return null;
  }
}

/**
 * Convert old saved/applied/hidden flags into the richer tracker records.
 * Existing records win, so a second import never overwrites newer work.
 */
export function recordsFromLegacyStatuses(
  statuses: LegacyStatuses,
  jobs: Job[],
  existing: SharedState['records'],
): { records: Record<string, ApplicationRecord>; imported: number; skipped: number } {
  const byId = new Map(jobs.map((job) => [job.id, job]));
  const records: Record<string, ApplicationRecord> = {};
  let imported = 0;
  let skipped = 0;

  for (const [id, status] of Object.entries(statuses)) {
    if (existing[id]) {
      skipped += 1;
      continue;
    }

    const job = byId.get(id);
    if (job) {
      records[id] = buildRecord(undefined, status, job, {
        notes: 'Imported from the old job_board dashboard.',
      });
    } else {
      // Keep the flag even when the opening has left the feed. The tracker
      // falls back to the id for a title until the job reappears.
      const now = new Date().toISOString();
      records[id] = {
        status,
        updatedAt: now,
        savedAt: status === 'saved' ? now : undefined,
        appliedAt: status === 'applied' ? now : undefined,
        timeline: [{ status, at: now }],
        notes: 'Imported from the old job_board dashboard. The original opening is no longer in the feed.',
      };
    }
    imported += 1;
  }

  return { records, imported, skipped };
}
