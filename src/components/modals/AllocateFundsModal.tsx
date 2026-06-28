import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { useRTL } from '../../hooks/useRTL';
import { AmountInput } from '../ui/AmountInput';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Envelope } from '../../types';

interface AllocateFundsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllocateFundsModal({ visible, onClose }: AllocateFundsModalProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isRTL, row, textAlign } = useRTL();
  const { envelopes, unallocatedPool, allocateFunds } = useBudgetStore();

  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleAllocate = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError(t('errors.amountRequired')); return; }
    if (!selectedEnvelope) { setError(t('errors.envelopeRequired')); return; }
    if (num > unallocatedPool) { setError(t('errors.insufficientFunds')); return; }

    setLoading(true);
    try {
      allocateFunds({ amount: num, envelopeId: selectedEnvelope.id });
      resetAndClose();
    } catch {
      setError(t('errors.insufficientFunds'));
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSelectedEnvelope(null); setAmount(''); setError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl pt-3 pb-8 px-5" style={{ maxHeight: '92%' }}>
            <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />

            <View className="flex-row items-center justify-between mb-2" style={{ flexDirection: row }}>
              <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
                {t('modals.allocateFunds')}
              </Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Pool balance */}
            <View
              className="bg-allocation/10 rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
              style={{ flexDirection: row }}
            >
              <Text className="text-slate-500 text-sm">{t('envelopes.unallocated')}</Text>
              <Text className="text-allocation font-bold text-lg">{format(unallocatedPool)}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Envelope list */}
              <Text className="text-sm font-medium text-slate-600 mb-2" style={{ textAlign }}>
                {t('modals.selectEnvelope')}
              </Text>
              {envelopes.map((env) => {
                const remaining = env.allocatedAmount - env.spentAmount;
                const isSelected = selectedEnvelope?.id === env.id;
                return (
                  <TouchableOpacity
                    key={env.id}
                    onPress={() => { setSelectedEnvelope(env); setError(''); }}
                    className="border rounded-xl p-3 mb-2"
                    style={{
                      borderColor: isSelected ? env.color : '#e2e8f0',
                      backgroundColor: isSelected ? env.color + '10' : '#f8fafc',
                    }}
                  >
                    <View className="flex-row items-center mb-1" style={{ flexDirection: row }}>
                      <Ionicons name={env.icon as any} size={16} color={env.color} />
                      <Text className="text-slate-800 font-semibold text-sm ml-2 flex-1" style={{ textAlign }}>
                        {env.name}
                      </Text>
                      <Text className="text-xs" style={{ color: remaining < 0 ? '#ef4444' : '#64748b' }}>
                        {format(remaining)} left
                      </Text>
                    </View>
                    <ProgressBar
                      percent={env.allocatedAmount > 0 ? (env.spentAmount / env.allocatedAmount) * 100 : 0}
                      color={env.color}
                      height={4}
                    />
                  </TouchableOpacity>
                );
              })}

              {/* Amount input (shown after envelope selected) */}
              {selectedEnvelope && (
                <View className="mt-3">
                  <AmountInput
                    value={amount}
                    onChangeText={(v) => { setAmount(v); setError(''); }}
                    label={`${t('transactions.amount')} → ${selectedEnvelope.name}`}
                    error={error}
                    autoFocus
                  />
                </View>
              )}

              {!selectedEnvelope && error && (
                <Text className="text-expense text-xs mb-3">{error}</Text>
              )}

              <View className="flex-row gap-3 mt-2" style={{ flexDirection: row }}>
                <Button label={t('misc.cancel')} variant="secondary" onPress={resetAndClose} style={{ flex: 1 }} />
                <Button
                  label={t('transactions.allocate')}
                  variant="primary"
                  onPress={handleAllocate}
                  loading={loading}
                  disabled={!selectedEnvelope}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
