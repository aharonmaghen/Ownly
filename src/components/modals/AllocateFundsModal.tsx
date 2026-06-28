import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTL } from '../../hooks/useRTL';
import { useCurrency } from '../../hooks/useCurrency';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';
import { Envelope } from '../../types';

interface EnvelopeFundsModalProps {
  visible: boolean;
  envelope: Envelope | null;
  mode: 'deposit' | 'withdraw';
  onClose: () => void;
}

export function EnvelopeFundsModal({ visible, envelope, mode, onClose }: EnvelopeFundsModalProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isRTL, row, textAlign } = useRTL();
  const { depositToEnvelope, withdrawFromEnvelope } = useBudgetStore();

  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError(t('errors.amountRequired')); return; }
    if (mode === 'withdraw' && envelope && num > envelope.balance) {
      setError(t('errors.insufficientFunds'));
      return;
    }
    if (!envelope) return;

    setLoading(true);
    try {
      if (mode === 'deposit') {
        depositToEnvelope({ envelopeId: envelope.id, amount: num, note: note.trim() });
      } else {
        withdrawFromEnvelope({ envelopeId: envelope.id, amount: num, note: note.trim() });
      }
      resetAndClose();
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setAmount(''); setNote(''); setError('');
    onClose();
  };

  if (!envelope) return null;

  const isDeposit = mode === 'deposit';
  const accentColor = isDeposit ? envelope.color : '#64748b';

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pt-3 pb-8 px-5" style={{ maxHeight: '80%' }}>
            <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />

            <View className="flex-row items-center justify-between mb-4" style={{ flexDirection: row }}>
              <View className="flex-row items-center gap-2" style={{ flexDirection: row }}>
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: envelope.color + '22' }}
                >
                  <Ionicons name={envelope.icon as any} size={16} color={envelope.color} />
                </View>
                <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
                  {isDeposit ? t('modals.deposit') : t('modals.withdraw')}
                </Text>
              </View>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Current balance */}
            <View
              className="rounded-xl px-4 py-2.5 mb-4 flex-row items-center justify-between"
              style={{ backgroundColor: envelope.color + '12', flexDirection: row }}
            >
              <Text className="text-slate-500 text-sm">{envelope.name}</Text>
              <Text className="font-bold text-base" style={{ color: envelope.color }}>
                {format(envelope.balance)}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <AmountInput
                value={amount}
                onChangeText={(v) => { setAmount(v); setError(''); }}
                label={t('transactions.amount')}
                error={error}
                autoFocus
              />

              <Text className="text-sm font-medium text-slate-600 mb-1 mt-2" style={{ textAlign }}>
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
                <Button
                  label={isDeposit ? t('envelopes.deposit') : t('envelopes.withdraw')}
                  variant="primary"
                  onPress={handleSave}
                  loading={loading}
                  style={{ flex: 1, backgroundColor: accentColor }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
