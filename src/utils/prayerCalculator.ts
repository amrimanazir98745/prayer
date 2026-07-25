import { PrayerKey, DayPrayerSchedule, PrayerTimeItem } from '../types/prayer';
import { getOfficialPrayerTimes } from '../data/officialTimetableTimes';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// Sri Lanka Standard Time is UTC + 5.5 hours (+19800000 ms)
export const SRI_LANKA_TZ = 5.5;
export const SRI_LANKA_OFFSET_MS = 5.5 * 3600 * 1000;

export function getSriLankaTimeParts(date: Date = new Date()) {
  const slMs = date.getTime() + SRI_LANKA_OFFSET_MS;
  const slDate = new Date(slMs);

  const year = slDate.getUTCFullYear();
  const month = slDate.getUTCMonth(); // 0-11
  const day = slDate.getUTCDate();    // 1-31
  const hours = slDate.getUTCHours(); // 0-23
  const minutes = slDate.getUTCMinutes();
  const seconds = slDate.getUTCSeconds();

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dateObj: new Date(year, month, day, hours, minutes, seconds)
  };
}

export function isSriLankaToday(date: Date, now: Date = new Date()): boolean {
  const p = getSriLankaTimeParts(date);
  const n = getSriLankaTimeParts(now);
  return p.year === n.year && p.month === n.month && p.day === n.day;
}

