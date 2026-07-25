export type PrayerKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerTimeItem {
  key: PrayerKey;
  name: string;
  arabicName: string;
  sinhalaName: string;
  tamilName: string;
  timeFormatted: string; // e.g. "4:24 AM"
  time24: string; // e.g. "04:24"
  dateObj: Date;
  isNext: boolean;
  isCurrent: boolean;
  isPast: boolean;
  iconName: string;
  meaning: string;
}

export interface District {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  isCapital?: boolean;
}

export interface DayPrayerSchedule {
  date: Date;
  dateFormatted: string; // e.g. "25-Jul" or "25 July 2026"
  dayName: string; // e.g. "Saturday"
  hijriDate: string; // e.g. "10 Safar 1448 AH"
  prayers: Record<PrayerKey, {
    time12: string;
    time24: string;
    dateObj: Date;
  }>;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  notifyBeforeMinutes: number; // e.g. 0 (at adhan), 5, 10, 15
  prayers: Record<PrayerKey, boolean>;
}

export interface QiblaInfo {
  qiblaBearing: number; // e.g. 294.7 degrees from True North
  distanceKm: number; // distance to Mecca in km
  deviceHeading: number | null; // from sensor
  relativeAngle: number | null; // deviceHeading vs qiblaBearing
  isAligned: boolean;
}

export interface DuaItem {
  id: string;
  title: string;
  category: 'adhan' | 'prayer' | 'morning' | 'evening' | 'wudu';
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
}
