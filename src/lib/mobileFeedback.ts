'use client';

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Mobile-friendly haptic vibration feedback.
 * Uses Capacitor native haptics when running as an installed native app (iOS/Android),
 * and safely falls back to standard Web Vibration API or no-op on desktop browsers.
 */
export async function triggerHaptic(type: 'tap' | 'stamp' | 'success' | 'warning' | 'selection' = 'tap') {
    if (typeof window === 'undefined') return;

    try {
        if (Capacitor.isNativePlatform()) {
            switch (type) {
                case 'tap':
                case 'selection':
                    await Haptics.impact({ style: ImpactStyle.Light });
                    break;
                case 'stamp':
                    await Haptics.impact({ style: ImpactStyle.Heavy });
                    break;
                case 'success':
                    await Haptics.notification({ type: NotificationType.Success });
                    break;
                case 'warning':
                    await Haptics.notification({ type: NotificationType.Warning });
                    break;
            }
        } else if ('vibrate' in navigator) {
            // Web vibration fallback on Android Chrome / mobile web
            switch (type) {
                case 'tap':
                case 'selection':
                    navigator.vibrate(10);
                    break;
                case 'stamp':
                    navigator.vibrate(35);
                    break;
                case 'success':
                    navigator.vibrate([15, 40, 25]);
                    break;
                case 'warning':
                    navigator.vibrate([30, 50, 30]);
                    break;
            }
        }
    } catch {
        // Silently ignore vibration errors if not permitted by user or platform
    }
}

