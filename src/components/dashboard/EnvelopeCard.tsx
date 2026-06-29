import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Envelope } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrency } from '../../hooks/useCurrency';
import { useRTL } from '../../hooks/useRTL';

interface EnvelopeCardProps {
  envelope: Envelope;
  onDeposit: () => void;
  onWithdraw: () => void;
  onEdit?: () => void;
}

export function EnvelopeCard({ envelope, onDeposit, onWithdraw, onEdit }: EnvelopeCardProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { row, textAlign } = useRTL();

  const hasTarget = envelope.targetAmount != null && envelope.targetAmount > 0;
  const progress = hasTarget
    ? Math.min(100, (envelope.balance / envelope.targetAmount!) * 100)
    : 0;

  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3 mx-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
    >
      {/* Header */}
      <View className="flex-row items-center mb-3" style={{ flexDirection: row }}>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: envelope.color + '22' }}
        >
          <Ionicons name={envelope.icon as any} size={20} color={envelope.color} />
        </View>

        <View className="flex-1 mx-3">
          <Text className="font-semibold text-slate-800 text-sm" style={{ textAlign }}>
            {envelope.name}
          </Text>
          {hasTarget && (
            <Text className="text-slate-400 text-xs" style={{ textAlign }}>
              {format(envelope.balance)} {t('envelopes.of')} {format(envelope.targetAmount!)}
            </Text>
          )}
        </View>

        <Text className="font-bold text-base mr-2" style={{ color: envelope.color }}>
          {format(envelope.balance)}
        </Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress toward target */}
      {hasTarget && (
        <>
          <ProgressBar percent={progress} color={envelope.color} height={6} />
          <Text className="text-xs text-slate-400 mt-1 text-right">
            {Math.round(progress)}% {t('envelopes.saved')}
          </Text>
        </>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-2 mt-3" style={{ flexDirection: row }}>
        <TouchableOpacity
          onPress={onDeposit}
          className="flex-1 flex-row items-center justify-center py-2 rounded-xl"
          style={{ backgroundColor: envelope.color + '18' }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={16} color={envelope.color} />
          <Text className="text-xs font-semibold ml-1" style={{ color: envelope.color }}>
            {t('envelopes.deposit')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onWithdraw}
          className="flex-1 flex-row items-center justify-center py-2 rounded-xl bg-slate-100"
          activeOpacity={0.7}
        >
          <Ionicons name="remove-circle-outline" size={16} color="#64748b" />
          <Text className="text-xs font-semibold ml-1 text-slate-600">
            {t('envelopes.withdraw')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
