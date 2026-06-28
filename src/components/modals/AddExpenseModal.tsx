import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTL } from '../../hooks/useRTL';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ visible, onClose }: AddExpenseModalProps) {
  const { t } = useTranslation();
  const { isRTL, row, textAlign } = useRTL();
  const { categories, addExpense } = useBudgetStore();

  const [amount, setAmount]         = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote]             = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) e.amount   = t('errors.amountRequired');
    if (!categoryId)                         e.category = t('errors.categoryRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      addExpense({ amount: parseFloat(amount), categoryId, note: note.trim() });
      resetAndClose();
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setAmount(''); setCategoryId(''); setNote(''); setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pt-3 pb-8 px-5" style={{ maxHeight: '92%' }}>
            <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />

            <View className="flex-row items-center justify-between mb-5" style={{ flexDirection: row }}>
              <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
                {t('modals.addExpense')}
              </Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <AmountInput
                value={amount}
                onChangeText={setAmount}
                label={t('transactions.amount')}
                error={errors.amount}
                autoFocus
              />

              {/* Category picker */}
              <Text className="text-sm font-medium text-slate-600 mb-2 mt-2" style={{ textAlign }}>
                {t('modals.selectCategory')}
                <Text className="text-expense"> *</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-1">
                {categories.map((cat) => {
                  const selected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => { setCategoryId(cat.id); setErrors((e) => ({ ...e, category: '' })); }}
                      className="flex-row items-center px-3 py-2 rounded-xl border"
                      style={{
                        flexDirection: row,
                        borderColor: selected ? cat.color : '#e2e8f0',
                        backgroundColor: selected ? cat.color + '18' : '#f8fafc',
                      }}
                    >
                      <Ionicons name={cat.icon as any} size={14} color={selected ? cat.color : '#94a3b8'} />
                      <Text className="text-sm font-medium ml-1.5" style={{ color: selected ? cat.color : '#475569' }}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.category && <Text className="text-expense text-xs mb-3">{errors.category}</Text>}

              {/* Note (optional) */}
              <Text className="text-sm font-medium text-slate-600 mb-1 mt-3" style={{ textAlign }}>
                {t('transactions.note')}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('modals.notePlaceholder')}
                placeholderTextColor="#94a3b8"
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800 mb-6"
              />

              <View className="flex-row gap-3" style={{ flexDirection: row }}>
                <Button label={t('misc.cancel')} variant="secondary" onPress={resetAndClose} style={{ flex: 1 }} />
                <Button label={t('misc.save')} variant="primary" onPress={handleSave} loading={loading} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
