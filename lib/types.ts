// Domain types for Weight Track. DB columns use these exact camelCase names.

export type Unit = 'kg' | 'lb';

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Other';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Other',
];

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup | null;
  createdAt: string; // ISO timestamp
}

export interface WorkoutDay {
  id: string;
  exerciseId: string;
  date: string; // 'YYYY-MM-DD'
  note: string | null;
}

export interface SetEntry {
  id: string;
  workoutDayId: string;
  orderIndex: number; // 0-based position within the day
  reps: number;
  weight: number;
  unit: Unit;
}

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  orderIndex: number;
}

// Composite read models
export interface WorkoutDayWithSets extends WorkoutDay {
  sets: SetEntry[];
}

export interface RoutineWithExercises extends Routine {
  exercises: Exercise[];
}

export interface FoodEntry {
  id: string;
  date: string; // 'YYYY-MM-DD'
  name: string;
  calories: number;
  protein: number; // grams
  createdAt: string;
}

/** Aggregated calories/protein for a single day. */
export interface DailyNutrition {
  date: string; // 'YYYY-MM-DD'
  calories: number;
  protein: number;
}

// Input payloads
export interface NewSetInput {
  reps: number;
  weight: number;
  unit: Unit;
}

export interface NewFoodInput {
  name: string;
  calories: number;
  protein: number;
}

/** A one-tap quick-add used by the Home Screen widget. */
export interface QuickAddPreset {
  id: string;
  name: string;
  calories: number;
  protein: number;
}
