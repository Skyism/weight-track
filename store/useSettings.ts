import { create } from 'zustand';
import { getSetting, setSetting } from '../db/repo';
import { Unit } from '../lib/types';

const KEY_UNIT = 'unit';
const KEY_REST = 'restTimerSeconds';
const KEY_CALORIE_TARGET = 'calorieTarget';
const KEY_PROTEIN_TARGET = 'proteinTarget';

interface SettingsState {
  unit: Unit;
  restTimerSeconds: number;
  calorieTarget: number;
  proteinTarget: number;
  loaded: boolean;
  load: () => Promise<void>;
  setUnit: (unit: Unit) => Promise<void>;
  setRestTimerSeconds: (seconds: number) => Promise<void>;
  setCalorieTarget: (calories: number) => Promise<void>;
  setProteinTarget: (grams: number) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  unit: 'kg',
  restTimerSeconds: 90,
  calorieTarget: 2000,
  proteinTarget: 160,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const [unit, rest, cal, protein] = await Promise.all([
      getSetting(KEY_UNIT),
      getSetting(KEY_REST),
      getSetting(KEY_CALORIE_TARGET),
      getSetting(KEY_PROTEIN_TARGET),
    ]);
    set({
      unit: unit === 'lb' ? 'lb' : 'kg',
      restTimerSeconds: rest ? Number(rest) || 90 : 90,
      calorieTarget: cal ? Number(cal) || 2000 : 2000,
      proteinTarget: protein ? Number(protein) || 160 : 160,
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
}));
