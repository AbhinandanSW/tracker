import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';

import { FilterBar } from '@/components/filter-bar';
import { JobCard } from '@/components/job-card';
import { SyncBadge } from '@/components/sync-badge';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, icons } from '@/components/ui/icon';
import { Page, usePagePadding } from '@/components/ui/page';
import { SectionCard } from '@/components/ui/section';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJobActions } from '@/hooks/use-job-actions';
import {
  DEFAULT_FILTERS,
  countByTab,
  filterJobs,
  groupJobsByDay,
  isRemote,
  sortJobs,
  sourcesOf,
  type JobFilters,
} from '@/lib/job-filter';
import { dayLabel, formatCount, isNewJob, relativeTime, toDayKey } from '@/lib/format';
import { useApplications } from '@/providers/applications-provider';
import { useJobs } from '@/providers/jobs-provider';
import type { ApplicationRecord, Job } from '@/types';

export default function JobsScreen() {
  const theme = useTheme();
  const padding = usePagePadding();
  const { jobs, status, error, updated, fromCache, hydrated, refresh } = useJobs();
  const { sharedState } = useApplications();
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);

  const filtered = useMemo(
    () => sortJobs(filterJobs(jobs, sharedState.records, filters)),
    [jobs, sharedState.records, filters],
  );
  const counts = useMemo(
    () => countByTab(jobs, sharedState.records, filters),
    [jobs, sharedState.records, filters],
  );
  const sources = useMemo(() => sourcesOf(jobs), [jobs]);
  const newThisWeek = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.match &&
          !job.gone &&
          !sharedState.records[job.id] &&
          isNewJob(job.first_seen, 7),
      ).length,
    [jobs, sharedState.records],
  );

  const tracked = useMemo(
    () =>
      Object.values(sharedState.records).filter(
        (record) => record.status !== 'open' && record.status !== 'hidden',
      ),
    [sharedState.records],
  );
  const due = useMemo(() => {
    const today = toDayKey();
    return tracked.filter(
      (record) =>
        record.followUpAt &&
        record.followUpAt <= today &&
        record.status !== 'rejected' &&
        record.status !== 'offer',
    ).length;
  }, [tracked]);

  const showSpotlight = filters.tab === 'for-you' && !filters.query && filtered.length > 2;
  const spotlight = showSpotlight ? filtered[0] : undefined;
  const feedJobs = useMemo(
    () => (spotlight ? filtered.filter((job) => job.id !== spotlight.id) : filtered),
    [filtered, spotlight],
  );

  const sections = useMemo(
    () =>
      groupJobsByDay(feedJobs).map((group) => ({
        day: group.day,
        title: dayLabel(group.day),
        data: group.jobs,
      })),
    [feedJobs],
  );

  const activeFilters = [
    filters.role !== 'all',
    filters.region !== 'all',
    filters.mode !== 'all',
    Boolean(filters.source),
    filters.newOnly,
  ].filter(Boolean).length;

  const patch = (next: Partial<JobFilters>) =>
    setFilters((current) => ({ ...current, ...next }));

  const reset = () => setFilters({ ...DEFAULT_FILTERS, tab: filters.tab });

  const loading = !hydrated || (status === 'loading' && !jobs.length);

  const header = (
    <View style={styles.header}>
      <View style={[styles.hero, Shadow.card]}>
        <LinearGradient
          colors={[theme.heroStart, theme.heroEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[styles.orb, styles.orbLarge]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbSmall]} />

        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <ThemedText style={[styles.heroDate, { color: theme.heroMuted }]}>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </ThemedText>
            <ThemedText style={[styles.heroTitle, { color: theme.heroText }]}>
              {greeting()}
              {sharedState.profile.name
                ? `, ${sharedState.profile.name.trim().split(/\s+/)[0]}`
                : ''}
            </ThemedText>
            <ThemedText style={[styles.heroSubtitle, { color: theme.heroMuted }]}>
              {jobs.length
                ? `${formatCount(counts['for-you'])} roles picked for you from ${formatCount(jobs.length)} live openings.`
                : 'Your next role is a refresh away.'}
            </ThemedText>
          </View>

          <View style={styles.headerActions}>
            {Platform.OS === 'web' ? null : <SyncBadge compact />}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh jobs"
              onPress={() => void refresh()}
              style={({ pressed }) => [
                styles.refresh,
                { borderColor: theme.heroBorder, backgroundColor: theme.heroChip },
                pressed && { opacity: 0.65 },
              ]}>
              {status === 'refreshing' ? (
                <ActivityIndicator size="small" color={theme.heroText} />
              ) : (
                <Icon name={icons.refresh} size={16} color={theme.heroText} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.stats}>
          <HeroStat label="For you" value={counts['for-you']} />
          <HeroStat label="New this week" value={newThisWeek} />
          <HeroStat
            label="Tracked"
            value={tracked.length}
            onPress={() => router.push('/tracker')}
          />
          <HeroStat
            label={due ? 'Follow-ups due' : 'Follow-ups'}
            value={due}
            tone={due ? 'warm' : 'plain'}
            onPress={() => router.push('/tracker')}
          />
        </View>

        {updated ? (
          <ThemedText style={[styles.heroMeta, { color: theme.heroMuted }]}>
            Feed checked {relativeTime(updated)}
            {fromCache ? ' · showing a cached copy' : ''}
          </ThemedText>
        ) : null}
      </View>

      <FilterBar
        filters={filters}
        counts={counts}
        sources={sources}
        activeFilters={activeFilters}
        onChange={patch}
        onReset={reset}
      />

      {error ? (
        <SectionCard
          title="The feed could not refresh"
          description={fromCache ? 'You are looking at a cached copy.' : undefined}
          icon={icons.cloudOff}
          style={{ borderColor: theme.warning }}>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
          <Button
            size="sm"
            variant="secondary"
            label="Try again"
            onPress={() => void refresh()}
            icon={<Icon name={icons.refresh} size={15} color={theme.text} />}
          />
        </SectionCard>
      ) : null}

      {spotlight ? (
        <SpotlightCard job={spotlight} record={sharedState.records[spotlight.id]} />
      ) : null}
    </View>
  );

  return (
    <Page>
      <SectionList
        sections={sections}
        keyExtractor={(item: Job) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} record={sharedState.records[item.id]} />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <ThemedText type="label" themeColor="textTertiary">
              {section.title}
            </ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
            <View style={[styles.sectionCount, { backgroundColor: theme.surfaceAlt }]}>
              <ThemedText type="caption" themeColor="textTertiary">
                {section.data.length}
              </ThemedText>
            </View>
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              {[0, 1, 2].map((key) => (
                <SkeletonCard key={key} />
              ))}
              <View style={styles.loadingLabel}>
                <ActivityIndicator color={theme.accent} />
                <ThemedText type="small" themeColor="textSecondary">
                  Loading openings…
                </ThemedText>
              </View>
            </View>
          ) : error && !jobs.length ? (
            <EmptyState
              icon={icons.cloudOff}
              title="No connection, no cache"
              description="The job feed lives on GitHub Pages. Check your connection and try again."
              action={
                <Button
                  variant="primary"
                  label="Retry"
                  onPress={() => void refresh()}
                  icon={<Icon name={icons.refresh} size={15} color={theme.accentText} />}
                />
              }
            />
          ) : (
            <EmptyState
              icon={jobs.length ? icons.search : icons.jobs}
              title={jobs.length ? 'Nothing matches those filters' : 'No openings yet'}
              description={
                jobs.length
                  ? 'Try clearing the search or widening the role, location and mode filters.'
                  : 'The next scheduled scrape will add openings here. You can also refresh the feed.'
              }
              action={
                jobs.length ? (
                  <Button variant="secondary" label="Clear filters" onPress={reset} />
                ) : (
                  <Button
                    variant="primary"
                    label="Refresh feed"
                    onPress={() => void refresh()}
                    icon={<Icon name={icons.refresh} size={15} color={theme.accentText} />}
                  />
                )
              }
            />
          )
        }
        ListFooterComponent={
          jobs.length ? (
            <ThemedText type="caption" themeColor="textTertiary" style={styles.footer}>
              {fromCache
                ? 'Showing a cached feed. It refreshes automatically when you are online.'
                : 'Live from GitHub Pages. Pull down or tap refresh to check for new openings.'}
            </ThemedText>
          ) : undefined
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: padding.top,
            paddingBottom: padding.bottom,
          },
        ]}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={status === 'refreshing'}
            onRefresh={() => void refresh()}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      />
    </Page>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function HeroStat({
  label,
  value,
  tone = 'plain',
  onPress,
}: {
  label: string;
  value: number;
  tone?: 'plain' | 'warm';
  onPress?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <>
      <ThemedText
        style={[
          styles.statValue,
          { color: tone === 'warm' && value ? theme.sun : theme.heroText },
        ]}>
        {formatCount(value)}
      </ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.heroMuted }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.stat, { backgroundColor: theme.heroChip }]}>{content}</View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.stat,
        { backgroundColor: theme.heroChip },
        pressed && { opacity: 0.66 },
      ]}>
      {content}
    </Pressable>
  );
}

