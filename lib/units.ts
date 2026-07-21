import { Unit } from './types';

export const KG_PER_LB = 0.45359237;

/** Convert a weight from one unit to another. */
export function convertWeight(weight: number, from: Unit, to: Unit): number {
  if (from === to) return weight;
  return from === 'lb' ? weight * KG_PER_LB : weight / KG_PER_LB;
}

/** Convert any weight to kilograms (canonical unit for comparisons). */
export function toKg(weight: number, unit: Unit): number {
  return convertWeight(weight, unit, 'kg');
}

/** Estimated one-rep max via the Epley formula, in the weight's own unit. */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Estimated 1RM normalized to kilograms, for cross-set comparison. */
export function epley1RMkg(weight: number, reps: number, unit: Unit): number {
  return toKg(epley1RM(weight, reps), unit);
}

/** Format a weight for display, trimming trailing zeros. */
export function formatWeight(weight: number, unit: Unit): string {
  const rounded = Math.round(weight * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
  return `${text} ${unit}`;
}
