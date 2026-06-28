import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  ScrollView, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useRTL } from '../../src/hooks/useRTL';
import { useScreenHeight } from '../../src/hooks/useScreenHeight';
import { Currency, Language } from '../../src/types';

const CURRENCIES: { value: Currency; labelKey: string; symbol: string }[] = [
  { value: 'USD', labelKey: 'settings.usd', symbol: '$' },
  { value: 'ILS', labelKey: 'settings.ils', symbol: '₪' },
];

const LANGUAGES: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.english' },
  { value: 'he', labelKey: 'settings.hebrew' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { row, textAlign } = useRTL();
  const screenHeight = useScreenHeight();
  const { settings, setCurrency, setLanguage } = useSettingsStore();
  const { resetAll } = useBudgetStore();
  const { household, signOut } = useAuthStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReset = () => {
    resetAll();
    setShowResetConfirm(false);
  };

  const handleCopyCode = async () => {
    if (!household?.inviteCode) return;
    await Clipboard.setStringAsync(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: t('misc.cancel'), style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView className="bg-surface" style={{ height: screenHeight, flex: screenHeight ? undefined : 1 }}>
      <View
        className="flex-row items-center px-4 py-3 bg-white border-b border-slate-100"
        style={{ flexDirection: row }}
      >
        <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Household */}
        {household && (
          <>
            <SectionHeader label={t('settings.household')} />
            <View className="bg-white mx-4 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <View className="px-4 py-4 border-b border-slate-100" style={{ flexDirection: row }}>
                <View className="w-9 h-9 rounded-full bg-brand-50 items-center justify-center mr-3">
                  <Ionicons name="home-outline" size={18} color="#0284c7" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs mb-0.5">{t('settings.householdName')}</Text>
                  <Text className="text-slate-800 font-semibold">{household.name}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleCopyCode}
                className="px-4 py-4 flex-row items-center"
                style={{ flexDirection: row }}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 rounded-full bg-brand-50 items-center justify-center mr-3">
                  <Ionicons name="key-outline" size={18} color="#0284c7" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs mb-0.5">{t('settings.inviteCode')}</Text>
                  <Text className="text-slate-800 font-mono font-bold tracking-widest">{household.inviteCode}</Text>
                </View>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={copied ? '#10b981' : '#94a3b8'}
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Currency */}
        <SectionHeader label={t('settings.currency')} />
        <View className="bg-white mx-4 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
          {CURRENCIES.map((c, idx) => {
            const selected = settings.currency === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                onPress={() => setCurrency(c.value)}
                className={`flex-row items-center px-4 py-4 ${idx < CURRENCIES.length - 1 ? 'border-b border-slate-100' : ''}`}
                style={{ flexDirection: row }}
                activeOpacity={0.7}
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: selected ? '#0284c718' : '#f1f5f9' }}
                >
                  <Text className="font-bold text-base" style={{ color: selected ? '#0284c7' : '#64748b' }}>
                    {c.symbol}
                  </Text>
                </View>
                <Text className="flex-1 text-slate-800 font-medium" style={{ textAlign }}>
                  {t(c.labelKey)}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={22} color="#0284c7" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Language */}
        <SectionHeader label={t('settings.language')} />
        <View className="bg-white mx-4 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
          {LANGUAGES.map((l, idx) => {
            const selected = settings.language === l.value;
            return (
              <TouchableOpacity
                key={l.value}
                onPress={() => setLanguage(l.value)}
                className={`flex-row items-center px-4 py-4 ${idx < LANGUAGES.length - 1 ? 'border-b border-slate-100' : ''}`}
                style={{ flexDirection: row }}
                activeOpacity={0.7}
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: selected ? '#0284c718' : '#f1f5f9' }}
                >
                  <Text className="font-bold text-xs" style={{ color: selected ? '#0284c7' : '#64748b' }}>
                    {l.value.toUpperCase()}
                  </Text>
                </View>
                <Text className="flex-1 text-slate-800 font-medium" style={{ textAlign }}>
                  {t(l.labelKey)}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={22} color="#0284c7" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Danger zone */}
        <SectionHeader label={t('settings.dangerZone')} />
        <View className="mx-4 rounded-2xl overflow-hidden border border-red-200" style={{ shadowColor: '#ef4444', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 }}>
          <TouchableOpacity
            onPress={() => setShowResetConfirm(true)}
            className="flex-row items-center px-4 py-4 bg-white border-b border-red-100"
            style={{ flexDirection: row }}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-full items-center justify-center mr-3 bg-red-50">
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-500 font-semibold text-sm">{t('settings.eraseAll')}</Text>
              <Text className="text-slate-400 text-xs mt-0.5">{t('settings.eraseAllDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center px-4 py-4 bg-white"
            style={{ flexDirection: row }}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-full items-center justify-center mr-3 bg-red-50">
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-500 font-semibold text-sm">{t('settings.signOut')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reset confirmation modal */}
      <Modal visible={showResetConfirm} transparent animationType="fade">
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View
            className="bg-white rounded-3xl mx-6 p-6"
            style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 }}
          >
            <View className="w-14 h-14 rounded-full bg-red-50 items-center justify-center self-center mb-4">
              <Ionicons name="warning" size={28} color="#ef4444" />
            </View>
            <Text className="text-slate-800 font-bold text-lg text-center mb-2">
              {t('settings.eraseConfirmTitle')}
            </Text>
            <Text className="text-slate-500 text-sm text-center mb-1">
              {t('settings.eraseConfirmSub')}
            </Text>
            <Text className="text-slate-500 text-sm text-center mb-4">
              {t('settings.eraseConfirmItems')}
            </Text>
            <View className="bg-red-50 rounded-xl px-4 py-2.5 mb-6">
              <Text className="text-red-600 text-xs font-semibold text-center">
                {t('settings.eraseWarning')}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 py-3 rounded-2xl items-center bg-red-500"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-sm">{t('settings.eraseConfirmBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-2xl items-center bg-slate-100"
                activeOpacity={0.8}
              >
                <Text className="text-slate-600 font-bold text-sm">{t('misc.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({ label }: { label: string }) {
  const { textAlign } = useRTL();
  return (
    <Text
      className="text-slate-500 text-xs font-bold uppercase tracking-widest mx-4 mt-6 mb-2"
      style={{ textAlign }}
    >
      {label}
    </Text>
  );
}
