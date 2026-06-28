import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { useRTL } from '../../hooks/useRTL';
import { Transaction, TransactionType } from '../../types';
import { formatDate } from '../../utils/date';

const TX_META: Record<TransactionType, { icon: string; color: string; sign: string }> = {
  expense:    { icon: 'arrow-up-circle-outline',   color: '#ef4444', sign: '-' },
  income:     { icon: 'arrow-down-circle-outline', color: '#10b981', sign: '+' },
  allocation: { icon: 'swap-horizontal-outline',   color: '#8b5cf6', sign: '' },
};

interface TransactionRowProps {
  tx: Transaction;
}

function TransactionRow({ tx }: TransactionRowProps) {
  const { format } = useCurrency();
  const { isRTL, row, textAlign } = useRTL();
  const { language } = useTranslation();
  const meta = TX_META[tx.type];
  const account = useBudgetStore((s) => s.getAccountById(tx.accountId));
  const envelope = useBudgetStore((s) => s.getEnvelopeById(tx.envelopeId ?? ''));

  return (
    <View
      className="flex-row items-center py-3 border-b border-slate-100"
      style={{ flexDirection: row }}
    >
      {/* Icon */}
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: meta.color + '18' }}
      >
        <Ionicons name={meta.icon as any} size={18} color={meta.color} />
      </View>

      {/* Description */}
      <View className="flex-1 mx-3">
        <Text className="text-slate-800 text-sm font-medium" style={{ textAlign }} numberOfLines={1}>
          {tx.notes || (envelope?.name ?? account?.name ?? '—')}
        </Text>
        <Text className="text-slate-400 text-xs" style={{ textAlign }}>
          {formatDate(tx.timestamp, language)}
          {envelope ? `  ·  ${envelope.name}` : ''}
        </Text>
      </View>

      {/* Amount */}
      <Text
        className="font-bold text-sm"
        style={{ color: meta.color, textAlign: isRTL ? 'left' : 'right' }}
      >
        {meta.sign}{format(tx.amount)}
      </Text>
    </View>
  );
}

export function RecentTransactions() {
  const { t } = useTranslation();
  const { textAlign } = useRTL();
  const transactions = useBudgetStore((s) => s.getRecentTransactions(8));

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
      <View className="bg-white rounded-2xl mx-4 px-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </View>
    </View>
  );
}
