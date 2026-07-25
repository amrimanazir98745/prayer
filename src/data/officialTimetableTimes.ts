import officialData from './officialTimetableTimes.json';

export interface OfficialDayTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export type OfficialTimetableData = Record<string, Record<string, Record<string, OfficialDayTimes>>>;

const timetableData = officialData as unknown as OfficialTimetableData;

export function getOfficialPrayerTimes(
  districtId: string,
  monthIndex: number, // 0-11
  dayNumber: number // 1-31
): OfficialDayTimes | null {
  if (!districtId) return null;
  const normId = districtId.toLowerCase().trim();
  const districtObj = timetableData[normId];
  if (!districtObj) return null;

  const monthObj = districtObj[String(monthIndex)];
  if (!monthObj) return null;

  const dayObj = monthObj[String(dayNumber)];
  if (!dayObj) return null;

  return dayObj;
}
