import { randomUUID } from 'expo-crypto';
import { getDb } from './index';
import {
  Exercise,
  MuscleGroup,
  NewSetInput,
  Routine,
  RoutineWithExercises,
  SetEntry,
  Unit,
  WorkoutDay,
  WorkoutDayWithSets,
} from '../lib/types';

/** Local date as 'YYYY-MM-DD' (device timezone). */
export function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------- Exercises

export async function listExercises(): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY name COLLATE NOCASE ASC;');
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const db = await getDb();
  return db.getFirstAsync<Exercise>('SELECT * FROM exercises WHERE id = ?;', [id]);
}

export async function createExercise(input: {
  name: string;
  muscleGroup: MuscleGroup | null;
}): Promise<Exercise> {
  const db = await getDb();
  const ex: Exercise = {
    id: randomUUID(),
    name: input.name.trim(),
    muscleGroup: input.muscleGroup,
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    'INSERT INTO exercises (id, name, muscleGroup, createdAt) VALUES (?, ?, ?, ?);',
    [ex.id, ex.name, ex.muscleGroup, ex.createdAt]
  );
  return ex;
}

export async function updateExercise(
  id: string,
  input: { name: string; muscleGroup: MuscleGroup | null }
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE exercises SET name = ?, muscleGroup = ? WHERE id = ?;', [
    input.name.trim(),
    input.muscleGroup,
    id,
  ]);
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercises WHERE id = ?;', [id]);
}

// -------------------------------------------------------------- Workout days

async function loadSetsForDay(dayId: string): Promise<SetEntry[]> {
  const db = await getDb();
  return db.getAllAsync<SetEntry>(
    'SELECT * FROM set_entries WHERE workoutDayId = ? ORDER BY orderIndex ASC;',
    [dayId]
  );
}

/** All days for an exercise, newest first, each with its sets. */
export async function listDaysForExercise(exerciseId: string): Promise<WorkoutDayWithSets[]> {
  const db = await getDb();
  const days = await db.getAllAsync<WorkoutDay>(
    'SELECT * FROM workout_days WHERE exerciseId = ? ORDER BY date DESC, id DESC;',
    [exerciseId]
  );
  const result: WorkoutDayWithSets[] = [];
  for (const day of days) {
    result.push({ ...day, sets: await loadSetsForDay(day.id) });
  }
  return result;
}

export async function getDay(id: string): Promise<WorkoutDayWithSets | null> {
  const db = await getDb();
  const day = await db.getFirstAsync<WorkoutDay>('SELECT * FROM workout_days WHERE id = ?;', [id]);
  if (!day) return null;
  return { ...day, sets: await loadSetsForDay(day.id) };
}

/** Most recent prior day for an exercise — powers "copy last session" & reference hints. */
export async function getLastDayForExercise(
  exerciseId: string,
  excludeDayId?: string
): Promise<WorkoutDayWithSets | null> {
  const db = await getDb();
  const day = await db.getFirstAsync<WorkoutDay>(
    `SELECT * FROM workout_days
       WHERE exerciseId = ? AND id != ?
       ORDER BY date DESC, id DESC LIMIT 1;`,
    [exerciseId, excludeDayId ?? '']
  );
  if (!day) return null;
  return { ...day, sets: await loadSetsForDay(day.id) };
}

/** Create a day plus its sets atomically. */
export async function createDay(input: {
  exerciseId: string;
  date: string;
  note?: string | null;
  sets: NewSetInput[];
}): Promise<WorkoutDayWithSets> {
  const db = await getDb();
  const day: WorkoutDay = {
    id: randomUUID(),
    exerciseId: input.exerciseId,
    date: input.date,
    note: input.note ?? null,
  };
  const sets: SetEntry[] = input.sets.map((s, i) => ({
    id: randomUUID(),
    workoutDayId: day.id,
    orderIndex: i,
    reps: s.reps,
    weight: s.weight,
    unit: s.unit,
  }));
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO workout_days (id, exerciseId, date, note) VALUES (?, ?, ?, ?);',
      [day.id, day.exerciseId, day.date, day.note]
    );
    for (const s of sets) {
      await db.runAsync(
        'INSERT INTO set_entries (id, workoutDayId, orderIndex, reps, weight, unit) VALUES (?, ?, ?, ?, ?, ?);',
        [s.id, s.workoutDayId, s.orderIndex, s.reps, s.weight, s.unit]
      );
    }
  });
  return { ...day, sets };
}

export async function updateDay(
  id: string,
  input: { date?: string; note?: string | null }
): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<WorkoutDay>('SELECT * FROM workout_days WHERE id = ?;', [id]);
  if (!existing) return;
  await db.runAsync('UPDATE workout_days SET date = ?, note = ? WHERE id = ?;', [
    input.date ?? existing.date,
    input.note !== undefined ? input.note : existing.note,
    id,
  ]);
}

