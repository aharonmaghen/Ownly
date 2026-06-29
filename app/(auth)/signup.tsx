import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useRTL } from '../../src/hooks/useRTL';

export default function SignupScreen() {
  const { signUp, loading, error, clearError } = useAuthStore();
  const { setLanguage, setCurrency } = useSettingsStore();
  const { t, language } = useTranslation();
  const { isRTL, textAlign } = useRTL();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [mode,       setMode]       = useState<'new' | 'join'>('new');

  const handleSignUp = async () => {
    clearError();
    await signUp(email.trim(), password, mode === 'join' ? inviteCode : undefined);
    // Default to ILS + Hebrew if the user signed up while in Hebrew
    if (!useAuthStore.getState().error && language === 'he') {
      setCurrency('ILS');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Language toggle */}
      <View className="absolute top-14 right-4 z-10 flex-row bg-white rounded-full border border-slate-200 overflow-hidden"
        style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
        <TouchableOpacity
          onPress={() => setLanguage('en')}
          className={`px-3 py-1.5 ${language === 'en' ? 'bg-brand-600' : 'bg-transparent'}`}
        >
          <Text className={`text-xs font-semibold ${language === 'en' ? 'text-white' : 'text-slate-500'}`}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setLanguage('he')}
          className={`px-3 py-1.5 ${language === 'he' ? 'bg-brand-600' : 'bg-transparent'}`}
        >
          <Text className={`text-xs font-semibold ${language === 'he' ? 'text-white' : 'text-slate-500'}`}>עב</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-brand-600">Ownly</Text>
          <Text className="text-slate-400 mt-1 text-sm">{t('auth.tagline')}</Text>
        </View>

        <View className="bg-white rounded-3xl p-6" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
          <Text className="text-xl font-bold text-slate-800 mb-4" style={{ textAlign }}>{t('auth.createAccount')}</Text>

          {/* Mode toggle */}
          <View className="flex-row bg-slate-100 rounded-2xl p-1 mb-5">
            <TouchableOpacity
              onPress={() => setMode('new')}
              className={`flex-1 py-2 rounded-xl items-center ${mode === 'new' ? 'bg-white' : ''}`}
              style={mode === 'new' ? { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 } : {}}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-semibold ${mode === 'new' ? 'text-brand-600' : 'text-slate-500'}`}>
                {t('auth.newHousehold')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('join')}
              className={`flex-1 py-2 rounded-xl items-center ${mode === 'join' ? 'bg-white' : ''}`}
              style={mode === 'join' ? { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 } : {}}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-semibold ${mode === 'join' ? 'text-brand-600' : 'text-slate-500'}`}>
                {t('auth.joinHousehold')}
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="bg-red-50 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm" style={{ textAlign }}>{error}</Text>
            </View>
          ) : null}

          <Text className="text-sm font-medium text-slate-600 mb-1" style={{ textAlign }}>{t('auth.email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textAlign={isRTL ? 'right' : 'left'}
            className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 mb-4"
          />

          <Text className="text-sm font-medium text-slate-600 mb-1" style={{ textAlign }}>{t('auth.password')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoComplete="new-password"
            textAlign={isRTL ? 'right' : 'left'}
            className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 mb-4"
          />

          {mode === 'join' && (
            <>
              <Text className="text-sm font-medium text-slate-600 mb-1" style={{ textAlign }}>{t('auth.inviteCode')}</Text>
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder={t('auth.inviteCodePlaceholder')}
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                maxLength={8}
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 mb-4"
              />
            </>
          )}

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className="bg-brand-600 rounded-2xl py-3.5 items-center mt-2"
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base">
                  {mode === 'join' ? t('auth.joinHouseholdBtn') : t('auth.createHousehold')}
                </Text>
            }
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-slate-500 text-sm">{t('auth.alreadyHaveAccount')}</Text>
          <Link href="/(auth)/login">
            <Text className="text-brand-600 font-semibold text-sm">{t('auth.signIn')}</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
