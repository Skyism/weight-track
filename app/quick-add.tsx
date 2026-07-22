import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { addFood, todayISODate } from '../db/repo';
import { syncWidget } from '../lib/widgetSync';
import { useSettings } from '../store/useSettings';
import { colors } from '../theme/theme';

/**
 * Deep-link target for the widget's quick-add fallback (iOS < 17, where interactive
 * App Intents aren't available): weighttrack://quick-add?preset=<id>.
 * Logs the preset, syncs the widget, then jumps to the Nutrition tab.
 */
export default function QuickAdd() {
  const { preset } = useLocalSearchParams<{ preset?: string }>();

  useEffect(() => {
    (async () => {
      const p = useSettings.getState().presets.find((x) => x.id === preset);
      if (p) {
        await addFood(todayISODate(), { name: p.name, calories: p.calories, protein: p.protein });
        await syncWidget();
      }
      router.replace('/(tabs)/nutrition');
    })();
  }, [preset]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