export async function deleteDay(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workout_days WHERE id = ?;', [id]);
}

/** Replace all sets for a day (used by the day editor's save). */
export async function replaceSetsForDay(dayId: string, sets: NewSetInput[]): Promise<SetEntry[]> {
  const db = await getDb();
  const rows: SetEntry[] = sets.map((s, i) => ({
    id: randomUUID(),
    workoutDayId: dayId,
    orderIndex: i,
    reps: s.reps,
    weight: s.weight,
    unit: s.unit,
  }));
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM set_entries WHERE workoutDayId = ?;', [dayId]);
    for (const s of rows) {
      await db.runAsync(
        'INSERT INTO set_entries (id, workoutDayId, orderIndex, reps, weight, unit) VALUES (?, ?, ?, ?, ?, ?);',
        [s.id, s.workoutDayId, s.orderIndex, s.reps, s.weight, s.unit]
      );
    }
  });
  return rows;
}

// ------------------------------------------------------------------ Sets (fine-grained)

export async function addSet(dayId: string, input: NewSetInput): Promise<SetEntry> {
  const db = await getDb();
  const countRow = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM set_entries WHERE workoutDayId = ?;',
    [dayId]
  );
  const set: SetEntry = {
    id: randomUUID(),
    workoutDayId: dayId,
    orderIndex: countRow?.n ?? 0,
    reps: input.reps,
    weight: input.weight,
    unit: input.unit,
  };
  await db.runAsync(
    'INSERT INTO set_entries (id, workoutDayId, orderIndex, reps, weight, unit) VALUES (?, ?, ?, ?, ?, ?);',
    [set.id, set.workoutDayId, set.orderIndex, set.reps, set.weight, set.unit]
  );
  return set;
}

export async function updateSet(
  id: string,
  input: { reps: number; weight: number; unit: Unit }
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE set_entries SET reps = ?, weight = ?, unit = ? WHERE id = ?;', [
    input.reps,
    input.weight,
    input.unit,
    id,
  ]);
}

export async function deleteSet(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM set_entries WHERE id = ?;', [id]);
}

// --------------------------------------------------------------------- Routines

export async function listRoutines(): Promise<Routine[]> {
  const db = await getDb();
  return db.getAllAsync<Routine>('SELECT * FROM routines ORDER BY name COLLATE NOCASE ASC;');
}

export async function getRoutineWithExercises(id: string): Promise<RoutineWithExercises | null> {
  const db = await getDb();
  const routine = await db.getFirstAsync<Routine>('SELECT * FROM routines WHERE id = ?;', [id]);
  if (!routine) return null;
  const exercises = await db.getAllAsync<Exercise>(
    `SELECT e.* FROM routine_exercises re
       JOIN exercises e ON e.id = re.exerciseId
       WHERE re.routineId = ?
       ORDER BY re.orderIndex ASC;`,
    [id]
  );
  return { ...routine, exercises };
}

export async function createRoutine(name: string): Promise<Routine> {
  const db = await getDb();
  const routine: Routine = {
    id: randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  await db.runAsync('INSERT INTO routines (id, name, createdAt) VALUES (?, ?, ?);', [
    routine.id,
    routine.name,
    routine.createdAt,
  ]);
  return routine;
}

export async function updateRoutine(id: string, input: { name: string }): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE routines SET name = ? WHERE id = ?;', [input.name.trim(), id]);
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM routines WHERE id = ?;', [id]);
}

/** Replace the ordered exercise list for a routine. */
export async function setRoutineExercises(routineId: string, exerciseIds: string[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM routine_exercises WHERE routineId = ?;', [routineId]);
    for (let i = 0; i < exerciseIds.length; i++) {
      await db.runAsync(
        'INSERT INTO routine_exercises (id, routineId, exerciseId, orderIndex) VALUES (?, ?, ?, ?);',
        [randomUUID(), routineId, exerciseIds[i], i]
      );
    }
  });
}

// --------------------------------------------------------------------- Settings

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?;',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value]
  );
}

// --------------------------------------------------------------------- Export

export interface ExportBundle {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  workoutDays: WorkoutDay[];
  setEntries: SetEntry[];
  routines: Routine[];
  routineExercises: { id: string; routineId: string; exerciseId: string; orderIndex: number }[];
}

/** Full data snapshot for backup/export. */
export async function exportAll(): Promise<ExportBundle> {
  const db = await getDb();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: await db.getAllAsync<Exercise>('SELECT * FROM exercises;'),
    workoutDays: await db.getAllAsync<WorkoutDay>('SELECT * FROM workout_days;'),
    setEntries: await db.getAllAsync<SetEntry>('SELECT * FROM set_entries;'),
    routines: await db.getAllAsync<Routine>('SELECT * FROM routines;'),
    routineExercises: await db.getAllAsync('SELECT * FROM routine_exercises;'),
  };
}
