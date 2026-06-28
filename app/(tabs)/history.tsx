import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCurrency } from '../../src/hooks/useCurrency';
import { useRTL } from '../../src/hooks/useRTL';
import { Transaction, TransactionType } from '../../src/types';
import { formatDate, formatTime } from '../../src/utils/date';

const TX_META: Record<TransactionType, { icon: string; color: string }> = {
  income:              { icon: 'arrow-down-circle-outline', color: '#10b981' },
  expense:             { icon: 'arrow-up-circle-outline',   color: '#ef4444' },
  envelope_deposit:    { icon: 'save-outline',              color: '#0284c7' },
  envelope_withdrawal: { icon: 'arrow-undo-outline',        color: '#f59e0b' },
  adjustment:          { icon: 'options-outline',           color: '#8b5cf6' },
};

const SIGN: Record<TransactionType, string> = {
  income:              '+',
  expense:             '-',
  envelope_deposit:    '-',
  envelope_withdrawal: '+',
  adjustment:          '±',
};

type Filter = TransactionType | 'all';
const FILTERS: Filter[] = ['all', 'income', 'expense', 'envelope_deposit', 'envelope_withdrawal', 'adjustment'];

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { language } = useTranslation();
  const { row, textAlign } = useRTL();
  const { transactions, deleteTransaction } = useBudgetStore();
  const categories = useBudgetStore((s) => s.categories);
  const envelopes  = useBudgetStore((s) => s.envelopes);

  const [filter, setFilter] = useState<Filter>('all');

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const filtered = filter === 'all' ? sorted : sorted.filter((tx) => tx.type === filter);

  const handleDelete = (tx: Transaction) => {
    Alert.alert(t('misc.delete'), `Delete this ${t(`transactions.${tx.type}`).toLowerCase()}?`, [
      { text: t('misc.cancel'), style: 'cancel' },
      { text: t('misc.delete'), style: 'destructive', onPress: () => deleteTransaction(tx.id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 py-3 bg-white border-b border-slate-100">
        <Text className="text-xl font-bold text-slate-800 mb-3" style={{ textAlign }}>
          {t('transactions.title')}
        </Text>
        <View className="flex-row flex-wrap gap-2" style={{ flexDirection: row }}>
          {FILTERS.map((f) => {
            const isActive = filter === f;
            const color = f === 'all' ? '#0284c7' : TX_META[f as TransactionType]?.color;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                className="px-3 py-1.5 rounded-full border"
                style={{ borderColor: isActive ? color : '#e2e8f0', backgroundColor: isActive ? color + '18' : '#f8fafc' }}
              >
                <Text className="text-xs font-semibold" style={{ color: isActive ? color : '#64748b' }}>
                  {f === 'all' ? t('transactions.all') : t(`transactions.${f}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
              const meta     = TX_META[tx.type];
              const category = categories.find((c) => c.id === tx.categoryId);
              const envelope = envelopes.find((e) => e.id === tx.envelopeId);
              const sign     = tx.type === 'adjustment'
                ? (tx.isNegativeAdjustment ? '-' : '+')
                : SIGN[tx.type];
              const subtitle = category?.name ?? envelope?.name ?? '';

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
                      {tx.note || subtitle || '—'}
                    </Text>
                    {subtitle ? (
                      <Text className="text-slate-400 text-xs mt-0.5" style={{ textAlign }}>
                        {subtitle}
                      </Text>
                    ) : null}
                    <Text className="text-slate-300 text-xs mt-0.5" style={{ textAlign }}>
                      {formatDate(tx.timestamp, language)} {formatTime(tx.timestamp, language)}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-bold text-sm" style={{ color: meta.color }}>
                      {sign}{format(tx.amount)}
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
