import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon, icons } from '@/components/ui/icon';
import { StatusPill } from '@/components/ui/status';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJobActions } from '@/hooks/use-job-actions';
import { isNewJob, relativeTime } from '@/lib/format';
import { isRemote } from '@/lib/job-filter';
import type { ApplicationRecord, Job } from '@/types';

const ACTIVE_STATUSES = new Set(['applied', 'interview', 'offer', 'rejected']);

export function JobCard({ job, record }: { job: Job; record?: ApplicationRecord }) {
  const theme = useTheme();
  const { quickApply, toggleSaved, toggleHidden, openPosting } = useJobActions();
  const [hovered, setHovered] = useState(false);

  const saved = record?.status === 'saved';
  const hidden = record?.status === 'hidden';
  const applied = record ? ACTIVE_STATUSES.has(record.status) : false;
  const newJob = isNewJob(job.first_seen);
  const skills = (job.skills ?? []).slice(0, 4);
  const posted = relativeTime(job.first_seen);

  const open = () => {
    router.push({ pathname: '/job/[id]', params: { id: job.id } });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: hovered ? theme.accent : theme.border,
        },
        hovered ? Shadow.lifted : Shadow.card,
      ]}>
      {job.match ? (
        <LinearGradient
          colors={[theme.accent, theme.accentStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.stripe}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens the job details"
        onPress={open}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.78 }]}>
        <Avatar name={job.company} size={48} />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <ThemedText type="heading" numberOfLines={2} style={styles.title}>
                {job.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {job.company}
              </ThemedText>
            </View>
            {record && record.status !== 'open' ? (
              <StatusPill status={record.status} />
            ) : newJob ? (
              <Badge label="New" fg="sun" bg="sunSoft" />
            ) : job.match ? (
              <Badge label="Match" fg="accent" bg="accentSoft" />
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {job.location ? (
              <View style={styles.meta}>
                <Icon name={icons.location} size={13} color={theme.textTertiary} />
                <ThemedText type="caption" themeColor="textTertiary" numberOfLines={1}>
                  {job.location}
                </ThemedText>
              </View>
            ) : null}
            {job.exp ? (
              <Badge label={job.exp} fg="textSecondary" bg="surfaceAlt" />
            ) : null}
            {isRemote(job) ? <Badge label="Remote" fg="accent" bg="accentSoft" /> : null}
            {job.gone ? <Badge label="Closed" fg="danger" bg="dangerSoft" /> : null}
          </View>

          {skills.length ? (
            <View style={styles.skills}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={[
                    styles.skill,
                    { backgroundColor: theme.accentWash, borderColor: theme.accentSoft },
                  ]}>
                  <ThemedText type="caption" style={{ color: theme.accent }}>
                    {skill}
                  </ThemedText>
                </View>
              ))}
              {(job.skills?.length ?? 0) > skills.length ? (
                <ThemedText type="caption" themeColor="textTertiary">
                  +{(job.skills?.length ?? 0) - skills.length}
                </ThemedText>
              ) : null}
            </View>
          ) : job.why ? (
            <ThemedText type="caption" themeColor="textTertiary" numberOfLines={2}>
              {job.why}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.sourceRow}>
          <View style={[styles.sourceDot, { backgroundColor: theme.borderStrong }]} />
          <ThemedText type="caption" themeColor="textTertiary" style={styles.source} numberOfLines={1}>
            {job.source}
            {posted ? ` · ${posted}` : ''}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Button
            size="sm"
            variant={saved ? 'subtle' : 'secondary'}
            onPress={() => toggleSaved(job)}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save job'}
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
            variant={applied ? 'success' : 'primary'}
            onPress={() => (applied ? openPosting(job) : quickApply(job))}
            icon={
              <Icon
                name={applied ? icons.checkCircle : icons.sparkles}
                size={15}
                color={applied ? theme.success : theme.accentText}
              />
            }
            label={applied ? 'Applied' : 'Quick apply'}
          />
          <Button
            size="sm"
            variant="ghost"
            onPress={() => openPosting(job)}
            accessibilityLabel="Open posting"
            icon={<Icon name={icons.external} size={16} color={theme.textSecondary} />}
          />
          <Button
            size="sm"
            variant="ghost"
            onPress={() => toggleHidden(job)}
            accessibilityLabel={hidden ? 'Restore job' : 'Hide job'}
            icon={
              <Icon
                name={hidden ? icons.eye : icons.eyeOff}
                size={16}
                color={hidden ? theme.accent : theme.textSecondary}
              />
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  stripe: {
    height: 3,
  },
  main: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  body: {
    flex: 1,
    gap: Spacing.two,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titleText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 16.5,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: '70%',
  },
  skills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  skill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    flexWrap: 'wrap',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  sourceDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  source: {
    flexShrink: 1,
    maxWidth: 200,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
});
