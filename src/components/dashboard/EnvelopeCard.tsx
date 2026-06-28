import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnvelopeBalance } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { useRTL } from '../../hooks/useRTL';

interface EnvelopeCardProps {
  data: EnvelopeBalance;
  onPress?: () => void;
}

export function EnvelopeCard({ data, onPress }: EnvelopeCardProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isRTL, row, textAlign } = useRTL();
  const { envelope, remaining, percentUsed } = data;
  const overBudget = remaining < 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-2xl p-4 mb-3 mx-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
    >
      {/* Header row */}
      <View className="flex-row items-center mb-3" style={{ flexDirection: row }}>
        {/* Icon badge */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: envelope.color + '22' }}
        >
          <Ionicons
            name={envelope.icon as any}
            size={20}
            color={envelope.color}
          />
        </View>

        <View className="flex-1 mx-3">
          <Text className="font-semibold text-slate-800 text-sm" style={{ textAlign }}>
            {envelope.name}
          </Text>
          <Text className="text-slate-400 text-xs" style={{ textAlign }}>
            {format(envelope.spentAmount)} {t('envelopes.of')} {format(envelope.allocatedAmount)}
          </Text>
        </View>

        {/* Remaining badge */}
        <View
          className="rounded-lg px-2 py-1"
          style={{ backgroundColor: overBudget ? '#fee2e2' : '#f0fdf4' }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: overBudget ? '#ef4444' : '#16a34a' }}
          >
            {overBudget ? '-' : ''}{format(Math.abs(remaining))}
          </Text>
          <Text
            className="text-xs text-center"
            style={{ color: overBudget ? '#f87171' : '#4ade80', textAlign: 'center' }}
          >
            {t('envelopes.remaining')}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <ProgressBar
        percent={percentUsed}
        color={envelope.color}
        overBudget={overBudget}
        height={7}
      />

      {/* Percentage label */}
      <Text
        className="text-xs text-slate-400 mt-1"
        style={{ textAlign: isRTL ? 'left' : 'right' }}
      >
        {Math.round(percentUsed)}%
      </Text>
    </TouchableOpacity>
  );
}
