import type { Job, Profile } from '@/types';

export function profileIsEmpty(profile: Profile): boolean {
  return !profile.name.trim() && !profile.email.trim() && !profile.resume.trim();
}

export function profileLinksText(profile: Profile): string {
  return profile.links
    .filter((link) => link.url.trim())
    .map((link) => `${link.label.trim() || 'Link'}: ${link.url.trim()}`)
    .join('\n');
}

/**
 * A plain-text block a user can paste into an application form. It deliberately
 * contains no cover letter; that lives in the job record so it can be edited.
 */
export function applicationPack(profile: Profile, job?: Job): string {
  const contact = [profile.email, profile.phone].map((part) => part.trim()).filter(Boolean);
  const lines = [
    profile.name.trim(),
    profile.headline.trim(),
    contact.join(' · '),
    profile.location.trim(),
    profileLinksText(profile),
  ];

  if (job) {
    lines.push('', `Applying for: ${job.title} at ${job.company}`, job.url);
  }

  return lines.filter(Boolean).join('\n');
}

const COMPLETENESS_FIELDS: (keyof Profile)[] = [
  'name',
  'email',
  'phone',
  'location',
  'headline',
  'years',
  'resume',
];

/** Rough 0-100 score used to nudge the user to finish their profile. */
export function profileCompleteness(profile: Profile): number {
  const filled = COMPLETENESS_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value === 'string' && value.trim().length > 0;
  }).length;
  const hasLink = profile.links.some((link) => link.url.trim());
  const total = COMPLETENESS_FIELDS.length + 1;
  return Math.round(((filled + (hasLink ? 1 : 0)) / total) * 100);
}
