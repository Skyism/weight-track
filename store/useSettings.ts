import { create } from 'zustand';
import { getSetting, setSetting } from '../db/repo';
import { Unit } from '../lib/types';

const KEY_UNIT = 'unit';
const KEY_REST = 'restTimerSeconds';

interface SettingsState {
  unit: Unit;
  restTimerSeconds: number;
  loaded: boolean;
  load: () => Promise<void>;
  setUnit: (unit: Unit) => Promise<void>;
  setRestTimerSeconds: (seconds: number) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  unit: 'kg',
  restTimerSeconds: 90,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const [unit, rest] = await Promise.all([getSetting(KEY_UNIT), getSetting(KEY_REST)]);
    set({
      unit: unit === 'lb' ? 'lb' : 'kg',
      restTimerSeconds: rest ? Number(rest) || 90 : 90,
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
}));