export function parse12hToSriLankaUtcDate(timeStr: string, baseDate: Date): Date {
  const parts = timeStr.trim().split(/\s+/);
  if (parts.length < 2) return baseDate;
  const [timePart, ampm] = parts;
  const timeSub = timePart.split(':');
  let hours = parseInt(timeSub[0], 10);
  const minutes = parseInt(timeSub[1], 10);

  const isPM = ampm.toUpperCase() === 'PM';
  if (isPM && hours < 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;

  const slParts = getSriLankaTimeParts(baseDate);
  const utcMs = Date.UTC(slParts.year, slParts.month, slParts.day, hours, minutes, 0) - SRI_LANKA_OFFSET_MS;
  return new Date(utcMs);
}

function formatSriLankaTime24(d: Date): string {
  const sl = new Date(d.getTime() + SRI_LANKA_OFFSET_MS);
  const hours = sl.getUTCHours();
  const minutes = sl.getUTCMinutes();
  const hoursStr = hours < 10 ? '0' + hours : hours;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hoursStr}:${minutesStr}`;
}

function formatSriLankaTime12(d: Date): string {
  const sl = new Date(d.getTime() + SRI_LANKA_OFFSET_MS);
  let hours = sl.getUTCHours();
  const minutes = sl.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

function fixAngle(a: number): number {
  a = a - 360.0 * Math.floor(a / 360.0);
  return a < 0 ? a + 360.0 : a;
}

function fixHour(a: number): number {
  a = a - 24.0 * Math.floor(a / 24.0);
  return a < 0 ? a + 24.0 : a;
}

function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunCoordinates(jd: number) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R));
  
  const e = 23.439 - 0.00000036 * D;
  const RA = fixHour(Math.atan2(Math.cos(e * D2R) * Math.sin(L * D2R), Math.cos(L * D2R)) * R2D / 15);
  const EqT = q / 15 - RA;
  const declination = Math.asin(Math.sin(e * D2R) * Math.sin(L * D2R)) * R2D;

  return { declination, EqT };
}

function computeTime(angle: number, isNight: boolean, lat: number, dec: number): number | null {
  const cosH = (Math.sin(-angle * D2R) - Math.sin(lat * D2R) * Math.sin(dec * D2R)) /
               (Math.cos(lat * D2R) * Math.cos(dec * D2R));
  if (cosH > 1 || cosH < -1) return null;
  const H = Math.acos(cosH) * R2D / 15;
  return isNight ? -H : H;
}

function computeAsrTime(shadowFactor: number, lat: number, dec: number): number {
  const phi = Math.abs(lat - dec);
  const angle = Math.atan(1 / (shadowFactor + Math.tan(phi * D2R))) * R2D;
  const cosH = (Math.sin(angle * D2R) - Math.sin(lat * D2R) * Math.sin(dec * D2R)) /
               (Math.cos(lat * D2R) * Math.cos(dec * D2R));
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) * R2D / 15;
  return H;
}

export function calculateDailyPrayerSchedule(
  date: Date,
  lat: number,
  lng: number,
  districtId?: string,
  fajrAngle: number = 18.0,
  ishaAngle: number = 17.5
): DayPrayerSchedule {
  const slParts = getSriLankaTimeParts(date);
  const year = slParts.year;
  const monthIdx = slParts.month; // 0-11
  const day = slParts.day; // 1-31

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hijriDate = formatSriLankaHijri(date);

  // Check official district PDF schedule first
  const official = districtId ? getOfficialPrayerTimes(districtId, monthIdx, day) : null;

  if (official) {
    const fajrDate = parse12hToSriLankaUtcDate(official.Fajr, date);
    const sunriseDate = parse12hToSriLankaUtcDate(official.Sunrise, date);
    const dhuhrDate = parse12hToSriLankaUtcDate(official.Dhuhr, date);
    const asrDate = parse12hToSriLankaUtcDate(official.Asr, date);
    const maghribDate = parse12hToSriLankaUtcDate(official.Maghrib, date);
    const ishaDate = parse12hToSriLankaUtcDate(official.Isha, date);

    return {
      date: date,
      dateFormatted: `${day}-${months[monthIdx]}`,
      dayName: days[slParts.dateObj.getDay()],
      hijriDate,
      prayers: {
        Fajr: { time12: official.Fajr, time24: formatSriLankaTime24(fajrDate), dateObj: fajrDate },
        Sunrise: { time12: official.Sunrise, time24: formatSriLankaTime24(sunriseDate), dateObj: sunriseDate },
        Dhuhr: { time12: official.Dhuhr, time24: formatSriLankaTime24(dhuhrDate), dateObj: dhuhrDate },
        Asr: { time12: official.Asr, time24: formatSriLankaTime24(asrDate), dateObj: asrDate },
        Maghrib: { time12: official.Maghrib, time24: formatSriLankaTime24(maghribDate), dateObj: maghribDate },
        Isha: { time12: official.Isha, time24: formatSriLankaTime24(ishaDate), dateObj: ishaDate },
      }
    };
  }

  // Fallback to astronomical calculation
  const month = monthIdx + 1;
  const jd = julianDate(year, month, day);
  const { declination, EqT } = sunCoordinates(jd);

  // Midday (Dhuhr) in hours
  const dhuhrHours = 12 + SRI_LANKA_TZ - lng / 15 - EqT + (2 / 60);

  const sunriseOffset = computeTime(0.833, true, lat, declination) || 0;
  const sunsetOffset = computeTime(0.833, false, lat, declination) || 0;
  const fajrOffset = computeTime(fajrAngle, true, lat, declination) || 0;
  const ishaOffset = computeTime(ishaAngle, false, lat, declination) || 0;
  const asrOffset = computeAsrTime(1, lat, declination);

  const fajrHours = dhuhrHours + fajrOffset;
  const sunriseHours = dhuhrHours + sunriseOffset;
  const asrHours = dhuhrHours + asrOffset;
  const maghribHours = dhuhrHours + sunsetOffset + (2 / 60);
  const ishaHours = dhuhrHours + ishaOffset;

  function hoursToSriLankaUtcDate(h: number): Date {
    const totalMinutes = Math.round(h * 60);
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = totalMinutes % 60;
    const utcMs = Date.UTC(year, monthIdx, day, hoursPart, minutesPart, 0) - SRI_LANKA_OFFSET_MS;
    return new Date(utcMs);
  }

  const fajrDate = hoursToSriLankaUtcDate(fajrHours);
  const sunriseDate = hoursToSriLankaUtcDate(sunriseHours);
  const dhuhrDate = hoursToSriLankaUtcDate(dhuhrHours);
  const asrDate = hoursToSriLankaUtcDate(asrHours);
  const maghribDate = hoursToSriLankaUtcDate(maghribHours);
  const ishaDate = hoursToSriLankaUtcDate(ishaHours);

  return {
    date: date,
    dateFormatted: `${day}-${months[monthIdx]}`,
    dayName: days[slParts.dateObj.getDay()],
    hijriDate,
    prayers: {
      Fajr: { time12: formatSriLankaTime12(fajrDate), time24: formatSriLankaTime24(fajrDate), dateObj: fajrDate },
      Sunrise: { time12: formatSriLankaTime12(sunriseDate), time24: formatSriLankaTime24(sunriseDate), dateObj: sunriseDate },
      Dhuhr: { time12: formatSriLankaTime12(dhuhrDate), time24: formatSriLankaTime24(dhuhrDate), dateObj: dhuhrDate },
      Asr: { time12: formatSriLankaTime12(asrDate), time24: formatSriLankaTime24(asrDate), dateObj: asrDate },
      Maghrib: { time12: formatSriLankaTime12(maghribDate), time24: formatSriLankaTime24(maghribDate), dateObj: maghribDate },
      Isha: { time12: formatSriLankaTime12(ishaDate), time24: formatSriLankaTime24(ishaDate), dateObj: ishaDate },
    }
  };
}

// Official Hijri calendar converter for Sri Lanka (ACJU synchronized)
export function formatSriLankaHijri(date: Date, dayOffset: number = 0): string {
  const sl = getSriLankaTimeParts(date);
  const adjusted = new Date(sl.dateObj.getTime() + dayOffset * 86400000);

  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-civil', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(adjusted);
    let hDay = '';
    let hMonth = '';
    let hYear = '';
    for (const part of parts) {
      if (part.type === 'day') hDay = part.value;
      if (part.type === 'month') hMonth = part.value;
      if (part.type === 'year') hYear = part.value;
    }
    if (hDay && hMonth && hYear) {
      const monthMap: Record<string, string> = {
        'Muharram': 'Muharram',
        'Safar': 'Safar',
        'Rabiʻ I': 'Rabi al-Awwal',
        'Rabiʻ II': 'Rabi al-Thani',
        'Jumada I': 'Jumada al-Awwal',
        'Jumada II': 'Jumada al-Thani',
        'Rajab': 'Rajab',
        'Shaʻban': 'Sha\'ban',
        'Ramadan': 'Ramadan',
        'Shawwal': 'Shawwal',
        'Dhuʻl-Qiʻdah': 'Dhu al-Qi\'dah',
        'Dhuʻl-Hijjah': 'Dhu al-Hijjah'
      };
      const cleanMonth = monthMap[hMonth] || hMonth.replace(/[ʻ`']/g, "'");
      return `${hDay} ${cleanMonth} ${hYear} AH`;
    }
  } catch {
    // Fallback if Intl calendar not supported
  }

  // Civil Hijri fallback algorithm
  const day = adjusted.getDate();
  const month = adjusted.getMonth() + 1;
  const year = adjusted.getFullYear();

  let m = month;
  let y = year;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

  const z = jd - 1948440;
  const cyc = Math.floor(z / 10631);
  const rem = z % 10631;
  const hYear = Math.floor((30 * rem + 10646) / 10631) + cyc * 30;
  const dayInYear = rem - Math.floor((10631 * (hYear - cyc * 30) - 10646) / 30);
  
  let hMonth = Math.min(12, Math.floor((dayInYear + 28.5) / 29.5) + 1);
  let hDay = Math.floor(dayInYear - Math.floor((hMonth - 1) * 29.5) + 1);

  if (hDay < 1) hDay = 1;
  if (hDay > 30) hDay = 30;

  const islamicMonths = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];

  const monthName = islamicMonths[Math.max(0, Math.min(11, hMonth - 1))];
  return `${hDay} ${monthName} ${hYear} AH`;
}

