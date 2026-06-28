import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useRTL } from '../../src/hooks/useRTL';

const TAB_CONFIGS = [
  { name: 'index',    titleKey: 'tabs.dashboard',  icon: 'grid-outline'      },
  { name: 'accounts', titleKey: 'tabs.budget',      icon: 'bar-chart-outline' },
  { name: 'envelopes',titleKey: 'tabs.envelopes',   icon: 'save-outline'      },
  { name: 'history',  titleKey: 'tabs.history',     icon: 'time-outline'      },
  { name: 'settings', titleKey: 'settings.title',   icon: 'settings-outline'  },
] as const;

export default function TabLayout() {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const ordered = isRTL ? [...TAB_CONFIGS].reverse() : TAB_CONFIGS;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        sceneStyle: { flex: 1 },
      }}
    >
      {ordered.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon as any} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
