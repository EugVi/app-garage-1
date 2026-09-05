export function haptic(pattern: number | number[] = 10, enabled: boolean = true) {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch { /* ignore */ }
}

export const haptics = {
  light: () => haptic(10),
  medium: () => haptic(20),
  heavy: () => haptic([0, 30, 20, 30]),
  success: () => haptic([0, 10, 50, 30, 50, 60]),
  warning: () => haptic([0, 40, 30, 40]),
  unlock: () => haptic([0, 15, 40, 30]),
  levelUp: () => haptic([0, 20, 30, 20, 30, 50]),
};
