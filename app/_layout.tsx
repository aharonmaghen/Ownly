// @ts-ignore — css side-effect import handled by NativeWind metro transformer
import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useSettingsStore } from '../src/store/settingsStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    // Sync I18nManager with persisted settings on cold start
    if (I18nManager.isRTL !== settings.isRTL) {
      I18nManager.allowRTL(settings.isRTL);
      I18nManager.forceRTL(settings.isRTL);
    }
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
