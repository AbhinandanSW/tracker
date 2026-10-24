import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';

import { SyncBadge } from '@/components/sync-badge';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, icons } from '@/components/ui/icon';
import { Page, PageHeader, usePagePadding } from '@/components/ui/page';
import { SearchField } from '@/components/ui/search-field';
import { SectionCard } from '@/components/ui/section';
import { StatusPill, StatusSelector } from '@/components/ui/status';
import { Radius, Shadow, Spacing, StatusTone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJobActions } from '@/hooks/use-job-actions';
import { daysBetween, formatCount, formatDay, relativeTime, toDayKey } from '@/lib/format';
import { jobFromSnapshot, PIPELINE, statusLabel } from '@/lib/shared-state';
import { useApplications } from '@/providers/applications-provider';
import { useToast } from '@/providers/toast-provider';
import type { ApplicationRecord, Job, JobStatus } from '@/types';

type Stage = Exclude<JobStatus, 'open' | 'hidden'>;

type TrackerItem = {
  id: string;
  record: ApplicationRecord;
  job: Job;
};

const EMPTY_COUNTS: Record<Stage, number> = {
  saved: 0,
  applied: 0,
  interview: 0,
  offer: 0,
  rejected: 0,
};

export default function TrackerScreen() {
  const theme = useTheme();
  const padding = usePagePadding();
  const { sharedState, setStatus, resetRecord, syncStatus, dirty, syncNow } = useApplications();
  const { openPosting, copyPack } = useJobActions();
  const { showToast } = useToast();
  const [stage, setStage] = useState<'all' | Stage>('all');
  const [query, setQuery] = useState('');

  const items = useMemo<TrackerItem[]>(() => {
    return Object.entries(sharedState.records)
      .filter(([, record]) => record.status !== 'open' && record.status !== 'hidden')
      .map(([id, record]) => ({
        id,
        record,
        job: record.job
          ? jobFromSnapshot(record.job)
          : {
              id,
              title: id,
              company: 'Unknown company',
              location: '',
              url: '',
              source: '',
              day: '',
              first_seen: '',
              match: true,
              skills: [],
            },
      }))
      .sort((a, b) => b.record.updatedAt.localeCompare(a.record.updatedAt));
  }, [sharedState.records]);

  const counts = useMemo(() => {
    const next = { ...EMPTY_COUNTS };
    for (const item of items) {
      if (item.record.status !== 'open' && item.record.status !== 'hidden') {
        next[item.record.status] += 1;
      }
    }
    return next;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (stage !== 'all' && item.record.status !== stage) return false;
      if (!needle) return true;
      return [item.job.title, item.job.company, item.record.notes, item.job.location]
        .filter(Boolean)
        .some((field) => field?.toLowerCase().includes(needle));
    });
  }, [items, query, stage]);

  const sections = useMemo(() => {
    if (stage !== 'all') {
      return filtered.length
        ? [{ status: stage, title: StatusTone[stage].label, data: filtered }]
        : [];
    }
    return PIPELINE.map((entry) => ({
      status: entry.status,
      title: entry.label,
      data: filtered.filter((item) => item.record.status === entry.status),
    })).filter((section) => section.data.length > 0);
  }, [filtered, stage]);

  const due = useMemo(() => {
    const today = toDayKey();
    return items
      .filter(
        (item) =>
          item.record.followUpAt &&
          item.record.followUpAt <= today &&
          item.record.status !== 'rejected' &&
          item.record.status !== 'offer',
      )
      .sort((a, b) => (a.record.followUpAt ?? '').localeCompare(b.record.followUpAt ?? ''));
  }, [items]);

  const activeCount = items.length;

  const remove = (item: TrackerItem) => {
    resetRecord(item.job);
    showToast({
      message: 'Removed from your tracker.',
      actionLabel: 'Undo',
      onAction: () => setStatus(item.job, item.record.status),
    });
  };

  const move = (item: TrackerItem, next: JobStatus) => {
    if (next === 'open') {
      remove(item);
      return;
    }
    setStatus(item.job, next);
    showToast({ message: `Moved to ${statusLabel(next)}.`, tone: 'success' });
  };

  const header = (
    <View style={styles.header}>
      <PageHeader
        title="Tracker"
        subtitle={
          activeCount
            ? `${formatCount(activeCount)} active · ${formatCount(counts.interview)} in interview · ${formatCount(counts.offer)} offers`
            : 'Every application, one calm place'
        }
        right={
          <View style={styles.headerActions}>
            {Platform.OS === 'web' ? null : <SyncBadge />}
          </View>
        }
      />

      <PipelineOverview counts={counts} total={activeCount} />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Search company, role, notes…"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stats}>
        <StageTile
          label="All stages"
          count={items.length}
          color={theme.accent}
          active={stage === 'all'}
          onPress={() => setStage('all')}
        />
        {PIPELINE.map((entry) => (
          <StageTile
            key={entry.status}
            label={entry.label}
            count={counts[entry.status]}
            color={theme[StatusTone[entry.status].fg]}
            tint={theme[StatusTone[entry.status].bg]}
            active={stage === entry.status}
            onPress={() => setStage((current) => (current === entry.status ? 'all' : entry.status))}
          />
        ))}
      </ScrollView>

      {stage !== 'all' || query ? (
        <View style={styles.filterNote}>
          <ThemedText type="caption" themeColor="textTertiary">
            {formatCount(filtered.length)} shown
            {stage === 'all' ? '' : ` in ${StatusTone[stage].label}`}
          </ThemedText>
          <Chip
            label="Show all"
            compact
            selected={false}
            onPress={() => {
              setStage('all');
              setQuery('');
            }}
          />
        </View>
      ) : null}

      {dirty || syncStatus === 'error' ? (
        <ThemedText type="caption" themeColor="textTertiary">
          {syncStatus === 'error'
            ? 'Last sync failed. Tap the sync badge to retry; local changes are safe.'
            : 'Local changes are waiting to sync.'}
        </ThemedText>
      ) : null}

      {due.length ? (
        <SectionCard
          title={`${formatCount(due.length)} follow-up${due.length === 1 ? '' : 's'} due`}
          description="A short note goes a long way."
          icon={icons.calendar}
          style={{ borderColor: theme.warning }}>
          <View style={styles.dueList}>
            {due.slice(0, 4).map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({ pathname: '/job/[id]', params: { id: item.id } })
                }
                style={({ pressed }) => [styles.dueRow, pressed && { opacity: 0.7 }]}>
                <Icon name={icons.calendar} size={15} color={theme.warning} />
                <ThemedText type="small" style={{ flex: 1 }} numberOfLines={1}>
                  {item.job.title} · {item.job.company}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.warning }}>
                  {item.record.followUpAt
                    ? daysBetween(item.record.followUpAt) === 0
                      ? 'Today'
                      : `${daysBetween(item.record.followUpAt)}d late`
                    : ''}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </SectionCard>
      ) : null}
    </View>
  );

  return (
    <Page>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackedCard
            item={item}
            onOpen={() => router.push({ pathname: '/job/[id]', params: { id: item.id } })}
            onExternal={() => openPosting(item.job)}
            onCopy={() => copyPack(item.job)}
            onMove={(next) => move(item, next)}
            onRemove={() => remove(item)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionDot,
                { backgroundColor: theme[StatusTone[section.status].fg] },
              ]}
            />
            <ThemedText type="smallBold">{section.title}</ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
            <ThemedText type="caption" themeColor="textTertiary">
              {section.data.length}
            </ThemedText>
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          activeCount ? (
            <EmptyState
              icon={icons.search}
              title="No applications in this view"
              description="Try another stage or clear the search."
              action={
                <Button
                  variant="secondary"
                  label="Show all"
                  onPress={() => {
                    setStage('all');
                    setQuery('');
                  }}
                />
              }
            />
          ) : (
            <EmptyState
              icon={icons.tracker}
              title="Your pipeline is ready"
              description="Save a job from the feed, or use Quick apply. Every stage stays in sync across your devices."
              action={
                <Button
                  variant="primary"
                  label="Browse jobs"
                  onPress={() => router.replace('/')}
                  icon={<Icon name={icons.sparkles} size={15} color={theme.accentText} />}
                />
              }
            />
          )
        }
        contentContainerStyle={[
          styles.content,
          { paddingTop: padding.top, paddingBottom: padding.bottom },
        ]}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={syncStatus === 'syncing'}
            onRefresh={() => void syncNow()}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      />
    </Page>
  );
}

