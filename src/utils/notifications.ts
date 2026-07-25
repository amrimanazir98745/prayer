import { NotificationSettings, PrayerKey } from '../types/prayer';
import { playAdhanTone } from './audioSynthesizer';

export function checkNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!checkNotificationSupport()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
}

export function sendPrayerNotification(prayerName: string, districtName: string, isReminder = false) {
  if (!checkNotificationSupport() || Notification.permission !== 'granted') {
    return;
  }

  const title = isReminder 
    ? `⏰ Reminder: ${prayerName} Prayer in 5 Mins`
    : `🕌 Adhan Time: ${prayerName} - ${districtName}`;
    
  const body = isReminder
    ? `Get ready for ${prayerName} prayer in ${districtName}.`
    : `It's time for ${prayerName} prayer in ${districtName}. Hayya 'alas-Salah!`;

  try {
    const options: NotificationOptions & { renotify?: boolean; requireInteraction?: boolean } = {
      body,
      icon: '/favicon.ico',
      tag: `prayer-${prayerName}-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
    };

    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    playAdhanTone();
  } catch (e) {
    console.warn('Could not display push notification:', e);
  }
}

const DEFAULT_SETTINGS_KEY = 'sl_prayer_notifications_v1';

export function loadNotificationSettings(): NotificationSettings {
  const defaultSettings: NotificationSettings = {
    pushEnabled: false,
    soundEnabled: true,
    notifyBeforeMinutes: 0,
    prayers: {
      Fajr: true,
      Sunrise: false,
      Dhuhr: true,
      Asr: true,
      Maghrib: true,
      Isha: true,
    }
  };

  if (typeof window === 'undefined') return defaultSettings;

  try {
    const saved = localStorage.getItem(DEFAULT_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load notification settings:', e);
  }

  return defaultSettings;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save notification settings:', e);
  }
}
