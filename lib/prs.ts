import { WorkoutDayWithSets } from './types';
import { epley1RMkg, toKg } from './units';

export interface DayMetrics {
  dayId: string;
  date: string; // 'YYYY-MM-DD'
  topSetKg: number; // heaviest single set (kg)
  totalVolumeKg: number; // sum of reps * weight across all sets (kg)
  best1RMkg: number; // best Epley estimated 1RM across sets (kg)
  isWeightPR: boolean; // heaviest set ever, up to and including this day
  is1RMPR: boolean; // best estimated 1RM ever, up to and including this day
}

/**
 * Compute per-day metrics in chronological (ascending) order and flag PRs.
 * Accepts days in any order (the repo returns them date-desc).
 */
export function computeDayMetrics(days: WorkoutDayWithSets[]): DayMetrics[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let maxWeightKg = 0;
  let max1RMkg = 0;

  return sorted.map((day) => {
    let topSetKg = 0;
    let totalVolumeKg = 0;
    let best1RMkg = 0;

    for (const set of day.sets) {
      const wKg = toKg(set.weight, set.unit);
      if (wKg > topSetKg) topSetKg = wKg;
      totalVolumeKg += set.reps * wKg;
      const oneRm = epley1RMkg(set.weight, set.reps, set.unit);
      if (oneRm > best1RMkg) best1RMkg = oneRm;
    }

    const isWeightPR = topSetKg > 0 && topSetKg > maxWeightKg;
    const is1RMPR = best1RMkg > 0 && best1RMkg > max1RMkg;
    if (isWeightPR) maxWeightKg = topSetKg;
    if (is1RMPR) max1RMkg = best1RMkg;

    return {
      dayId: day.id,
      date: day.date,
      topSetKg,
      totalVolumeKg,
      best1RMkg,
      isWeightPR,
      is1RMPR,
    };
  });
}
