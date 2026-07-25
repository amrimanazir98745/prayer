import { District } from '../types/prayer';

export const SRI_LANKA_DISTRICTS: District[] = [
  { id: 'ampara', name: 'Ampara', province: 'Eastern Province', lat: 7.2912, lng: 81.6724 },
  { id: 'anuradhapura', name: 'Anuradhapura', province: 'North Central Province', lat: 8.3114, lng: 80.4037 },
  { id: 'badulla', name: 'Badulla', province: 'Uva Province', lat: 6.9934, lng: 81.0550 },
  { id: 'batticaloa', name: 'Batticaloa', province: 'Eastern Province', lat: 7.7170, lng: 81.7000 },
  { id: 'colombo', name: 'Colombo', province: 'Western Province', lat: 6.9271, lng: 79.8612, isCapital: true },
  { id: 'galle', name: 'Galle', province: 'Southern Province', lat: 6.0535, lng: 80.2210 },
  { id: 'gampaha', name: 'Gampaha', province: 'Western Province', lat: 7.0840, lng: 79.9925 },
  { id: 'hambantota', name: 'Hambantota', province: 'Southern Province', lat: 6.1248, lng: 81.1185 },
  { id: 'jaffna', name: 'Jaffna', province: 'Northern Province', lat: 9.6615, lng: 80.0255 },
  { id: 'kalutara', name: 'Kalutara', province: 'Western Province', lat: 6.5854, lng: 79.9607 },
  { id: 'kandy', name: 'Kandy', province: 'Central Province', lat: 7.2906, lng: 80.6337 },
  { id: 'kegalle', name: 'Kegalle', province: 'Sabaragamuwa Province', lat: 7.2513, lng: 80.3464 },
  { id: 'kilinochchi', name: 'Kilinochchi', province: 'Northern Province', lat: 9.3803, lng: 80.3992 },
  { id: 'kurunegala', name: 'Kurunegala', province: 'North Western Province', lat: 7.4863, lng: 80.3623 },
  { id: 'mannar', name: 'Mannar', province: 'Northern Province', lat: 8.9810, lng: 79.9044 },
  { id: 'matale', name: 'Matale', province: 'Central Province', lat: 7.4675, lng: 80.6234 },
  { id: 'matara', name: 'Matara', province: 'Southern Province', lat: 5.9549, lng: 80.5550 },
  { id: 'monaragala', name: 'Monaragala', province: 'Uva Province', lat: 6.8722, lng: 81.3510 },
  { id: 'mullaitivu', name: 'Mullaitivu', province: 'Northern Province', lat: 9.2671, lng: 80.8142 },
  { id: 'nuwaraeliya', name: 'Nuwara Eliya', province: 'Central Province', lat: 6.9497, lng: 80.7891 },
  { id: 'polonnaruwa', name: 'Polonnaruwa', province: 'North Central Province', lat: 7.9403, lng: 81.0188 },
  { id: 'puttalam', name: 'Puttalam', province: 'North Western Province', lat: 8.0362, lng: 79.8283 },
  { id: 'ratnapura', name: 'Ratnapura', province: 'Sabaragamuwa Province', lat: 6.6828, lng: 80.3992 },
  { id: 'trincomalee', name: 'Trincomalee', province: 'Eastern Province', lat: 8.5874, lng: 81.2152 },
  { id: 'vavuniya', name: 'Vavuniya', province: 'Northern Province', lat: 8.7542, lng: 80.4982 }
];

export const DEFAULT_DISTRICT = SRI_LANKA_DISTRICTS.find(d => d.id === 'batticaloa') || SRI_LANKA_DISTRICTS[5];

export function getDistrictById(id: string): District {
  return SRI_LANKA_DISTRICTS.find(d => d.id === id) || DEFAULT_DISTRICT;
}

export function findClosestDistrict(lat: number, lng: number): District {
  let minDistance = Infinity;
  let closest = DEFAULT_DISTRICT;

  for (const district of SRI_LANKA_DISTRICTS) {
    const dist = Math.hypot(district.lat - lat, district.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = district;
    }
  }

  return closest;
}
