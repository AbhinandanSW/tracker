import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AiWriter } from '@/components/ai-writer';
import { SyncBadge } from '@/components/sync-badge';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon, icons } from '@/components/ui/icon';
import { Page, PageScroll } from '@/components/ui/page';
import { SectionCard } from '@/components/ui/section';
import { StatusPill, StatusSelector } from '@/components/ui/status';
import { Radius, Spacing, StatusTone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJobActions } from '@/hooks/use-job-actions';
import { addDays, dayLabel, formatDateTime, relativeTime, toDayKey } from '@/lib/format';
import { isRemote } from '@/lib/job-filter';
import { jobFromSnapshot, statusLabel } from '@/lib/shared-state';
import { useApplications } from '@/providers/applications-provider';
import { useJobs } from '@/providers/jobs-provider';
import { useToast } from '@/providers/toast-provider';
import type { Job } from '@/types';

export default function JobDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { jobs, hydrated } = useJobs();
  const { getRecord, setStatus, resetRecord, sharedState } = useApplications();
  const { quickApply, toggleSaved, toggleHidden, openPosting, copyPack } = useJobActions();
  const { showToast } = useToast();

  const record = id ? getRecord(id) : undefined;

  const live = jobs.find((item) => item.id === id);
  const job: Job | null = live ?? (record?.job ? jobFromSnapshot(record.job) : null);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!hydrated) {
    return (
      <Page>
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </Page>
    );
  }

  if (!job) {
    return (
      <Page>
        <PageScroll>
          <BackRow onPress={back} />
          <EmptyState
            icon={icons.search}
            title="This opening is no longer available"
            description="It has left the feed and there is no saved snapshot for it on this device."
            action={<Button variant="primary" label="Back to jobs" onPress={back} />}
          />
        </PageScroll>
      </Page>
    );
  }

  const status = record?.status ?? 'open';
  const saved = status === 'saved';
  const hidden = status === 'hidden';
  const active = status !== 'open';

  const remove = () => {
    const previous = status;
    resetRecord(job);
    showToast({
      message: 'Removed from your tracker.',
      actionLabel: previous === 'open' ? undefined : 'Undo',
      onAction: previous === 'open' ? undefined : () => setStatus(job, previous),
    });
  };

  return (
    <Page>
      <PageScroll>
        <View style={styles.topRow}>
          <BackRow onPress={back} />
          <SyncBadge compact />
        </View>

        <View
          style={[
            styles.hero,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <LinearGradient
            colors={[theme.accent, theme.accentStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroStripe}
          />
          <View style={styles.heroTop}>
            <Avatar name={job.company} size={58} />
            <View style={styles.heroText}>
              <ThemedText type="subtitle" style={styles.title}>
                {job.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {job.company}
              </ThemedText>
              <View style={styles.badges}>
                {record && record.status !== 'open' ? (
                  <StatusPill status={record.status} />
                ) : null}
                {isRemote(job) ? <Badge label="Remote" fg="accent" bg="accentSoft" /> : null}
                {job.gone ? <Badge label="Closed" fg="danger" bg="dangerSoft" /> : null}
                {!job.match ? <Badge label="General feed" fg="purple" bg="purpleSoft" /> : null}
              </View>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <Meta icon={icons.location} label="Location" value={job.location || 'Not listed'} />
            <Meta icon={icons.jobs} label="Experience" value={job.exp || 'Not listed'} />
            <Meta icon={icons.calendar} label="Posted" value={dayLabel(job.first_seen)} />
            <Meta icon={icons.building} label="Source" value={job.source} />
          </View>

          <View style={styles.actions}>
            <Button
              size="lg"
              variant="primary"
              onPress={() => quickApply(job)}
              icon={<Icon name={icons.external} size={16} color={theme.accentText} />}
              label="Quick apply"
            />
            <Button
              size="lg"
              variant="secondary"
              onPress={() => openPosting(job)}
              label="Open posting"
            />
            <Button
              size="lg"
              variant={saved ? 'subtle' : 'secondary'}
              onPress={() => toggleSaved(job)}
              icon={
                <Icon
                  name={saved ? icons.bookmarkFilled : icons.bookmark}
                  size={16}
                  color={saved ? theme.text : theme.textSecondary}
                />
              }
              label={saved ? 'Saved' : 'Save'}
            />
            <Button
              size="lg"
              variant="ghost"
              onPress={() => toggleHidden(job)}
              icon={
                <Icon
                  name={hidden ? icons.eye : icons.eyeOff}
                  size={17}
                  color={theme.textSecondary}
                />
              }
              label={hidden ? 'Restore' : 'Hide'}
            />
            <Button
              size="lg"
              variant="ghost"
              onPress={() => copyPack(job)}
              icon={<Icon name={icons.copy} size={16} color={theme.textSecondary} />}
              label="Copy details"
            />
          </View>
        </View>

        <SectionCard
          title="Application"
          description="Status changes sync to your private data repo and every device."
          icon={icons.target}
          right={record ? <ThemedText type="caption" themeColor="textTertiary">{`Updated ${relativeTime(record.updatedAt)}`}</ThemedText> : null}>
          <StatusSelector
            value={status}
            includeHidden
            onChange={(next) => {
              if (next === 'open') {
                remove();
              } else {
                setStatus(job, next);
                showToast({
                  message: `Moved to ${statusLabel(next)}.`,
                  tone: next === 'rejected' ? 'default' : 'success',
                });
              }
            }}
          />

          {record ? (
            <View style={styles.facts}>
              {record.savedAt ? (
                <ThemedText type="caption" themeColor="textTertiary">
                  Saved {relativeTime(record.savedAt)}
                </ThemedText>
              ) : null}
              {record.appliedAt ? (
                <ThemedText type="caption" themeColor="textTertiary">
                  Applied {relativeTime(record.appliedAt)}
                </ThemedText>
              ) : null}
              {record.followUpAt ? (
                <ThemedText type="caption" themeColor="textTertiary">
                  Follow up {dayLabel(record.followUpAt)}
                </ThemedText>
              ) : null}
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Nothing tracked yet. Save it, mark it applied, or use quick apply to do both at once.
            </ThemedText>
          )}

          <NotesEditor key={job.id} job={job} notes={record?.notes} />
          <FollowUpEditor key={job.id} job={job} value={record?.followUpAt} />
          {active ? (
            <View style={styles.dangerRow}>
              <Button
                size="sm"
                variant="danger"
                label="Remove from tracker"
                onPress={remove}
                icon={<Icon name={icons.trash} size={15} color={theme.danger} />}
              />
            </View>
          ) : null}
        </SectionCard>

        <AiWriter key={job.id} job={job} record={record} />

        {job.skills?.length ? (
          <SectionCard title="Skills in the posting" icon={icons.list}>
            <View style={styles.skills}>
              {job.skills.map((skill) => (
                <View
                  key={skill}
                  style={[styles.skill, { backgroundColor: theme.surfaceAlt }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {skill}
                  </ThemedText>
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}

        {job.why ? (
          <SectionCard title="Why this did not match your filters" icon={icons.info}>
            <ThemedText type="small" themeColor="textSecondary">
              {job.why}
            </ThemedText>
          </SectionCard>
        ) : null}

        {record?.timeline?.length ? (
          <SectionCard title="Timeline" icon={icons.clock}>
            <View style={styles.timeline}>
              {[...record.timeline].reverse().map((entry, index) => (
                <View key={`${entry.status}-${entry.at}-${index}`} style={styles.timelineRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor:
                          entry.status === 'open'
                            ? theme.textTertiary
                            : theme[StatusTone[entry.status].fg],
                      },
                    ]}
                  />
                  <ThemedText type="small" style={{ flex: 1 }}>
                    {statusLabel(entry.status)}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textTertiary">
                    {formatDateTime(entry.at)}
                  </ThemedText>
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}

        <ThemedText type="caption" themeColor="textTertiary" style={styles.footer}>
          {sharedState.profile.name
            ? `Drafts and details use ${sharedState.profile.name}'s profile.`
            : 'Add your profile in Settings so quick apply can copy the right details.'}
        </ThemedText>
      </PageScroll>
    </Page>
  );
}

function BackRow({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}>
      <Icon name={icons.chevronLeft} size={17} color={theme.textSecondary} />
      <ThemedText type="smallBold" themeColor="textSecondary">
        All jobs
      </ThemedText>
    </Pressable>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: (typeof icons)[keyof typeof icons];
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.meta, { backgroundColor: theme.surfaceAlt }]}>
      <Icon name={icon} size={15} color={theme.textTertiary} />
      <View style={styles.metaText}>
        <ThemedText type="caption" themeColor="textTertiary">
          {label}
        </ThemedText>
        <ThemedText type="small" numberOfLines={2}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function NotesEditor({ job, notes }: { job: Job; notes?: string }) {
  const { updateRecord } = useApplications();
  const [draft, setDraft] = useState(notes ?? '');
  const savedNotes = useRef(notes ?? '');

  useEffect(() => {
    savedNotes.current = notes ?? '';
  }, [notes]);

  useEffect(() => {
    if (draft === savedNotes.current) return;
    const timer = setTimeout(() => {
      updateRecord(job, { notes: draft });
      savedNotes.current = draft;
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, job, updateRecord]);

  return (
    <Field
      label="Notes"
      description="Recruiter names, referral links, interview prep"
      value={draft}
      onChangeText={setDraft}
      placeholder="Anything you want to remember about this application."
      multiline
      inputStyle={styles.notesInput}
    />
  );
}

function FollowUpEditor({ job, value }: { job: Job; value?: string }) {
  const { updateRecord } = useApplications();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(value ?? '');

  const commit = (next: string) => {
    const clean = next.trim();
    if (!clean) {
      updateRecord(job, { followUpAt: undefined });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      showToast({ message: 'Use a date in YYYY-MM-DD format.', tone: 'error' });
      return;
    }
    updateRecord(job, { followUpAt: clean });
  };

  return (
    <View style={styles.followUp}>
      <Field
        label="Follow-up date"
        description="YYYY-MM-DD"
        value={draft}
        onChangeText={setDraft}
        onEndEditing={() => commit(draft)}
        placeholder="2026-11-02"
        containerStyle={styles.followUpField}
      />
      <Button
        size="sm"
        variant="secondary"
        label="+1 week"
        onPress={() => {
          const next = addDays(toDayKey(), 7);
          setDraft(next);
          commit(next);
        }}
        icon={<Icon name={icons.calendar} size={15} color={undefined} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.one,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
    overflow: 'hidden',
  },
  heroStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  heroTop: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  heroText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 130,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  metaText: {
    gap: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  notesInput: {
    minHeight: 110,
  },
  followUp: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  followUpField: {
    flex: 1,
  },
  dangerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  timeline: {
    gap: Spacing.two,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  footer: {
    textAlign: 'center',
    paddingTop: Spacing.two,
  },
});
