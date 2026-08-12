import * as Bridge from '../modules/widget-bridge';
import { addFood, listFoodForDate, todayISODate } from '../db/repo';
import { useSettings } from '../store/useSettings';

const KEY_SNAPSHOT = 'snapshot';
const KEY_PENDING = 'pending';

interface PendingAdd {
  id: string;
  calories: number;
  protein: number;
  presetName?: string;
}

/**
 * Push today's totals, targets, and presets to the App Group so the widget can
 * render progress + quick-add buttons, then reload the widget timeline.
 * No-op when the native bridge is absent (Expo Go / web / pre-prebuild).
 */
export async function syncWidget(): Promise<void> {
  if (!Bridge.isWidgetBridgeAvailable) return;
  const date = todayISODate();
  const entries = await listFoodForDate(date);
  const calories = entries.reduce((sum, e) => sum + e.calories, 0);
  const protein = entries.reduce((sum, e) => sum + e.protein, 0);
  const { calorieTarget, proteinTarget, presets } = useSettings.getState();

  Bridge.setItem(
    KEY_SNAPSHOT,
    JSON.stringify({ date, calories, protein, calorieTarget, proteinTarget, presets })
  );
  Bridge.reloadWidgets();
}

/**
 * Import quick-adds the widget queued while the app was backgrounded, writing
 * them as today's food entries, then clear the queue.
 */
export async function drainPending(): Promise<void> {
  if (!Bridge.isWidgetBridgeAvailable) return;
  const raw = Bridge.getItem(KEY_PENDING);
  if (!raw) return;

  let items: PendingAdd[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) items = parsed as PendingAdd[];
  } catch {
    items = [];
  }
  // Clear immediately to minimize the window for a widget append race.
  Bridge.setItem(KEY_PENDING, '[]');
  if (items.length === 0) return;

  const date = todayISODate();
  for (const item of items) {
    await addFood(date, {
      name: item.presetName || 'Quick add',
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
    });
  }
}
