import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTL } from '../../hooks/useRTL';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';
import { now } from '../../utils/date';

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddIncomeModal({ visible, onClose }: AddIncomeModalProps) {
  const { t } = useTranslation();
  const { isRTL, row, textAlign } = useRTL();
  const { accounts, addIncome } = useBudgetStore();

  const [amount, setAmount]       = useState('');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes]         = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);

  const assetAccounts = accounts.filter((a) => a.type === 'asset');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) e.amount = t('errors.amountRequired');
    if (!accountId) e.account = t('errors.accountRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      addIncome({
        amount: parseFloat(amount),
        accountId,
        notes,
        timestamp: now(),
      });
      resetAndClose();
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setAmount(''); setAccountId(''); setNotes(''); setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pt-3 pb-8 px-5" style={{ maxHeight: '85%' }}>
            <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />

            <View className="flex-row items-center justify-between mb-5" style={{ flexDirection: row }}>
              <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
                {t('modals.addIncome')}
              </Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Income info banner */}
              <View className="bg-income/10 rounded-xl px-3 py-2 mb-4 flex-row items-center" style={{ flexDirection: row }}>
                <Ionicons name="information-circle-outline" size={16} color="#10b981" />
                <Text className="text-income text-xs ml-2 flex-1" style={{ textAlign }}>
                  Income lands in your Unallocated Pool. Allocate it to envelopes from the dashboard.
                </Text>
              </View>

              <AmountInput
                value={amount}
                onChangeText={setAmount}
                label={t('transactions.amount')}
                error={errors.amount}
                autoFocus
              />

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

              <Text className="text-sm font-medium text-slate-600 mb-1 mt-2" style={{ textAlign }}>
                {t('transactions.notes')}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Monthly salary"
                placeholderTextColor="#94a3b8"
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 mb-6"
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
