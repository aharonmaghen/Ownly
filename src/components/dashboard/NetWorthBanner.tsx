import React from 'react';
import { View, Text } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useBudgetStore } from '../../store/budgetStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { useRTL } from '../../hooks/useRTL';

interface StatItemProps {
  label: string;
  value: string;
  accent?: string;
}

function StatItem({ label, value, accent = '#fff' }: StatItemProps) {
  const { textAlign } = useRTL();
  return (
    <View className="items-center flex-1">
      <Text className="text-white/60 text-xs font-medium mb-0.5" style={{ textAlign }}>
        {label}
      </Text>
      <Text className="font-bold text-sm" style={{ color: accent, textAlign }}>
        {value}
      </Text>
    </View>
  );
}

export function CFSBanner() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isRTL } = useRTL();
  const summary = useBudgetStore(useShallow((s) => s.getCFSSummary()));
  const isNegative = summary.cfs < 0;

  return (
    <View
      className="mx-4 mt-4 rounded-3xl overflow-hidden"
      style={{ shadowColor: '#0284c7', shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }}
    >
      <View className="bg-brand-700 px-4 pt-5 pb-4">
        <Text className="text-white/70 text-sm font-medium text-center">
          {t('banner.cfs')}
        </Text>
        <Text
          className="font-extrabold text-4xl text-center mt-1 mb-4"
          style={{ color: isNegative ? '#ef4444' : '#fff', letterSpacing: -1 }}
        >
          {format(summary.cfs)}
        </Text>

        <View className="h-px bg-white/20 mb-4" />

        <View
          className="flex-row"
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <StatItem label={t('banner.totalIncome')} value={format(summary.totalIncome)} accent="#6ee7b7" />
          <View className="w-px bg-white/20" />
          <StatItem label={t('banner.envelopes')}   value={format(summary.totalEnvelopeBalances)} accent="#93c5fd" />
          <View className="w-px bg-white/20" />
          <StatItem label={t('banner.spending')}    value={format(summary.monthlySpending)} accent="#fde68a" />
        </View>
      </View>
    </View>
  );
}