function SpotlightCard({ job, record }: { job: Job; record?: ApplicationRecord }) {
  const theme = useTheme();
  const { quickApply, openPosting, toggleSaved } = useJobActions();
  const saved = record?.status === 'saved';
  const skills = (job.skills ?? []).slice(0, 5);

  return (
    <View style={[styles.spotlightWrap, Shadow.card]}>
      <LinearGradient
        colors={[theme.accentSoft, theme.purpleSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.spotlight, { borderColor: theme.accentSoft }]}>
        <View style={styles.spotlightHeader}>
          <View style={styles.spotlightLabel}>
            <Icon name={icons.sparkles} size={14} color={theme.accent} />
            <ThemedText type="label" style={{ color: theme.accent }}>
              Top pick for you
            </ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textTertiary">
            {dayLabel(job.first_seen)}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityHint="Opens the job details"
          onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
          style={({ pressed }) => [styles.spotlightMain, pressed && { opacity: 0.78 }]}>
          <Avatar name={job.company} size={54} />
          <View style={styles.spotlightText}>
            <ThemedText type="heading" numberOfLines={2} style={styles.spotlightTitle}>
              {job.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {job.company}
              {job.location ? ` · ${job.location}` : ''}
            </ThemedText>
            <View style={styles.metaRow}>
              {job.exp ? <Badge label={job.exp} fg="textSecondary" bg="surface" /> : null}
              {isRemote(job) ? <Badge label="Remote" fg="accent" bg="surface" /> : null}
              {isNewJob(job.first_seen) ? <Badge label="New" fg="sun" bg="surface" /> : null}
            </View>
          </View>
        </Pressable>

        {skills.length ? (
          <View style={styles.skills}>
            {skills.map((skill) => (
              <View
                key={skill}
                style={[styles.skill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ThemedText type="caption" themeColor="textSecondary">
                  {skill}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.spotlightActions}>
          <Button
            size="sm"
            variant="primary"
            label="Quick apply"
            onPress={() => quickApply(job)}
            icon={<Icon name={icons.sparkles} size={15} color={theme.accentText} />}
          />
          <Button
            size="sm"
            variant="secondary"
            label="View role"
            onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
          />
          <Button
            size="sm"
            variant={saved ? 'subtle' : 'secondary'}
            onPress={() => toggleSaved(job)}
            icon={
              <Icon
                name={saved ? icons.bookmarkFilled : icons.bookmark}
                size={15}
                color={saved ? theme.text : theme.textSecondary}
              />
            }
            label={saved ? 'Saved' : 'Save'}
          />
          <Button
            size="sm"
            variant="ghost"
            onPress={() => openPosting(job)}
            accessibilityLabel="Open posting"
            icon={<Icon name={icons.external} size={16} color={theme.textSecondary} />}
          />
        </View>
      </View>
    </View>
  );
}

function SkeletonCard() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.skeleton,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={[styles.skeletonAvatar, { backgroundColor: theme.surfaceAlt }]} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '62%', backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonLine, { width: '34%', backgroundColor: theme.surfaceAlt }]} />
        <View style={[styles.skeletonLine, { width: '78%', backgroundColor: theme.surfaceAlt }]} />
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
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  orbLarge: {
    width: 320,
    height: 320,
    top: -150,
    right: -90,
  },
  orbSmall: {
    width: 140,
    height: 140,
    bottom: -70,
    right: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  heroText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  heroDate: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    maxWidth: 520,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  refresh: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 100,
    minWidth: 96,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 1,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  heroMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.one,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  sectionCount: {
    minWidth: 26,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    gap: Spacing.three,
  },
  loadingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  footer: {
    textAlign: 'center',
    paddingTop: Spacing.four,
  },
  spotlightWrap: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  spotlight: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  spotlightLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spotlightMain: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  spotlightText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  spotlightTitle: {
    fontSize: 19,
    lineHeight: 25,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  spotlightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  skeleton: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
  },
  skeletonBody: {
    flex: 1,
    gap: Spacing.two,
    paddingTop: 4,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 999,
  },
});