function PipelineOverview({
  counts,
  total,
}: {
  counts: Record<Stage, number>;
  total: number;
}) {
  const theme = useTheme();
  const stages = PIPELINE.map((entry) => ({
    ...entry,
    count: counts[entry.status],
    color: theme[StatusTone[entry.status].fg],
  })).filter((entry) => entry.count > 0);

  return (
    <View style={[styles.overview, Shadow.card]}>
      <LinearGradient
        colors={[theme.heroStart, theme.heroEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.overviewOrb} />
      <View style={styles.overviewTop}>
        <View style={styles.overviewText}>
          <ThemedText style={[styles.overviewEyebrow, { color: theme.heroMuted }]}>
            Your pipeline
          </ThemedText>
          <ThemedText style={[styles.overviewValue, { color: theme.heroText }]}>
            {total ? formatCount(total) : 'Ready'}
          </ThemedText>
          <ThemedText style={[styles.overviewLabel, { color: theme.heroMuted }]}>
            {total
              ? `${total === 1 ? 'application' : 'applications'} in play`
              : 'Save or apply to start tracking'}
          </ThemedText>
        </View>
        <View style={[styles.overviewIcon, { borderColor: theme.heroBorder, backgroundColor: theme.heroChip }]}>
          <Icon name={icons.trackerSelected} size={22} color={theme.heroText} />
        </View>
      </View>

      <View style={[styles.bar, { backgroundColor: theme.heroChip }]}>
        {stages.length ? (
          stages.map((entry) => (
            <View
              key={entry.status}
              style={{ flex: entry.count, backgroundColor: entry.color, height: '100%' }}
            />
          ))
        ) : null}
      </View>

      <View style={styles.legend}>
        {PIPELINE.map((entry) => (
          <View key={entry.status} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme[StatusTone[entry.status].fg] }]}
            />
            <ThemedText style={[styles.legendLabel, { color: theme.heroMuted }]}>
              {entry.label}
            </ThemedText>
            <ThemedText style={[styles.legendValue, { color: theme.heroText }]}>
              {counts[entry.status]}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function StageTile({
  label,
  count,
  color,
  tint,
  active,
  onPress,
}: {
  label: string;
  count: number;
  color: string;
  tint?: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stat,
        {
          backgroundColor: active ? (tint ?? theme.accentSoft) : theme.surface,
          borderColor: active ? color : theme.border,
        },
        pressed && { opacity: 0.75 },
      ]}>
      <View style={styles.statTop}>
        <View style={[styles.statDot, { backgroundColor: color }]} />
        <ThemedText type="caption" themeColor="textTertiary" numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="heading" style={[styles.statCount, { color: active ? color : theme.text }]}>
        {count}
      </ThemedText>
    </Pressable>
  );
}

function TrackedCard({
  item,
  onOpen,
  onExternal,
  onCopy,
  onMove,
  onRemove,
}: {
  item: TrackerItem;
  onOpen: () => void;
  onExternal: () => void;
  onCopy: () => void;
  onMove: (status: JobStatus) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const { record, job } = item;
  const tone = StatusTone[record.status as Exclude<JobStatus, 'open'>];
  const overdue =
    record.followUpAt &&
    record.followUpAt <= toDayKey() &&
    record.status !== 'rejected' &&
    record.status !== 'offer';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        Shadow.card,
      ]}>
      <View style={[styles.cardEdge, { backgroundColor: theme[tone.fg] }]} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityHint="Opens the job details"
        style={({ pressed }) => [styles.cardTop, pressed && { opacity: 0.75 }]}>
        <Avatar name={job.company} size={44} />
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <ThemedText type="smallBold" numberOfLines={1} style={{ flex: 1 }}>
              {job.title}
            </ThemedText>
            <StatusPill status={record.status as Exclude<JobStatus, 'open'>} />
          </View>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {job.company}
            {job.location ? ` · ${job.location}` : ''}
          </ThemedText>
          <View style={styles.cardMeta}>
            <Icon name={icons.clock} size={12} color={theme.textTertiary} />
            <ThemedText type="caption" themeColor="textTertiary">
              Updated {relativeTime(record.updatedAt)}
            </ThemedText>
            {record.followUpAt ? (
              <Badge
                label={`Follow up ${formatDay(record.followUpAt)}`}
                fg={overdue ? 'warning' : 'textSecondary'}
                bg={overdue ? 'warningSoft' : 'surfaceAlt'}
              />
            ) : null}
          </View>
        </View>
      </Pressable>

      {record.notes ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.notes}>
          {record.notes}
        </ThemedText>
      ) : null}

      <StatusSelector value={record.status} onChange={onMove} />

      <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
        <Button
          size="sm"
          variant="secondary"
          label="Open"
          onPress={onExternal}
          disabled={!job.url}
          icon={<Icon name={icons.external} size={14} color={theme.text} />}
        />
        <Button
          size="sm"
          variant="ghost"
          label="Copy details"
          onPress={onCopy}
          icon={<Icon name={icons.copy} size={14} color={theme.textSecondary} />}
        />
        <Button
          size="sm"
          variant="ghost"
          label="Details"
          onPress={onOpen}
          iconRight={<Icon name={icons.chevronRight} size={14} color={theme.textTertiary} />}
        />
        <Button
          size="sm"
          variant="ghost"
          onPress={onRemove}
          accessibilityLabel="Remove from tracker"
          icon={<Icon name={icons.trash} size={14} color={theme.danger} />}
          style={styles.remove}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.four,
    marginBottom: Spacing.two,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  overview: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  overviewOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -60,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  overviewText: {
    gap: 1,
  },
  overviewEyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  overviewValue: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  overviewLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  overviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  legendLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
  stat: {
    width: 118,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statCount: {
    fontSize: 22,
    lineHeight: 27,
  },
  filterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  cardEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  cardTop: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  cardBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  notes: {
    paddingLeft: 56,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  remove: {
    marginLeft: 'auto',
  },
  dueList: {
    gap: Spacing.two,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