export function buildPrayerTimeItems(
  schedule: DayPrayerSchedule,
  now: Date
): {
  items: PrayerTimeItem[];
  nextPrayer: PrayerTimeItem | null;
  currentPrayer: PrayerTimeItem | null;
  timeRemainingSeconds: number;
  totalIntervalSeconds: number;
} {
  const prayerConfig: {
    key: PrayerKey;
    name: string;
    arabicName: string;
    sinhalaName: string;
    tamilName: string;
    iconName: string;
    meaning: string;
  }[] = [
    { key: 'Fajr', name: 'Fajr', arabicName: 'الفجر', sinhalaName: 'සුබහ්', tamilName: 'ஃபஜ்ர்', iconName: 'CloudSun', meaning: 'Dawn Prayer' },
    { key: 'Sunrise', name: 'Sunrise', arabicName: 'الشروق', sinhalaName: 'ඉර උදාව', tamilName: 'சூரிய உதயம்', iconName: 'Sunrise', meaning: 'Ishraq Time' },
    { key: 'Dhuhr', name: 'Dhuhr', arabicName: 'الظهر', sinhalaName: 'ලුහාර්', tamilName: 'ளுஹர்', iconName: 'Sun', meaning: 'Noon Prayer' },
    { key: 'Asr', name: 'Asr', arabicName: 'العصر', sinhalaName: 'අසර්', tamilName: 'அஸர்', iconName: 'SunDim', meaning: 'Afternoon Prayer' },
    { key: 'Maghrib', name: 'Maghrib', arabicName: 'المغرب', sinhalaName: 'මග්රිබ්', tamilName: 'மஃக்ரிப்', iconName: 'Sunset', meaning: 'Sunset Prayer' },
    { key: 'Isha', name: 'Isha', arabicName: 'العشاء', sinhalaName: 'ඉශා', tamilName: 'இஷா', iconName: 'Moon', meaning: 'Night Prayer' },
  ];

  const nowMs = now.getTime();

  // Filter only Adhan prayers for next/current calculation
  const adhanKeys: PrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  let nextAdhanKey: PrayerKey | null = null;
  let isNextTomorrow = false;

  for (const key of adhanKeys) {
    const pDate = schedule.prayers[key].dateObj;
    if (pDate.getTime() > nowMs) {
      nextAdhanKey = key;
      break;
    }
  }

  if (!nextAdhanKey) {
    // All today's Adhans passed -> Next is Fajr tomorrow
    nextAdhanKey = 'Fajr';
    isNextTomorrow = true;
  }

  // Determine current (previous) Adhan key
  let currentAdhanKey: PrayerKey;
  if (isNextTomorrow) {
    currentAdhanKey = 'Isha';
  } else {
    const nextIdx = adhanKeys.indexOf(nextAdhanKey);
    if (nextIdx === 0) { // Next is Fajr today (before Fajr)
      currentAdhanKey = 'Isha'; // From yesterday
    } else {
      currentAdhanKey = adhanKeys[nextIdx - 1];
    }
  }

  const items: PrayerTimeItem[] = prayerConfig.map((cfg) => {
    const pObj = schedule.prayers[cfg.key];
    const pDate = pObj.dateObj;
    const isNext = cfg.key === nextAdhanKey;
    const isCurrent = cfg.key === currentAdhanKey;
    const isPast = pDate.getTime() < nowMs && !isNext;

    return {
      key: cfg.key,
      name: cfg.name,
      arabicName: cfg.arabicName,
      sinhalaName: cfg.sinhalaName,
      tamilName: cfg.tamilName,
      timeFormatted: pObj.time12,
      time24: pObj.time24,
      dateObj: pDate,
      isNext,
      isCurrent,
      isPast,
      iconName: cfg.iconName,
      meaning: cfg.meaning,
    };
  });

  const nextPrayerItem = items.find(i => i.key === nextAdhanKey) || items[0];
  const currentPrayerItem = items.find(i => i.key === currentAdhanKey) || items[0];

  // Calculate seconds remaining to next Adhan
  let nextTargetMs = nextPrayerItem.dateObj.getTime();
  if (isNextTomorrow) {
    nextTargetMs += 24 * 60 * 60 * 1000; // +1 day
  }

  const diffMs = Math.max(0, nextTargetMs - nowMs);
  const timeRemainingSeconds = Math.floor(diffMs / 1000);

  // Interval calculation from current Adhan to next Adhan
  let prevTimeMs = currentPrayerItem.dateObj.getTime();
  if (currentAdhanKey === 'Isha' && (nextAdhanKey === 'Fajr' || isNextTomorrow)) {
    if (!isNextTomorrow) {
      // Before Fajr today, current is yesterday's Isha
      prevTimeMs -= 24 * 60 * 60 * 1000;
    }
  }

  const totalIntervalMs = Math.max(1, nextTargetMs - prevTimeMs);

  return {
    items,
    nextPrayer: nextPrayerItem,
    currentPrayer: currentPrayerItem,
    timeRemainingSeconds,
    totalIntervalSeconds: Math.floor(totalIntervalMs / 1000),
  };
}
