import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTL } from '../../hooks/useRTL';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';
import { now } from '../../utils/date';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ visible, onClose }: AddExpenseModalProps) {
  const { t } = useTranslation();
  const { isRTL, row, textAlign } = useRTL();
  const { accounts, envelopes, addExpense } = useBudgetStore();

  const [amount, setAmount]       = useState('');
  const [accountId, setAccountId] = useState('');
  const [envelopeId, setEnvId]   = useState('');
  const [notes, setNotes]         = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);

  const assetAccounts = accounts.filter((a) => a.type === 'asset');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) e.amount = t('errors.amountRequired');
    if (!accountId)  e.account  = t('errors.accountRequired');
    if (!envelopeId) e.envelope = t('errors.envelopeRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      addExpense({
        amount: parseFloat(amount),
        accountId,
        envelopeId,
        notes,
        timestamp: now(),
      });
      resetAndClose();
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setAmount(''); setAccountId(''); setEnvId(''); setNotes(''); setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pt-3 pb-8 px-5" style={{ maxHeight: '92%' }}>
            {/* Handle bar */}
            <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-5" style={{ flexDirection: row }}>
              <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
                {t('modals.addExpense')}
              </Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Amount */}
              <AmountInput
                value={amount}
                onChangeText={setAmount}
                label={t('transactions.amount')}
                error={errors.amount}
                autoFocus
              />

              {/* Account picker */}
              <Text className="text-sm font-medium text-slate-600 mb-2" style={{ textAlign }}>
                {t('transactions.account')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-1">
                <View className="flex-row gap-2 pb-2" style={{ flexDirection: row }}>
                  {assetAccounts.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => { setAccountId(a.id); setErrors((e) => ({ ...e, account: '' })); }}
                      className="flex-row items-center px-3 py-2 rounded-xl border"
                      style={{
                        flexDirection: row,
                        borderColor: accountId === a.id ? a.color : '#e2e8f0',
                        backgroundColor: accountId === a.id ? a.color + '18' : '#f8fafc',
                      }}
                    >
                      <Ionicons name={a.icon as any} size={14} color={a.color} />
                      <Text className="text-sm font-medium ml-1" style={{ color: accountId === a.id ? a.color : '#475569' }}>
                        {a.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.account && <Text className="text-expense text-xs mb-3">{errors.account}</Text>}

              {/* Envelope picker */}
              <Text className="text-sm font-medium text-slate-600 mb-2 mt-2" style={{ textAlign }}>
                {t('transactions.envelope')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-1">
                <View className="flex-row gap-2 pb-2" style={{ flexDirection: row }}>
                  {envelopes.map((e) => (
                    <TouchableOpacity
                      key={e.id}
                      onPress={() => { setEnvId(e.id); setErrors((err) => ({ ...err, envelope: '' })); }}
                      className="flex-row items-center px-3 py-2 rounded-xl border"
                      style={{
                        flexDirection: row,
                        borderColor: envelopeId === e.id ? e.color : '#e2e8f0',
                        backgroundColor: envelopeId === e.id ? e.color + '18' : '#f8fafc',
                      }}
                    >
                      <Ionicons name={e.icon as any} size={14} color={e.color} />
                      <Text className="text-sm font-medium ml-1" style={{ color: envelopeId === e.id ? e.color : '#475569' }}>
                        {e.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.envelope && <Text className="text-expense text-xs mb-3">{errors.envelope}</Text>}

              {/* Notes */}
              <Text className="text-sm font-medium text-slate-600 mb-1 mt-2" style={{ textAlign }}>
                {t('transactions.notes')}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('modals.notesPlaceholder')}
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 mb-6"
                style={{ minHeight: 60 }}
              />

              {/* Actions */}
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
