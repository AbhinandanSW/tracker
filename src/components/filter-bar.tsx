import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon, icons, type IconName } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MODE_OPTIONS,
  REGION_OPTIONS,
  ROLE_OPTIONS,
  TABS,
  type JobFilters,
} from '@/lib/job-filter';
import type { TabKey } from '@/types';

const TAB_ICONS: Record<TabKey, IconName> = {
  'for-you': icons.sparkles,
  general: icons.jobs,
  saved: icons.bookmark,
  applied: icons.checkCircle,
  hidden: icons.eyeOff,
};

export function FilterBar({
  filters,
  counts,
  sources,
  activeFilters,
  onChange,
  onReset,
}: {
  filters: JobFilters;
  counts: Record<TabKey, number>;
  sources: string[];
  activeFilters: number;
  onChange: (patch: Partial<JobFilters>) => void;
  onReset: () => void;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrapper}>
      <SearchField
        value={filters.query}
        onChangeText={(query) => onChange({ query })}
        placeholder="Search roles, companies, skills…"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}>
        {TABS.map((tab) => (
          <Chip
            key={tab.key}
            label={tab.label}
            count={counts[tab.key]}
            selected={filters.tab === tab.key}
            onPress={() => onChange({ tab: tab.key })}
            icon={
              <Icon
                name={TAB_ICONS[tab.key]}
                size={13}
                color={filters.tab === tab.key ? theme.accentText : theme.textTertiary}
              />
            }
          />
        ))}
      </ScrollView>

      <View style={styles.toolRow}>
        <Button
          size="sm"
          variant={expanded || activeFilters ? 'subtle' : 'secondary'}
          onPress={() => setExpanded((current) => !current)}
          icon={<Icon name={icons.filter} size={15} color={theme.text} />}
          label={activeFilters ? `Filters · ${activeFilters}` : 'Filters'}
          iconRight={
            <Icon
              name={expanded ? icons.chevronDown : icons.chevronRight}
              size={14}
              color={theme.textTertiary}
            />
          }
        />
        <Chip
          label="New this week"
          compact
          selected={filters.newOnly}
          onPress={() => onChange({ newOnly: !filters.newOnly })}
          icon={
            <Icon
              name={icons.sun}
              size={13}
              color={filters.newOnly ? theme.accentText : theme.sun}
            />
          }
        />
        {activeFilters || filters.query ? (
          <Button
            size="sm"
            variant="ghost"
            label="Reset"
            onPress={() => {
              onReset();
              setExpanded(false);
            }}
          />
        ) : null}
      </View>

      {expanded ? (
        <View
          style={[
            styles.panel,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}>
          <FilterGroup
            label="Role"
            options={ROLE_OPTIONS}
            value={filters.role}
            onChange={(role) => onChange({ role: role as JobFilters['role'] })}
          />
          <FilterGroup
            label="Location"
            options={REGION_OPTIONS}
            value={filters.region}
            onChange={(region) => onChange({ region: region as JobFilters['region'] })}
          />
          <FilterGroup
            label="Mode"
            options={MODE_OPTIONS}
            value={filters.mode}
            onChange={(mode) => onChange({ mode: mode as JobFilters['mode'] })}
          />
          {sources.length > 1 ? (
            <FilterGroup
              label="Source"
              options={[
                { key: '', label: 'All sources' },
                ...sources.map((source) => ({ key: source, label: source })),
              ]}
              value={filters.source}
              onChange={(source) => onChange({ source })}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.group}>
      <ThemedText type="label" themeColor="textTertiary">
        {label}
      </ThemedText>
      <View style={styles.options}>
        {options.map((option) => (
          <Chip
            key={option.key || 'all'}
            label={option.label}
            compact
            selected={value === option.key}
            onPress={() => onChange(option.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  tabRow: {
    gap: 6,
    paddingRight: Spacing.two,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  panel: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  group: {
    gap: 6,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
