// @ts-ignore — css side-effect import handled by NativeWind metro transformer
import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useSettingsStore } from '../src/store/settingsStore';
import { useAuthStore } from '../src/store/authStore';
import { useBudgetStore } from '../src/store/budgetStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { settings }  = useSettingsStore();
  const { initialize: initAuth, session, household, loading: authLoading } = useAuthStore();
  const { initialize: initBudget, cleanup } = useBudgetStore();
  const router   = useRouter();
  const segments = useSegments();

  // Sync RTL on cold start
  useEffect(() => {
    if (I18nManager.isRTL !== settings.isRTL) {
      I18nManager.allowRTL(settings.isRTL);
      I18nManager.forceRTL(settings.isRTL);
    }
  }, []);

  // Bootstrap auth
  useEffect(() => { initAuth(); }, []);

  // Initialize budget store when household is known
  useEffect(() => {
    if (household) {
      initBudget(household.id);
    } else {
      cleanup();
    }
  }, [household?.id]);

  // Route guard
  useEffect(() => {
    if (authLoading) return;
    SplashScreen.hideAsync();

    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [authLoading, session, segments]);

  if (authLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
