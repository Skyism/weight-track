import { create } from 'zustand';
import { getSetting, setSetting } from '../db/repo';
import { QuickAddPreset, Unit } from '../lib/types';

const KEY_UNIT = 'unit';
const KEY_REST = 'restTimerSeconds';
const KEY_CALORIE_TARGET = 'calorieTarget';
const KEY_PROTEIN_TARGET = 'proteinTarget';
const KEY_PRESETS = 'quickAddPresets';

export const DEFAULT_PRESETS: QuickAddPreset[] = [
  { id: 'snack', name: 'Snack', calories: 200, protein: 10 },
  { id: 'meal', name: 'Meal', calories: 600, protein: 40 },
  { id: 'protein', name: 'Protein', calories: 120, protein: 25 },
];

function parsePresets(raw: string | null): QuickAddPreset[] {
  if (!raw) return DEFAULT_PRESETS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as QuickAddPreset[];
  } catch {
    // fall through to defaults
  }
  return DEFAULT_PRESETS;
}

interface SettingsState {
  unit: Unit;
  restTimerSeconds: number;
  calorieTarget: number;
  proteinTarget: number;
  presets: QuickAddPreset[];
  loaded: boolean;
  load: () => Promise<void>;
  setUnit: (unit: Unit) => Promise<void>;
  setRestTimerSeconds: (seconds: number) => Promise<void>;
  setCalorieTarget: (calories: number) => Promise<void>;
  setProteinTarget: (grams: number) => Promise<void>;
  setPresets: (presets: QuickAddPreset[]) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  unit: 'kg',
  restTimerSeconds: 90,
  calorieTarget: 2000,
  proteinTarget: 160,
  presets: DEFAULT_PRESETS,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const [unit, rest, cal, protein, presets] = await Promise.all([
      getSetting(KEY_UNIT),
      getSetting(KEY_REST),
      getSetting(KEY_CALORIE_TARGET),
      getSetting(KEY_PROTEIN_TARGET),
      getSetting(KEY_PRESETS),
    ]);
    set({
      unit: unit === 'lb' ? 'lb' : 'kg',
      restTimerSeconds: rest ? Number(rest) || 90 : 90,
      calorieTarget: cal ? Number(cal) || 2000 : 2000,
      proteinTarget: protein ? Number(protein) || 160 : 160,
      presets: parsePresets(presets),
      loaded: true,
    });
  },

  setUnit: async (unit) => {
    set({ unit });
    await setSetting(KEY_UNIT, unit);
  },

  setRestTimerSeconds: async (seconds) => {
    set({ restTimerSeconds: seconds });
    await setSetting(KEY_REST, String(seconds));
  },

  setCalorieTarget: async (calories) => {
    set({ calorieTarget: calories });
    await setSetting(KEY_CALORIE_TARGET, String(calories));
  },

  setProteinTarget: async (grams) => {
    set({ proteinTarget: grams });
    await setSetting(KEY_PROTEIN_TARGET, String(grams));
  },

  setPresets: async (presets) => {
    set({ presets });
    await setSetting(KEY_PRESETS, JSON.stringify(presets));
  },
}));
