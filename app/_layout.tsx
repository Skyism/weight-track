import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  SplineSansMono_400Regular,
  SplineSansMono_500Medium,
  useFonts,
} from '@expo-google-fonts/spline-sans-mono';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../db';
import { drainPending, syncWidget } from '../lib/widgetSync';
import { useSettings } from '../store/useSettings';
import { colors, font } from '../theme/theme';

export default function RootLayout() {
  const [dataReady, setDataReady] = useState(false);
  const loadSettings = useSettings((s) => s.load);

  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    SplineSansMono_400Regular,
    SplineSansMono_500Medium,
  });

  useEffect(() => {
    (async () => {
      await getDb(); // run migrations
      await loadSettings();
      setDataReady(true);
      // Import any quick-adds the widget queued while backgrounded, then refresh it.
      await drainPending();
      await syncWidget();
    })();
  }, [loadSettings]);

  // On every foreground, drain widget quick-adds and re-publish the snapshot.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        drainPending().then(syncWidget);
      }
    });
    return () => sub.remove();
  }, []);

  const ready = dataReady && fontsLoaded;

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: font.semibold, fontSize: 17, color: colors.text },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
