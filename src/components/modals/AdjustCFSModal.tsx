import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTL } from '../../hooks/useRTL';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';

interface AdjustCFSModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AdjustCFSModal({ visible, onClose }: AdjustCFSModalProps) {
  const { t } = useTranslation();
  const { isRTL, row, textAlign } = useRTL();
  const { addAdjustment } = useBudgetStore();

  const [isNegative, setIsNegative] = useState(false);
  const [amount, setAmount]         = useState('');
  const [note, setNote]             = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) e.amount = t('errors.amountRequired');
    if (!note.trim())                        e.note   = t('errors.noteRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      addAdjustment({ amount: parseFloat(amount), isNegative, note: note.trim() });
      resetAndClose();
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setAmount(''); setNote(''); setIsNegative(false); setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pt-3 pb-8 px-5" style={{ maxHeight: '80%' }}>
            <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />

            <View className="flex-row items-center justify-between mb-5" style={{ flexDirection: row }}>
              <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
                {t('modals.adjustCFS')}
              </Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Add / Subtract toggle */}
              <View className="flex-row mb-4 bg-slate-100 rounded-xl p-1" style={{ flexDirection: row }}>
                <TouchableOpacity
                  onPress={() => setIsNegative(false)}
                  className="flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1"
                  style={{ backgroundColor: !isNegative ? '#fff' : 'transparent', flexDirection: row }}
                >
                  <Ionicons name="add" size={16} color={!isNegative ? '#10b981' : '#94a3b8'} />
                  <Text className="text-sm font-semibold" style={{ color: !isNegative ? '#10b981' : '#94a3b8' }}>
                    {t('modals.addAdjustment')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsNegative(true)}
                  className="flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1"
                  style={{ backgroundColor: isNegative ? '#fff' : 'transparent', flexDirection: row }}
                >
                  <Ionicons name="remove" size={16} color={isNegative ? '#ef4444' : '#94a3b8'} />
                  <Text className="text-sm font-semibold" style={{ color: isNegative ? '#ef4444' : '#94a3b8' }}>
                    {t('modals.subtractAdjustment')}
                  </Text>
                </TouchableOpacity>
              </View>

              <AmountInput
                value={amount}
                onChangeText={(v) => { setAmount(v); setErrors((e) => ({ ...e, amount: '' })); }}
                label={t('transactions.amount')}
                error={errors.amount}
                autoFocus
              />

              <Text className="text-sm font-medium text-slate-600 mb-1 mt-2" style={{ textAlign }}>
                {t('transactions.note')}
                <Text className="text-expense"> *</Text>
              </Text>
              <TextInput
                value={note}
                onChangeText={(v) => { setNote(v); setErrors((e) => ({ ...e, note: '' })); }}
                placeholder={t('modals.adjustPlaceholder')}
                placeholderTextColor="#94a3b8"
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 mb-1"
              />
              {errors.note && <Text className="text-expense text-xs mb-3">{errors.note}</Text>}

              <View className="flex-row gap-3 mt-4" style={{ flexDirection: row }}>
                <Button label={t('misc.cancel')} variant="secondary" onPress={resetAndClose} style={{ flex: 1 }} />
                <Button
                  label={t('misc.save')}
                  variant="primary"
                  onPress={handleSave}
                  loading={loading}
                  style={{ flex: 1, backgroundColor: isNegative ? '#ef4444' : '#10b981' }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
