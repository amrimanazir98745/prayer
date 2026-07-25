import fs from 'fs';
import { TIMETABLE_MEDIA_MAP } from './src/data/timetableMedia.js';

const DISTRICT_IDS = [
  'colombo', 'gampaha', 'kalutara', 'kandy', 'matale', 'nuwaraeliya',
  'galle', 'matara', 'hambantota', 'jaffna', 'kilinochchi', 'mannar',
  'vavuniya', 'mullaitivu', 'batticaloa', 'ampara', 'trincomalee',
  'kurunegala', 'puttalam', 'anuradhapura', 'polonnaruwa', 'badulla',
  'monaragala', 'ratnapura', 'kegalle'
];

let missingCount = 0;
for (const d of DISTRICT_IDS) {
  for (let m = 0; m < 12; m++) {
    const item = TIMETABLE_MEDIA_MAP[d]?.[m];
    if (!item || !item.imageUrl) {
      console.log(`Missing image for district: ${d}, month: ${m + 1}`);
      missingCount++;
    }
  }
}
console.log(`Total missing: ${missingCount}`);
