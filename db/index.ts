import * as SQLite from 'expo-sqlite';

const DB_NAME = 'weighttrack.db';
const SCHEMA_VERSION = 2;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Returns a singleton, migrated database connection. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        muscleGroup TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workout_days (
        id TEXT PRIMARY KEY NOT NULL,
        exerciseId TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        note TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_days_exercise ON workout_days(exerciseId, date);

      CREATE TABLE IF NOT EXISTS set_entries (
        id TEXT PRIMARY KEY NOT NULL,
        workoutDayId TEXT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
        orderIndex INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight REAL NOT NULL,
        unit TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sets_day ON set_entries(workoutDayId, orderIndex);

      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS routine_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        routineId TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
        exerciseId TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        orderIndex INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_routine_ex ON routine_exercises(routineId, orderIndex);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }

  if (current < 2) {
    // Nutrition tracking: one row per logged food item, dated by day.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS food_entries (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_food_date ON food_entries(date);
    `);
  }

  if (current < SCHEMA_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  return db;
}
