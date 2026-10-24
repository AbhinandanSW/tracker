import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Toast } from '@/types';

type ToastContextValue = {
  showToast: (toast: Toast) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [clearTimer, progress]);

  const showToast = useCallback(
    (next: Toast) => {
      clearTimer();
      setToast(next);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      timer.current = setTimeout(hideToast, 4200);
    },
    [clearTimer, hideToast, progress],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);
  const bottom = Platform.OS === 'web' ? 24 : insets.bottom + BottomTabInset + 12;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.host, { bottom }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                backgroundColor:
                  toast.tone === 'error'
                    ? theme.dangerSoft
                    : toast.tone === 'success'
                      ? theme.successSoft
                      : theme.text,
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
                ...Shadow.floating,
              },
            ]}>
            <ThemedText
              style={[
                styles.message,
                {
                  color:
                    toast.tone === 'error'
                      ? theme.danger
                      : toast.tone === 'success'
                        ? theme.success
                        : theme.background,
                },
              ]}>
              {toast.message}
            </ThemedText>
            {toast.actionLabel && toast.onAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.onAction?.();
                  hideToast();
                }}
                style={({ pressed }) => [
                  styles.action,
                  {
                    borderColor:
                      toast.tone === 'error'
                        ? theme.danger
                        : toast.tone === 'success'
                          ? theme.success
                          : theme.background,
                  },
                  pressed && { opacity: 0.65 },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{
                    color:
                      toast.tone === 'error'
                        ? theme.danger
                        : toast.tone === 'success'
                          ? theme.success
                          : theme.background,
                  }}>
                  {toast.actionLabel}
                </ThemedText>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    maxWidth: 560,
    width: '100%',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  action: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
});
