import Constants from 'expo-constants';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { SyncBadge } from '@/components/sync-badge';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/field';
import { Icon, icons } from '@/components/ui/icon';
import { Page, PageHeader, PageScroll } from '@/components/ui/page';
import { CollapsibleSection } from '@/components/ui/section';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { testAiConnection } from '@/lib/ai';
import { checkRepo, dispatchWorkflow, repoUrl } from '@/lib/github';
import { formatDateTime, relativeTime } from '@/lib/format';
import { openExternal } from '@/lib/open-url';
import { profileCompleteness } from '@/lib/profile';
import { useApplications } from '@/providers/applications-provider';
import { useJobs } from '@/providers/jobs-provider';
import { useSettings } from '@/providers/settings-provider';
import { useToast } from '@/providers/toast-provider';
import type { ProfileLink, ThemeMode } from '@/types';

type SectionKey = 'profile' | 'sync' | 'ai' | 'feed' | 'actions' | 'about';

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'Auto' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

const INITIAL_OPEN: Record<SectionKey, boolean> = {
  profile: false,
  sync: false,
  ai: false,
  feed: false,
  actions: false,
  about: false,
};

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, secrets, setGithubToken, setAiApiKey, clearGithubToken, clearAiApiKey, updateSettings } =
    useSettings();
  const { sharedState, updateProfile, syncStatus, lastSyncedAt, syncError, dirty, syncNow } =
    useApplications();
  const { jobs, updated, fetchedAt, fromCache, refresh, status } = useJobs();
  const { showToast } = useToast();

  const profile = sharedState.profile;
  const completeness = profileCompleteness(profile);

  const [tokenDraft, setTokenDraft] = useState<string | null>(null);
  const [aiKeyDraft, setAiKeyDraft] = useState<string | null>(null);
  const [feedDraft, setFeedDraft] = useState<string | null>(null);
  const [repoCheck, setRepoCheck] = useState<{ ok: boolean; message: string } | null>(null);
  const [testingRepo, setTestingRepo] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>(INITIAL_OPEN);

  const token = tokenDraft ?? secrets.githubToken;
  const aiKey = aiKeyDraft ?? secrets.aiApiKey;
  const feedUrl = feedDraft ?? settings.jobsUrl;

  const tokenDirty = token.trim() !== secrets.githubToken;
  const aiKeyDirty = aiKey.trim() !== secrets.aiApiKey;

  const toggle = (key: SectionKey) =>
    setOpen((current) => ({ ...current, [key]: !current[key] }));

  const reveal = (key: SectionKey) =>
    setOpen((current) => ({ ...current, [key]: true }));

  const saveToken = () => {
    setGithubToken(token);
    setTokenDraft(null);
    setRepoCheck(null);
    showToast({
      message: token.trim() ? 'GitHub token saved on this device.' : 'GitHub token cleared.',
      tone: token.trim() ? 'success' : 'default',
    });
  };

  const saveAiKey = () => {
    setAiApiKey(aiKey);
    setAiKeyDraft(null);
    showToast({
      message: aiKey.trim() ? 'AI key saved on this device.' : 'AI key cleared.',
      tone: aiKey.trim() ? 'success' : 'default',
    });
  };

  const runRepoCheck = async () => {
    const key = token.trim() || secrets.githubToken;
    if (!key) {
      showToast({ message: 'Paste a GitHub token first.', tone: 'error' });
      return;
    }
    setTestingRepo(true);
    setRepoCheck(null);
    const result = await checkRepo(settings.sync, key);
    setTestingRepo(false);
    setRepoCheck(
      result.ok
        ? {
            ok: true,
            message: `Connected to ${settings.sync.owner}/${settings.sync.repo} (${result.private ? 'private' : 'public'}, default branch ${result.defaultBranch}).`,
          }
        : { ok: false, message: result.message },
    );
  };

  const runAiCheck = async () => {
    const key = aiKey.trim() || secrets.aiApiKey;
    if (!key) {
      showToast({ message: 'Add an AI API key first.', tone: 'error' });
      return;
    }
    setTestingAi(true);
    const result = await testAiConnection(settings.ai, key);
    setTestingAi(false);
    showToast({
      message: result.ok ? 'AI provider replied. You are ready to draft.' : result.message,
      tone: result.ok ? 'success' : 'error',
    });
  };

  const runScan = async () => {
    if (!secrets.githubToken) {
      showToast({ message: 'Add a GitHub token with Actions access first.', tone: 'error' });
      return;
    }
    setDispatching(true);
    try {
      await dispatchWorkflow(settings.actions, secrets.githubToken);
      showToast({ message: 'Job scan started on GitHub Actions.', tone: 'success' });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Could not start the workflow.',
        tone: 'error',
      });
    } finally {
      setDispatching(false);
    }
  };

  const applyFeedUrl = () => {
    const clean = feedUrl.trim();
    if (!/^https?:\/\//i.test(clean)) {
      showToast({ message: 'Enter a full https:// URL to jobs.json.', tone: 'error' });
      return;
    }
    updateSettings((current) => ({ ...current, jobsUrl: clean }));
    setFeedDraft(null);
    showToast({ message: 'Feed URL saved. Refreshing…', tone: 'success' });
  };

  const setLink = (index: number, patch: Partial<ProfileLink>) => {
    updateProfile({
      links: profile.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    });
  };

  const removeLink = (index: number) => {
    updateProfile({ links: profile.links.filter((_, i) => i !== index) });
  };

  const checklist: { key: SectionKey; label: string; hint: string; done: boolean }[] = [
    {
      key: 'profile',
      label: 'Add your profile',
      hint: 'Powers quick apply and AI drafts',
      done: Boolean(profile.name.trim() && profile.resume.trim()),
    },
    {
      key: 'sync',
      label: 'Connect GitHub sync',
      hint: 'Keeps every device in step',
      done: Boolean(secrets.githubToken),
    },
    {
      key: 'ai',
      label: 'Add an AI key',
      hint: 'Drafts cover letters on demand',
      done: Boolean(secrets.aiApiKey),
    },
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <Page>
      <PageScroll>
        <PageHeader
          title="Settings"
          subtitle="Tune the app to the way you hunt"
          right={Platform.OS === 'web' ? undefined : <SyncBadge />}
        />

        <View style={[styles.setupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.setupTop}>
            <View style={styles.setupText}>
              <ThemedText type="label" themeColor="accent">
                Setup
              </ThemedText>
              <ThemedText type="subtitle" style={styles.setupTitle}>
                {doneCount === checklist.length ? "You're all set" : 'Finish setting up'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {doneCount === checklist.length
                  ? 'Everything is connected. Go find something good.'
                  : `${doneCount} of ${checklist.length} done. Each step takes under a minute.`}
              </ThemedText>
            </View>
            <View style={[styles.setupScore, { backgroundColor: theme.accentSoft }]}>
              <ThemedText style={[styles.setupScoreValue, { color: theme.accent }]}>
                {doneCount}/{checklist.length}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.setupTrack, { backgroundColor: theme.surfaceAlt }]}>
            <View
              style={{
                width: `${(doneCount / checklist.length) * 100}%`,
                height: '100%',
                borderRadius: 999,
                backgroundColor: doneCount === checklist.length ? theme.success : theme.accent,
              }}
            />
          </View>

          <View style={styles.checklist}>
            {checklist.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => reveal(item.key)}
                style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.7 }]}>
                <Icon
                  name={item.done ? icons.checkCircle : icons.circle}
                  size={20}
                  color={item.done ? theme.success : theme.borderStrong}
                />
                <View style={styles.checkText}>
                  <ThemedText type="smallBold">{item.label}</ThemedText>
                  <ThemedText type="caption" themeColor="textTertiary">
                    {item.hint}
                  </ThemedText>
                </View>
                <Icon
                  name={icons.chevronRight}
                  size={16}
                  color={theme.textTertiary}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.appearance,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={[styles.appearanceIcon, { backgroundColor: theme.accentSoft }]}>
            <Icon
              name={
                settings.themeMode === 'light'
                  ? icons.sun
                  : settings.themeMode === 'dark'
                    ? icons.moon
                    : icons.monitor
              }
              size={18}
              color={theme.accent}
            />
          </View>
          <View style={styles.appearanceText}>
            <ThemedText type="smallBold">Appearance</ThemedText>
            <ThemedText type="caption" themeColor="textTertiary">
              Follow your system, or pick a side.
            </ThemedText>
          </View>
          <View style={styles.appearanceOptions}>
            {THEME_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                compact
                selected={settings.themeMode === option.key}
                onPress={() =>
                  updateSettings((current) => ({ ...current, themeMode: option.key }))
                }
              />
            ))}
          </View>
        </View>

        <CollapsibleSection
          icon={icons.user}
          title="Profile"
          summary={`${completeness}% complete · name, links, resume`}
          description="Quick apply copies this block, and AI drafts use it for context. It lives in your synced state file, not in the app code."
          expanded={open.profile}
          onToggle={() => toggle('profile')}
          right={
            <Badge
              label={`${completeness}%`}
              fg={completeness >= 70 ? 'success' : 'textSecondary'}
              bg={completeness >= 70 ? 'successSoft' : 'surfaceAlt'}
            />
          }>
          <View style={styles.grid}>
            <Field
              label="Name"
              value={profile.name}
              onChangeText={(name) => updateProfile({ name })}
              placeholder="Your full name"
              autoCapitalize="words"
              containerStyle={styles.gridItem}
            />
            <Field
              label="Headline"
              value={profile.headline}
              onChangeText={(headline) => updateProfile({ headline })}
              placeholder="Frontend engineer · React & TypeScript"
              autoCapitalize="sentences"
              containerStyle={styles.gridItem}
            />
            <Field
              label="Email"
              value={profile.email}
              onChangeText={(email) => updateProfile({ email })}
              placeholder="you@example.com"
              keyboardType="email-address"
              containerStyle={styles.gridItem}
            />
            <Field
              label="Phone"
              value={profile.phone}
              onChangeText={(phone) => updateProfile({ phone })}
              placeholder="+91…"
              keyboardType="phone-pad"
              containerStyle={styles.gridItem}
            />
            <Field
              label="Location"
              value={profile.location}
              onChangeText={(location) => updateProfile({ location })}
              placeholder="Bengaluru, India"
              autoCapitalize="words"
              containerStyle={styles.gridItem}
            />
            <Field
              label="Years of experience"
              value={profile.years}
              onChangeText={(years) => updateProfile({ years })}
              placeholder="3"
              keyboardType="number-pad"
              containerStyle={styles.gridItem}
            />
          </View>

          <Field
            label="Resume / background"
            description="Sent to your AI provider when drafting"
            value={profile.resume}
            onChangeText={(resume) => updateProfile({ resume })}
            placeholder="Paste a compact resume or a few strong project descriptions. The assistant will not invent anything beyond this."
            multiline
            inputStyle={styles.resumeInput}
          />

          <View style={styles.linksHeader}>
            <ThemedText type="smallBold">Links</ThemedText>
            <Button
              size="sm"
              variant="secondary"
              label="Add link"
              onPress={() =>
                updateProfile({ links: [...profile.links, { label: '', url: '' }] })
              }
              icon={<Icon name={icons.plus} size={14} color={theme.text} />}
            />
          </View>

          {profile.links.map((link, index) => (
            <View key={`link-${index}`} style={styles.linkRow}>
              <Field
                label="Label"
                value={link.label}
                onChangeText={(label) => setLink(index, { label })}
                placeholder="GitHub"
                autoCapitalize="words"
                containerStyle={styles.linkLabel}
              />
              <Field
                label="URL"
                value={link.url}
                onChangeText={(url) => setLink(index, { url })}
                placeholder="https://github.com/you"
                keyboardType="url"
                containerStyle={styles.linkUrl}
              />
              <Button
                size="sm"
                variant="ghost"
                accessibilityLabel="Remove link"
                onPress={() => removeLink(index)}
                icon={<Icon name={icons.trash} size={15} color={theme.danger} />}
              />
            </View>
          ))}
        </CollapsibleSection>

        <CollapsibleSection
          icon={icons.cloud}
          title="GitHub sync"
          summary={
            secrets.githubToken
              ? lastSyncedAt
                ? `Connected · synced ${relativeTime(lastSyncedAt)}`
                : 'Connected · not synced yet'
              : 'Add a token to sync across devices'
          }
          description="Application state is stored in one JSON file in a private repository. The token stays on this device and is never part of the deployed site."
          expanded={open.sync}
          onToggle={() => toggle('sync')}
          right={
            <Badge
              label={
                syncStatus === 'error'
                  ? 'Error'
                  : syncStatus === 'off'
                    ? 'Local only'
                    : syncStatus === 'syncing'
                      ? 'Syncing'
                      : 'On'
              }
              fg={syncStatus === 'error' ? 'danger' : syncStatus === 'off' ? 'textTertiary' : 'success'}
              bg={syncStatus === 'error' ? 'dangerSoft' : syncStatus === 'off' ? 'surfaceAlt' : 'successSoft'}
            />
          }>
          <View style={styles.grid}>
            <Field
              label="Owner"
              value={settings.sync.owner}
              onChangeText={(owner) =>
                updateSettings((current) => ({ ...current, sync: { ...current.sync, owner } }))
              }
              containerStyle={styles.gridItem}
            />
            <Field
              label="Data repository"
              value={settings.sync.repo}
              onChangeText={(repo) =>
                updateSettings((current) => ({ ...current, sync: { ...current.sync, repo } }))
              }
              containerStyle={styles.gridItem}
            />
            <Field
              label="Branch"
              value={settings.sync.branch}
              onChangeText={(branch) =>
                updateSettings((current) => ({ ...current, sync: { ...current.sync, branch } }))
              }
              containerStyle={styles.gridItem}
            />
            <Field
              label="File path"
              value={settings.sync.path}
              onChangeText={(path) =>
                updateSettings((current) => ({ ...current, sync: { ...current.sync, path } }))
              }
              containerStyle={styles.gridItem}
            />
          </View>

          <Field
            label="Fine-grained personal access token"
            description="Repository contents: read and write"
            value={token}
            onChangeText={setTokenDraft}
            placeholder="github_pat_…"
            secure
          />

          <View style={styles.buttonRow}>
            <Button
              size="sm"
              variant={tokenDirty ? 'primary' : 'secondary'}
              label="Save token"
              onPress={saveToken}
              disabled={!tokenDirty}
              icon={
                <Icon
                  name={icons.lock}
                  size={14}
                  color={tokenDirty ? theme.accentText : theme.text}
                />
              }
            />
            <Button
              size="sm"
              variant="secondary"
              label="Test repo"
              loading={testingRepo}
              onPress={() => void runRepoCheck()}
            />
            <Button
              size="sm"
              variant="secondary"
              label="Sync now"
              loading={syncStatus === 'syncing'}
              onPress={() => void syncNow()}
              icon={<Icon name={icons.sync} size={14} color={theme.text} />}
            />
            <Button
              size="sm"
              variant="ghost"
              label="Create token"
              onPress={() => openExternal('https://github.com/settings/personal-access-tokens/new')}
              iconRight={<Icon name={icons.external} size={13} color={theme.textSecondary} />}
            />
          </View>

          {repoCheck ? (
            <ThemedText
              type="small"
              style={{ color: repoCheck.ok ? theme.success : theme.danger }}>
              {repoCheck.message}
            </ThemedText>
          ) : null}
          {syncError ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {syncError}
            </ThemedText>
          ) : null}
          {dirty ? (
            <ThemedText type="caption" themeColor="textTertiary">
              Local changes are queued and will push automatically.
            </ThemedText>
          ) : null}

          <ThemedText type="caption" themeColor="textTertiary">
            On the web the token is kept in this browser&apos;s local storage. Use a token that can only
            touch the data repository. On iOS and Android it is stored in the system keychain.
          </ThemedText>
          <View style={styles.buttonRow}>
            <Button
              size="sm"
              variant="secondary"
              label="Open data repo"
              onPress={() => openExternal(repoUrl(settings.sync))}
              iconRight={<Icon name={icons.external} size={13} color={theme.text} />}
            />
            {secrets.githubToken ? (
              <Button
                size="sm"
                variant="danger"
                label="Remove token"
                onPress={() => {
                  clearGithubToken();
                  setTokenDraft(null);
                  setRepoCheck(null);
                  showToast({ message: 'GitHub token removed from this device.' });
                }}
              />
            ) : null}
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          icon={icons.sparkles}
          title="AI assistant"
          summary={
            secrets.aiApiKey
              ? `Key saved · ${settings.ai.model || 'default model'}`
              : 'Add a key to draft cover letters'
          }
          description="Any OpenAI-compatible chat completions endpoint works. The key is stored locally with the same rules as the GitHub token."
          expanded={open.ai}
          onToggle={() => toggle('ai')}
          right={
            <Badge
              label={secrets.aiApiKey ? 'Ready' : 'No key'}
              fg={secrets.aiApiKey ? 'success' : 'textTertiary'}
              bg={secrets.aiApiKey ? 'successSoft' : 'surfaceAlt'}
            />
          }>
          <View style={styles.grid}>
            <Field
              label="Base URL"
              value={settings.ai.baseUrl}
              onChangeText={(baseUrl) =>
                updateSettings((current) => ({ ...current, ai: { ...current.ai, baseUrl } }))
              }
              placeholder="https://api.openai.com/v1"
              keyboardType="url"
              containerStyle={styles.gridItem}
            />
            <Field
              label="Model"
              value={settings.ai.model}
              onChangeText={(model) =>
                updateSettings((current) => ({ ...current, ai: { ...current.ai, model } }))
              }
              placeholder="gpt-4.1-mini"
              containerStyle={styles.gridItem}
            />
          </View>

          <Field
            label="API key"
            value={aiKey}
            onChangeText={setAiKeyDraft}
            placeholder="sk-…"
            secure
          />

          <View style={styles.buttonRow}>
            <Button
              size="sm"
              variant={aiKeyDirty ? 'primary' : 'secondary'}
              label="Save key"
              onPress={saveAiKey}
              disabled={!aiKeyDirty}
              icon={
                <Icon
                  name={icons.lock}
                  size={14}
                  color={aiKeyDirty ? theme.accentText : theme.text}
                />
              }
            />
            <Button
              size="sm"
              variant="secondary"
              label="Test connection"
              loading={testingAi}
              onPress={() => void runAiCheck()}
            />
            {secrets.aiApiKey ? (
              <Button
                size="sm"
                variant="danger"
                label="Remove key"
                onPress={() => {
                  clearAiApiKey();
                  setAiKeyDraft(null);
                  showToast({ message: 'AI key removed from this device.' });
                }}
              />
            ) : null}
          </View>

          <ThemedText type="caption" themeColor="textTertiary">
            Your profile text and the selected posting are sent to this provider when you generate a
            draft. Nothing else leaves the device.
          </ThemedText>
        </CollapsibleSection>

        <CollapsibleSection
          icon={icons.jobs}
          title="Job feed"
          summary={`${jobs.length} jobs · ${updated ? `updated ${relativeTime(updated)}` : 'not fetched yet'}`}
          description="The GitHub Actions scraper publishes jobs.json and others.json to GitHub Pages. Point the app at your fork if you run your own scraper."
          expanded={open.feed}
          onToggle={() => toggle('feed')}
          right={
            <Badge
              label={fromCache ? 'Cached' : 'Live'}
              fg={fromCache ? 'textSecondary' : 'success'}
              bg={fromCache ? 'surfaceAlt' : 'successSoft'}
            />
          }>
          <Field
            label="jobs.json URL"
            value={feedUrl}
            onChangeText={setFeedDraft}
            placeholder="https://abhinandansw.github.io/job_board/jobs.json"
            keyboardType="url"
          />
          <View style={styles.buttonRow}>
            <Button size="sm" variant="primary" label="Save URL" onPress={applyFeedUrl} />
            <Button
              size="sm"
              variant="secondary"
              label="Refresh feed"
              loading={status === 'refreshing'}
              onPress={() => void refresh()}
              icon={<Icon name={icons.refresh} size={14} color={theme.text} />}
            />
            <Button
              size="sm"
              variant="ghost"
              label="Open dashboard"
              onPress={() => openExternal(settings.jobsUrl)}
              iconRight={<Icon name={icons.external} size={13} color={theme.textSecondary} />}
            />
          </View>
          <ThemedText type="caption" themeColor="textTertiary">
            {updated ? `Feed updated ${relativeTime(updated)}. ` : ''}
            {fetchedAt ? `Fetched ${formatDateTime(fetchedAt)}` : 'Not fetched yet'}
            {fromCache ? ' · cached copy' : ''}
          </ThemedText>
        </CollapsibleSection>

        <CollapsibleSection
          icon={icons.play}
          title="Scraper automation"
          summary={`${settings.actions.workflow} on ${settings.actions.repo}`}
          description="Trigger the job_board workflow without leaving the app. The token needs Actions: write on that repository."
          expanded={open.actions}
          onToggle={() => toggle('actions')}>
          <View style={styles.grid}>
            <Field
              label="Owner"
              value={settings.actions.owner}
              onChangeText={(owner) =>
                updateSettings((current) => ({
                  ...current,
                  actions: { ...current.actions, owner },
                }))
              }
              containerStyle={styles.gridItem}
            />
            <Field
              label="Repository"
              value={settings.actions.repo}
              onChangeText={(repo) =>
                updateSettings((current) => ({
                  ...current,
                  actions: { ...current.actions, repo },
                }))
              }
              containerStyle={styles.gridItem}
            />
            <Field
              label="Workflow file"
              value={settings.actions.workflow}
              onChangeText={(workflow) =>
                updateSettings((current) => ({
                  ...current,
                  actions: { ...current.actions, workflow },
                }))
              }
              containerStyle={styles.gridItem}
            />
            <Field
              label="Branch"
              value={settings.actions.branch}
              onChangeText={(branch) =>
                updateSettings((current) => ({
                  ...current,
                  actions: { ...current.actions, branch },
                }))
              }
              containerStyle={styles.gridItem}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button
              size="sm"
              variant="primary"
              label="Run job scan"
              loading={dispatching}
              onPress={() => void runScan()}
              icon={<Icon name={icons.play} size={14} color={theme.accentText} />}
            />
            <Button
              size="sm"
              variant="secondary"
              label="Open Actions"
              onPress={() =>
                openExternal(
                  `https://github.com/${settings.actions.owner}/${settings.actions.repo}/actions/workflows/${settings.actions.workflow}`,
                )
              }
              iconRight={<Icon name={icons.external} size={13} color={theme.text} />}
            />
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          icon={icons.info}
          title="About"
          summary={`Version ${Constants.expoConfig?.version ?? '1.0.0'} · personal workspace`}
          description="Personal job hunt workspace. Built for one user; there are no accounts or servers."
          expanded={open.about}
          onToggle={() => toggle('about')}>
          <View style={styles.buttonRow}>
            <Button
              size="sm"
              variant="secondary"
              label="Job board repo"
              onPress={() => openExternal('https://github.com/AbhinandanSW/job_board')}
              iconRight={<Icon name={icons.external} size={13} color={theme.text} />}
            />
            <Button
              size="sm"
              variant="ghost"
              label="Expo docs"
              onPress={() => openExternal('https://docs.expo.dev')}
              iconRight={<Icon name={icons.external} size={13} color={theme.textSecondary} />}
            />
          </View>
          <ThemedText type="caption" themeColor="textTertiary">
            Application records and profile data are stored in {settings.sync.owner}/{settings.sync.repo}{' '}
            on branch {settings.sync.branch}. Local copies keep the app usable offline.
          </ThemedText>
        </CollapsibleSection>
      </PageScroll>
    </Page>
  );
}

const styles = StyleSheet.create({
  setupCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  setupTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  setupText: {
    flex: 1,
    gap: 2,
  },
  setupTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  setupScore: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupScoreValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  setupTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  checklist: {
    gap: Spacing.one,
  },
  appearance: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.three,
  },
  appearanceIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceText: {
    flex: 1,
    minWidth: 150,
    gap: 1,
  },
  appearanceOptions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 6,
  },
  checkText: {
    flex: 1,
    gap: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 160,
  },
  resumeInput: {
    minHeight: 140,
  },
  linksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  linkLabel: {
    flex: 1,
    minWidth: 100,
  },
  linkUrl: {
    flex: 2,
    minWidth: 160,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
