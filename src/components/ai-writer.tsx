import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/field';
import { Icon, icons } from '@/components/ui/icon';
import { SectionCard } from '@/components/ui/section';
import { useTheme } from '@/hooks/use-theme';
import { generateCoverLetter, generateResumeBullets } from '@/lib/ai';
import { copyText } from '@/lib/clipboard';
import { useApplications } from '@/providers/applications-provider';
import { useSettings } from '@/providers/settings-provider';
import { useToast } from '@/providers/toast-provider';
import type { ApplicationRecord, Job } from '@/types';

type Mode = 'cover' | 'bullets';

export function AiWriter({ job, record }: { job: Job; record?: ApplicationRecord }) {
  const theme = useTheme();
  const { settings, secrets } = useSettings();
  const { updateRecord, sharedState } = useApplications();
  const { showToast } = useToast();

  const [mode, setMode] = useState<Mode>('cover');
  const [cover, setCover] = useState(record?.coverLetter ?? '');
  const [bullets, setBullets] = useState(record?.resumeBullets ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const text = mode === 'cover' ? cover : bullets;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const setText = (value: string) => {
    if (mode === 'cover') setCover(value);
    else setBullets(value);
    setDirty(true);
  };

  const commit = (value: string) => {
    updateRecord(job, mode === 'cover' ? { coverLetter: value } : { resumeBullets: value });
    setDirty(false);
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const generated =
        mode === 'cover'
          ? await generateCoverLetter(settings.ai, secrets.aiApiKey, job, sharedState.profile)
          : await generateResumeBullets(
              settings.ai,
              secrets.aiApiKey,
              job,
              sharedState.profile,
            );
      setText(generated);
      commit(generated);
      showToast({
        message: mode === 'cover' ? 'Cover letter drafted.' : 'Resume bullets drafted.',
        tone: 'success',
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not generate a draft.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="AI writing help"
      description="Drafts use your profile in Settings and this posting. Edit everything before sending."
      icon={icons.wand}
      right={
        secrets.aiApiKey ? null : (
          <Button
            size="sm"
            variant="ghost"
            label="Add key"
            onPress={() => router.push('/settings')}
          />
        )
      }>
      <View style={styles.modes}>
        <Chip
          label="Cover letter"
          compact
          selected={mode === 'cover'}
          onPress={() => setMode('cover')}
        />
        <Chip
          label="Resume bullets"
          compact
          selected={mode === 'bullets'}
          onPress={() => setMode('bullets')}
        />
      </View>

      <Field
        label={mode === 'cover' ? 'Cover letter draft' : 'Resume bullets'}
        description={`${wordCount} words`}
        value={text}
        onChangeText={setText}
        placeholder="Generate a draft, or write your own here."
        multiline
        inputStyle={styles.draftInput}
      />

      {error ? (
        <View style={styles.errorRow}>
          <Icon name={icons.warning} size={15} color={theme.danger} />
          <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          size="sm"
          variant="primary"
          loading={busy}
          onPress={() => void generate()}
          icon={<Icon name={icons.sparkles} size={15} color={theme.accentText} />}
          label={text ? 'Regenerate' : 'Generate'}
        />
        <Button
          size="sm"
          icon={<Icon name={icons.copy} size={15} color={theme.text} />}
          label="Copy"
          disabled={!text.trim()}
          onPress={() => {
            void copyText(text).then((copied) =>
              showToast({
                message: copied ? 'Draft copied.' : 'Could not access the clipboard.',
                tone: copied ? 'success' : 'error',
              }),
            );
          }}
        />
        <Button
          size="sm"
          variant="subtle"
          label="Save"
          disabled={!dirty}
          onPress={() => commit(text)}
        />
      </View>

      <ThemedText type="caption" themeColor="textTertiary">
        AI drafts can be wrong. Verify every claim, metric and company detail before you send it.
      </ThemedText>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  modes: {
    flexDirection: 'row',
    gap: 6,
  },
  draftInput: {
    minHeight: 200,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
});
