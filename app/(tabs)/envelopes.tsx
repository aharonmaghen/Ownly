import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, SafeAreaView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCurrency } from '../../src/hooks/useCurrency';
import { useRTL } from '../../src/hooks/useRTL';
import { EnvelopeCard } from '../../src/components/dashboard/EnvelopeCard';
import { EnvelopeFundsModal } from '../../src/components/modals/AllocateFundsModal';
import { AmountInput } from '../../src/components/ui/AmountInput';
import { Button } from '../../src/components/ui/Button';
import { Envelope } from '../../src/types';

const ICON_OPTIONS = [
  'shield-outline', 'airplane-outline', 'car-outline', 'home-outline',
  'school-outline', 'heart-outline', 'gift-outline', 'fitness-outline',
  'laptop-outline', 'musical-notes-outline', 'paw-outline', 'cart-outline',
];

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#0ea5e9', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#0284c7',
];

export default function EnvelopesScreen() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { row, textAlign, isRTL } = useRTL();
  const envelopes = useBudgetStore((s) => s.envelopes);
  const { addEnvelope, deleteEnvelope } = useBudgetStore();

  const [showAddForm, setShowAddForm]         = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(null);
  const [fundsMode, setFundsMode]             = useState<'deposit' | 'withdraw'>('deposit');
  const [name, setName]                       = useState('');
  const [target, setTarget]                   = useState('');
  const [icon, setIcon]                       = useState(ICON_OPTIONS[0]);
  const [color, setColor]                     = useState(COLOR_OPTIONS[0]);
  const [errors, setErrors]                   = useState<Record<string, string>>({});

  const totalInEnvelopes = envelopes.reduce((s, e) => s + e.balance, 0);

  const openDeposit = (env: Envelope) => {
    setSelectedEnvelope(env);
    setFundsMode('deposit');
  };

  const openWithdraw = (env: Envelope) => {
    setSelectedEnvelope(env);
    setFundsMode('withdraw');
  };

  const handleAdd = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('errors.nameRequired');
    if (Object.keys(e).length) { setErrors(e); return; }
    addEnvelope({
      name: name.trim(),
      targetAmount: target ? parseFloat(target) : undefined,
      icon,
      color,
    });
    setName(''); setTarget(''); setIcon(ICON_OPTIONS[0]); setColor(COLOR_OPTIONS[0]); setErrors({});
    setShowAddForm(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100"
        style={{ flexDirection: row }}
      >
        <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
          {t('envelopes.title')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="w-9 h-9 bg-brand-600 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Total in envelopes */}
      {envelopes.length > 0 && (
        <View className="bg-white mx-4 mt-4 rounded-2xl px-4 py-3 flex-row items-center justify-between" style={{ flexDirection: row, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
          <Text className="text-slate-500 text-sm">{t('banner.envelopes')}</Text>
          <Text className="font-bold text-lg text-brand-600">{format(totalInEnvelopes)}</Text>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
        {envelopes.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="save-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3 text-center">{t('envelopes.empty')}</Text>
          </View>
        ) : (
          envelopes.map((env) => (
            <View key={env.id}>
              <TouchableOpacity
                onLongPress={() =>
                  Alert.alert(env.name, undefined, [
                    { text: t('misc.delete'), style: 'destructive', onPress: () => deleteEnvelope(env.id) },
                    { text: t('misc.cancel'), style: 'cancel' },
                  ])
                }
                activeOpacity={1}
              >
                <EnvelopeCard
                  envelope={env}
                  onDeposit={() => openDeposit(env)}
                  onWithdraw={() => openWithdraw(env)}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Envelope Sheet */}
      <Modal visible={showAddForm} animationType="slide" transparent presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl pt-3 pb-10 px-5">
              <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />
              <Text className="text-xl font-bold text-slate-800 mb-4" style={{ textAlign }}>
                {t('envelopes.addTitle')}
              </Text>

              <Text className="text-sm font-medium text-slate-600 mb-1">{t('envelopes.name')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('envelopes.namePlaceholder')}
                placeholderTextColor="#94a3b8"
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 mb-1"
              />
              {errors.name && <Text className="text-expense text-xs mb-2">{errors.name}</Text>}

              <AmountInput value={target} onChangeText={setTarget} label={t('envelopes.target')} />

              {/* Icon picker */}
              <Text className="text-sm font-medium text-slate-600 mb-2">{t('envelopes.icon')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row gap-2">
                  {ICON_OPTIONS.map((ic) => (
                    <TouchableOpacity
                      key={ic}
                      onPress={() => setIcon(ic)}
                      className="w-10 h-10 rounded-xl items-center justify-center border"
                      style={{ borderColor: icon === ic ? color : '#e2e8f0', backgroundColor: icon === ic ? color + '18' : '#f8fafc' }}
                    >
                      <Ionicons name={ic as any} size={20} color={icon === ic ? color : '#94a3b8'} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Color picker */}
              <Text className="text-sm font-medium text-slate-600 mb-2">{t('envelopes.color')}</Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff', shadowColor: c, shadowOpacity: color === c ? 0.5 : 0, shadowRadius: 4, elevation: color === c ? 4 : 0 }}
                  />
                ))}
              </View>

              <View className="flex-row gap-3">
                <Button label={t('misc.cancel')} variant="secondary" onPress={() => { setShowAddForm(false); setErrors({}); }} style={{ flex: 1 }} />
                <Button label={t('misc.add')} variant="primary" onPress={handleAdd} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <EnvelopeFundsModal
        visible={!!selectedEnvelope}
        envelope={selectedEnvelope}
        mode={fundsMode}
        onClose={() => setSelectedEnvelope(null)}
      />
    </SafeAreaView>
  );
}
