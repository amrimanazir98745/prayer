import { QiblaInfo } from '../types/prayer';

export const MECCA_LAT = 21.422487;
export const MECCA_LNG = 39.826206;
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MILES = 3958.8;

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export interface WorldCityPreset {
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
}

export const POPULAR_WORLD_CITIES: WorldCityPreset[] = [
  { name: 'Mecca (Holy Kaaba)', country: 'Saudi Arabia', flag: '🇸🇦', lat: 21.4225, lng: 39.8262 },
  { name: 'Medina', country: 'Saudi Arabia', flag: '🇸🇦', lat: 24.4672, lng: 39.6112 },
  { name: 'Jerusalem', country: 'Palestine', flag: '🇵🇸', lat: 31.7767, lng: 35.2345 },
  { name: 'London', country: 'United Kingdom', flag: '🇬🇧', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', country: 'United States', flag: '🇺🇸', lat: 40.7128, lng: -74.0060 },
  { name: 'Toronto', country: 'Canada', flag: '🇨🇦', lat: 43.6532, lng: -79.3832 },
  { name: 'Paris', country: 'France', flag: '🇫🇷', lat: 48.8566, lng: 2.3522 },
  { name: 'Istanbul', country: 'Turkey', flag: '🇹🇷', lat: 41.0082, lng: 28.9784 },
  { name: 'Cairo', country: 'Egypt', flag: '🇪🇬', lat: 30.0444, lng: 31.2357 },
  { name: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', lat: 25.2048, lng: 55.2708 },
  { name: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', lat: 24.7136, lng: 46.6753 },
  { name: 'Karachi', country: 'Pakistan', flag: '🇵🇰', lat: 24.8607, lng: 67.0011 },
  { name: 'New Delhi', country: 'India', flag: '🇮🇳', lat: 28.6139, lng: 77.2090 },
  { name: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', lat: -6.2088, lng: 106.8456 },
  { name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', lat: 3.1390, lng: 101.6869 },
  { name: 'Colombo', country: 'Sri Lanka', flag: '🇱🇰', lat: 6.9271, lng: 79.8612 },
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093 },
  { name: 'Chicago', country: 'United States', flag: '🇺🇸', lat: 41.8781, lng: -87.6298 },
  { name: 'Singapore', country: 'Singapore', flag: '🇸🇬', lat: 1.3521, lng: 103.8198 },
  { name: 'São Paulo', country: 'Brazil', flag: '🇧🇷', lat: -23.5505, lng: -46.6333 },
  { name: 'Cape Town', country: 'South Africa', flag: '🇿🇦', lat: -33.9249, lng: 18.4241 },
];

/**
 * Calculates Great Circle initial bearing to Mecca in degrees from True North (0° - 360°)
 */
export function calculateQiblaBearing(userLat: number, userLng: number): number {
  const phi1 = userLat * D2R;
  const phi2 = MECCA_LAT * D2R;
  const deltaLambda = (MECCA_LNG - userLng) * D2R;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let bearing = Math.atan2(y, x) * R2D;
  bearing = (bearing + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

/**
 * Calculates Great Circle distance to Mecca in kilometers
 */
export function calculateDistanceToMeccaKm(userLat: number, userLng: number): number {
  const phi1 = userLat * D2R;
  const phi2 = MECCA_LAT * D2R;
  const deltaPhi = (MECCA_LAT - userLat) * D2R;
  const deltaLambda = (MECCA_LNG - userLng) * D2R;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c);
}

/**
 * Calculates Great Circle distance to Mecca in miles
 */
export function calculateDistanceToMeccaMiles(userLat: number, userLng: number): number {
  const km = calculateDistanceToMeccaKm(userLat, userLng);
  return Math.round(km * 0.621371);
}

/**
 * Converts 3D pitch (beta) and roll (gamma) to tilt-compensated magnetic and true heading
 * based on NOAA NGDC (National Geophysical Data Center) WMM formulation.
 */
export function computeTiltCompensatedHeading(
  alpha: number,
  beta: number | null,
  gamma: number | null,
  magneticDeclination = -2.2 // Sri Lanka average magnetic declination (~2.2° W)
): number {
  if (alpha === null || isNaN(alpha)) return 0;

  // Standard deviceorientation magnetic heading from alpha
  let rawMagHeading = (360 - alpha) % 360;
  if (rawMagHeading < 0) rawMagHeading += 360;

  // If no tilt sensors or flat surface, return declination-adjusted heading
  if (beta === null || gamma === null || (beta === 0 && gamma === 0)) {
    const trueHeading = (rawMagHeading + magneticDeclination + 360) % 360;
    return Math.round(trueHeading * 10) / 10;
  }

  // NOAA NGDC WMM 3D Tilt Compensation
  const pitch = (beta || 0) * D2R;
  const roll = (gamma || 0) * D2R;
  const yaw = rawMagHeading * D2R;

  const cPitch = Math.cos(pitch);
  const sPitch = Math.sin(pitch);
  const cRoll = Math.cos(roll);
  const sRoll = Math.sin(roll);
  const cYaw = Math.cos(yaw);
  const sYaw = Math.sin(yaw);

  // NOAA Geomag projection on horizontal plane
  const Xh = cYaw * cPitch + sYaw * sPitch * sRoll;
  const Yh = sYaw * cRoll;

  let heading = Math.atan2(-Yh, Xh) * R2D;
  if (heading < 0) heading += 360;

  // Convert Magnetic North to True Geographic North using Magnetic Declination
  const trueHeading = (heading + magneticDeclination + 360) % 360;
  return Math.round(trueHeading * 10) / 10;
}

/**
 * Smooth angle interpolation avoiding 360 -> 0 degree flip jumps
 */
export function smoothAngle(currentAngle: number, targetAngle: number, factor = 0.2): number {
  let diff = targetAngle - currentAngle;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  return (currentAngle + diff * factor + 360) % 360;
}

/**
 * Gets 16-point cardinal compass direction string for a given angle in degrees
 */
export function getCardinalDirection(angle: number): string {
  const norm = (angle + 360) % 360;
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(norm / 22.5) % 16;
  return directions[index];
}

export function getQiblaInfo(userLat: number, userLng: number, deviceHeading: number | null): QiblaInfo {
  const qiblaBearing = calculateQiblaBearing(userLat, userLng);
  const distanceKm = calculateDistanceToMeccaKm(userLat, userLng);

  let relativeAngle: number | null = null;
  let isAligned = false;

  if (deviceHeading !== null) {
    relativeAngle = (qiblaBearing - deviceHeading + 360) % 360;
    const diff = Math.min(Math.abs(qiblaBearing - deviceHeading), 360 - Math.abs(qiblaBearing - deviceHeading));
    isAligned = diff <= 3.5;
  }

  return {
    qiblaBearing,
    distanceKm,
    deviceHeading,
    relativeAngle,
    isAligned
  };
}

