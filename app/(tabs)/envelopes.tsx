import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCurrency } from '../../src/hooks/useCurrency';
import { useRTL } from '../../src/hooks/useRTL';
import { EnvelopeCard } from '../../src/components/dashboard/EnvelopeCard';
import { AmountInput } from '../../src/components/ui/AmountInput';
import { Button } from '../../src/components/ui/Button';
import { AllocateFundsModal } from '../../src/components/modals/AllocateFundsModal';

const ICON_OPTIONS = [
  'cart-outline','home-outline','car-outline','restaurant-outline',
  'medkit-outline','book-outline','game-controller-outline','shirt-outline',
  'airplane-outline','gift-outline','heart-outline','fitness-outline',
  'paw-outline','school-outline','musical-notes-outline','laptop-outline',
];

const COLOR_OPTIONS = [
  '#ef4444','#f97316','#f59e0b','#84cc16',
  '#10b981','#06b6d4','#0ea5e9','#6366f1',
  '#8b5cf6','#ec4899','#64748b','#0284c7',
];

export default function EnvelopesScreen() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isRTL, row, textAlign } = useRTL();
  const { envelopes, addEnvelope, deleteEnvelope, unallocatedPool } = useBudgetStore();
  const balances = useBudgetStore((s) => s.getEnvelopeBalances());

  const [showForm, setShowForm]       = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [name, setName]               = useState('');
  const [budget, setBudget]           = useState('');
  const [icon, setIcon]               = useState(ICON_OPTIONS[0]);
  const [color, setColor]             = useState(COLOR_OPTIONS[0]);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const handleAdd = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!budget || parseFloat(budget) <= 0) e.budget = 'Budget is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addEnvelope({ name: name.trim(), budgetedAmount: parseFloat(budget), icon, color });
    setName(''); setBudget(''); setIcon(ICON_OPTIONS[0]); setColor(COLOR_OPTIONS[0]); setErrors({});
    setShowForm(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100" style={{ flexDirection: row }}>
        <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
          {t('envelopes.title')}
        </Text>
        <View className="flex-row gap-2" style={{ flexDirection: row }}>
          {unallocatedPool > 0 && (
            <TouchableOpacity
              onPress={() => setShowAllocate(true)}
              className="bg-allocation/10 rounded-full px-3 py-1 flex-row items-center"
              style={{ flexDirection: row }}
            >
              <Ionicons name="swap-horizontal-outline" size={14} color="#8b5cf6" />
              <Text className="text-allocation text-xs font-bold ml-1">{format(unallocatedPool)}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            className="w-9 h-9 bg-brand-600 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
        {balances.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="mail-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3 text-center">{t('envelopes.empty')}</Text>
          </View>
        ) : (
          balances.map((b) => (
            <EnvelopeCard
              key={b.envelope.id}
              data={b}
              onPress={() =>
                Alert.alert(b.envelope.name, undefined, [
                  { text: t('misc.delete'), style: 'destructive', onPress: () => deleteEnvelope(b.envelope.id) },
                  { text: t('misc.cancel'), style: 'cancel' },
                ])
              }
            />
          ))
        )}
      </ScrollView>

      {/* Add Envelope Sheet */}
      <Modal visible={showForm} animationType="slide" transparent presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl pt-3 pb-10 px-5">
              <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />
              <Text className="text-xl font-bold text-slate-800 mb-4" style={{ textAlign }}>
                {t('envelopes.addTitle')}
              </Text>

              <Text className="text-sm font-medium text-slate-600 mb-1" style={{ textAlign }}>{t('envelopes.name')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Groceries"
                placeholderTextColor="#94a3b8"
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 mb-1"
              />
              {errors.name && <Text className="text-expense text-xs mb-2">{errors.name}</Text>}

              <AmountInput
                value={budget}
                onChangeText={setBudget}
                label={t('envelopes.budget')}
                error={errors.budget}
              />

              {/* Icon picker */}
              <Text className="text-sm font-medium text-slate-600 mb-2" style={{ textAlign }}>{t('envelopes.icon')}</Text>
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
              <Text className="text-sm font-medium text-slate-600 mb-2" style={{ textAlign }}>{t('envelopes.color')}</Text>
              <View className="flex-row flex-wrap gap-2 mb-5" style={{ flexDirection: row }}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: c,
                      borderWidth: color === c ? 3 : 0,
                      borderColor: '#fff',
                      shadowColor: color === c ? c : 'transparent',
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                      elevation: color === c ? 4 : 0,
                    }}
                  />
                ))}
              </View>

              <View className="flex-row gap-3" style={{ flexDirection: row }}>
                <Button label={t('misc.cancel')} variant="secondary" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
                <Button label={t('misc.add')} variant="primary" onPress={handleAdd} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AllocateFundsModal visible={showAllocate} onClose={() => setShowAllocate(false)} />
    </SafeAreaView>
  );
}
