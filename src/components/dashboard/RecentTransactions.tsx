import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { useRTL } from '../../hooks/useRTL';
import { Transaction, TransactionType } from '../../types';
import { formatDate } from '../../utils/date';

const TX_META: Record<TransactionType, { icon: string; color: string; sign: string }> = {
  income:              { icon: 'arrow-down-circle-outline', color: '#10b981', sign: '+' },
  expense:             { icon: 'arrow-up-circle-outline',   color: '#ef4444', sign: '-' },
  envelope_deposit:    { icon: 'save-outline',              color: '#0284c7', sign: '-' },
  envelope_withdrawal: { icon: 'arrow-undo-outline',        color: '#f59e0b', sign: '+' },
  adjustment:          { icon: 'options-outline',           color: '#8b5cf6', sign: '±' },
};

interface TransactionRowProps {
  tx: Transaction;
}

function TransactionRow({ tx }: TransactionRowProps) {
  const { format } = useCurrency();
  const { row, textAlign } = useRTL();
  const { language } = useTranslation();
  const meta = TX_META[tx.type];
  const category = useBudgetStore((s) => s.categories.find((c) => c.id === tx.categoryId));
  const envelope  = useBudgetStore((s) => s.envelopes.find((e) => e.id === tx.envelopeId));

  const sign = tx.type === 'adjustment'
    ? (tx.isNegativeAdjustment ? '-' : '+')
    : meta.sign;

  const subtitle = category?.name ?? envelope?.name ?? '';

  return (
    <View
      className="flex-row items-center py-3 border-b border-slate-100"
      style={{ flexDirection: row }}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: meta.color + '18' }}
      >
        <Ionicons name={meta.icon as any} size={18} color={meta.color} />
      </View>

      <View className="flex-1 mx-3">
        <Text className="text-slate-800 text-sm font-medium" style={{ textAlign }} numberOfLines={1}>
          {tx.note || subtitle || '—'}
        </Text>
        {subtitle ? (
          <Text className="text-slate-400 text-xs" style={{ textAlign }}>
            {subtitle} · {formatDate(tx.timestamp, language)}
          </Text>
        ) : (
          <Text className="text-slate-400 text-xs" style={{ textAlign }}>
            {formatDate(tx.timestamp, language)}
          </Text>
        )}
      </View>

      <Text className="font-bold text-sm" style={{ color: meta.color }}>
        {sign}{format(tx.amount)}
      </Text>
    </View>
  );
}

export function RecentTransactions() {
  const { t } = useTranslation();
  const { textAlign } = useRTL();
  const rawTransactions = useBudgetStore((s) => s.transactions);
  const transactions = useMemo(
    () =>
      rawTransactions
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8),
    [rawTransactions],
  );

  if (!transactions.length) {
    return (
      <Text className="text-slate-400 text-sm text-center my-6">
        {t('transactions.empty')}
      </Text>
    );
  }

  return (
    <View>
      <Text className="text-slate-700 font-bold text-base mx-4 mb-1" style={{ textAlign }}>
        {t('transactions.title')}
      </Text>
      <View
        className="bg-white rounded-2xl mx-4 px-4"
        style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
      >
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </View>
    </View>
  );
}
