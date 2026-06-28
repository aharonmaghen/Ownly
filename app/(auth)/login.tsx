import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const { signIn, loading, error, clearError } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    clearError();
    signIn(email.trim(), password);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-brand-600">Ownly</Text>
          <Text className="text-slate-400 mt-1 text-sm">Your household budget</Text>
        </View>

        <View className="bg-white rounded-3xl p-6" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
          <Text className="text-xl font-bold text-slate-800 mb-6">Sign in</Text>

          {error ? (
            <View className="bg-red-50 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          <Text className="text-sm font-medium text-slate-600 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 mb-4"
          />

          <Text className="text-sm font-medium text-slate-600 mb-1">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoComplete="password"
            className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 mb-6"
          />

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            className="bg-brand-600 rounded-2xl py-3.5 items-center"
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base">Sign in</Text>
            }
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-slate-500 text-sm">Don't have an account?</Text>
          <Link href="/(auth)/signup">
            <Text className="text-brand-600 font-semibold text-sm">Sign up</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
