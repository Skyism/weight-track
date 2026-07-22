import { Tabs } from 'expo-router';
import { DumbbellIcon, FlameIcon, ListIcon, SlidersIcon } from '../../components/icons';
import { colors, font, letterSpacing } from '../../theme/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontFamily: font.medium,
          fontSize: 10,
          letterSpacing: letterSpacing.wide,
          textTransform: 'uppercase',
        },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: font.semibold, fontSize: 17, color: colors.text },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <DumbbellIcon size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => <ListIcon size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => <FlameIcon size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <SlidersIcon size={24} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
