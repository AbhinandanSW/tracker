import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type IconName = {
  ios: string;
  android: string;
  web: string;
};

export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  const theme = useTheme();
  return (
    <SymbolView
      name={name as never}
      size={size}
      tintColor={color ?? theme.textSecondary}
      style={{ width: size, height: size }}
    />
  );
}

export const icons = {
  jobs: { ios: 'briefcase', android: 'work', web: 'work' },
  jobsSelected: { ios: 'briefcase.fill', android: 'work', web: 'work' },
  tracker: { ios: 'chart.bar.doc.horizontal', android: 'view_kanban', web: 'view_kanban' },
  trackerSelected: { ios: 'chart.bar.doc.horizontal.fill', android: 'view_kanban', web: 'view_kanban' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  settingsSelected: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' },
  bookmark: { ios: 'bookmark', android: 'bookmark', web: 'bookmark' },
  bookmarkFilled: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  circle: { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  building: { ios: 'building.2.fill', android: 'apartment', web: 'apartment' },
  external: { ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  notes: { ios: 'note.text', android: 'notes', web: 'notes' },
  cloud: { ios: 'cloud', android: 'cloud', web: 'cloud' },
  cloudOff: { ios: 'icloud.slash', android: 'cloud_off', web: 'cloud_off' },
  user: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  link: { ios: 'link', android: 'link', web: 'link' },
  eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  sync: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  wand: { ios: 'wand.and.stars', android: 'auto_fix_high', web: 'auto_fix_high' },
  document: { ios: 'doc.text', android: 'description', web: 'description' },
  mail: { ios: 'envelope.fill', android: 'mail', web: 'mail' },
  phone: { ios: 'phone.fill', android: 'call', web: 'call' },
  globe: { ios: 'globe', android: 'public', web: 'public' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward', web: 'arrow_downward' },
  target: { ios: 'target', android: 'target', web: 'target' },
  sun: { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' },
  moon: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
  monitor: { ios: 'display', android: 'desktop_windows', web: 'desktop_windows' },
  flame: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  list: { ios: 'list.bullet', android: 'list', web: 'list' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
} as const satisfies Record<string, IconName>;
