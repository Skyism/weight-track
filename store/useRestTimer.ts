import { create } from 'zustand';

interface RestTimerState {
  running: boolean;
  remaining: number; // seconds left
  duration: number; // seconds the timer was started with
  start: (seconds: number) => void;
  stop: () => void;
  addTime: (seconds: number) => void;
}

let interval: ReturnType<typeof setInterval> | null = null;

function clear() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

export const useRestTimer = create<RestTimerState>((set, get) => ({
  running: false,
  remaining: 0,
  duration: 0,

  start: (seconds) => {
    clear();
    set({ running: true, duration: seconds, remaining: seconds });
    interval = setInterval(() => {
      const next = get().remaining - 1;
      if (next <= 0) {
        clear();
        set({ running: false, remaining: 0 });
      } else {
        set({ remaining: next });
      }
    }, 1000);
  },

  stop: () => {
    clear();
    set({ running: false, remaining: 0, duration: 0 });
  },

  addTime: (seconds) => {
    const { remaining, duration, running } = get();
    if (!running) return;
    set({ remaining: Math.max(0, remaining + seconds), duration: duration + seconds });
  },
}));
