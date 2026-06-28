import React from 'react';
import { View, Text } from 'react-native';
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
      <Text className="text-white/70 text-xs font-medium mb-0.5" style={{ textAlign }}>
        {label}
      </Text>
      <Text className="text-white font-bold text-base" style={{ color: accent, textAlign }}>
        {value}
      </Text>
    </View>
  );
}

export function NetWorthBanner() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isRTL } = useRTL();
  const summary = useBudgetStore((s) => s.getFinancialSummary());

  return (
    <View
      className="mx-4 mt-4 rounded-3xl overflow-hidden"
      style={{ shadowColor: '#0284c7', shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 }}
    >
      {/* Gradient background simulated with a colored View (no expo-linear-gradient dep needed) */}
      <View className="bg-brand-700 px-4 pt-5 pb-4">
        {/* Net Worth headline */}
        <Text
          className="text-white/80 text-sm font-medium text-center"
        >
          {t('banner.netWorth')}
        </Text>
        <Text
          className="text-white font-extrabold text-4xl text-center mt-1 mb-4"
          style={{ letterSpacing: -1 }}
        >
          {format(summary.netWorth)}
        </Text>

        {/* Divider */}
        <View className="h-px bg-white/20 mb-4" />

        {/* Three stats row */}
        <View
          className="flex-row"
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <StatItem label={t('banner.assets')}      value={format(summary.totalAssets)} />
          <View className="w-px bg-white/20" />
          <StatItem label={t('banner.liabilities')} value={format(summary.totalLiabilities)} accent="#fca5a5" />
          <View className="w-px bg-white/20" />
          <StatItem label={t('banner.spending')}    value={format(summary.monthlySpending)} accent="#fde68a" />
        </View>
      </View>

      {/* Unallocated pool pill */}
      {summary.unallocatedPool > 0 && (
        <View className="bg-brand-800 px-4 py-2 flex-row items-center justify-center">
          <Text className="text-white/70 text-xs">
            {t('envelopes.unallocated')}: {' '}
          </Text>
          <Text className="text-income text-xs font-bold">
            {format(summary.unallocatedPool)}
          </Text>
        </View>
      )}
    </View>
  );
}
