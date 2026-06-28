import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCurrency } from '../../src/hooks/useCurrency';
import { useRTL } from '../../src/hooks/useRTL';
import { Transaction, TransactionType } from '../../src/types';
import { formatDate, formatTime } from '../../src/utils/date';

const TX_META: Record<TransactionType, { icon: string; color: string; label: string; sign: string }> = {
  expense:    { icon: 'arrow-up-circle-outline',   color: '#ef4444', label: 'expense',    sign: '-' },
  income:     { icon: 'arrow-down-circle-outline', color: '#10b981', label: 'income',     sign: '+' },
  allocation: { icon: 'swap-horizontal-outline',   color: '#8b5cf6', label: 'allocation', sign: '' },
};

const FILTERS: Array<TransactionType | 'all'> = ['all', 'expense', 'income', 'allocation'];

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { language } = useTranslation();
  const { isRTL, row, textAlign } = useRTL();
  const { transactions, deleteTransaction, getAccountById, getEnvelopeById } = useBudgetStore();

  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const sorted = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = filter === 'all' ? sorted : sorted.filter((tx) => tx.type === filter);

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      t('misc.delete'),
      `Delete this ${tx.type}?`,
      [
        { text: t('misc.cancel'), style: 'cancel' },
        { text: t('misc.delete'), style: 'destructive', onPress: () => deleteTransaction(tx.id) },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-slate-100">
        <Text className="text-xl font-bold text-slate-800 mb-3" style={{ textAlign }}>
          {t('transactions.title')}
        </Text>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2" style={{ flexDirection: row }}>
            {FILTERS.map((f) => {
              const isActive = filter === f;
              const color = f === 'all' ? '#0284c7' : TX_META[f as TransactionType]?.color;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  className="px-4 py-1.5 rounded-full border"
                  style={{
                    borderColor: isActive ? color : '#e2e8f0',
                    backgroundColor: isActive ? color + '18' : '#f8fafc',
                  }}
                >
                  <Text className="text-sm font-semibold" style={{ color: isActive ? color : '#64748b' }}>
                    {f === 'all' ? 'All' : t(`transactions.${f}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {filtered.length === 0 ? (
          <View className="items-center mt-20">
            <Ionicons name="time-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">{t('transactions.empty')}</Text>
          </View>
        ) : (
          <View className="bg-white mx-4 mt-4 rounded-2xl px-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
            {filtered.map((tx, idx) => {
              const meta = TX_META[tx.type];
              const account  = getAccountById(tx.accountId);
              const envelope = getEnvelopeById(tx.envelopeId ?? '');
              return (
                <TouchableOpacity
                  key={tx.id}
                  onLongPress={() => handleDelete(tx)}
                  className={`flex-row items-start py-3 ${idx < filtered.length - 1 ? 'border-b border-slate-100' : ''}`}
                  style={{ flexDirection: row }}
                  activeOpacity={0.7}
                >
                  <View className="w-9 h-9 rounded-full items-center justify-center mt-0.5" style={{ backgroundColor: meta.color + '18' }}>
                    <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                  </View>

                  <View className="flex-1 mx-3">
                    <Text className="text-slate-800 text-sm font-medium" style={{ textAlign }} numberOfLines={1}>
                      {tx.notes || envelope?.name || account?.name || '—'}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5" style={{ textAlign }}>
                      {account?.name ?? ''}
                      {envelope ? ` · ${envelope.name}` : ''}
                    </Text>
                    <Text className="text-slate-300 text-xs mt-0.5" style={{ textAlign }}>
                      {formatDate(tx.timestamp, language)} {formatTime(tx.timestamp, language)}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-bold text-sm" style={{ color: meta.color }}>
                      {meta.sign}{format(tx.amount)}
                    </Text>
                    <View className="mt-1 rounded-md px-1.5 py-0.5" style={{ backgroundColor: meta.color + '18' }}>
                      <Text className="text-xs font-medium" style={{ color: meta.color }}>
                        {t(`transactions.${tx.type}`)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
