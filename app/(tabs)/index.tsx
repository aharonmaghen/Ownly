import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useRTL } from '../../src/hooks/useRTL';
import { CFSBanner } from '../../src/components/dashboard/NetWorthBanner';
import { RecentTransactions } from '../../src/components/dashboard/RecentTransactions';
import { AddExpenseModal } from '../../src/components/modals/AddExpenseModal';
import { AddIncomeModal } from '../../src/components/modals/AddIncomeModal';
import { AdjustCFSModal } from '../../src/components/modals/AdjustCFSModal';
import { Language } from '../../src/types';

type ModalType = 'expense' | 'income' | 'adjust' | null;

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { isRTL, row, textAlign } = useRTL();
  const { settings, setLanguage } = useSettingsStore();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const toggleLanguage = () => {
    setLanguage(settings.language === 'en' ? 'he' : 'en');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* App bar */}
      <View
        className="flex-row items-center justify-between px-4 pt-2 pb-3 bg-brand-700"
        style={{ flexDirection: row }}
      >
        <Text className="text-white text-xl font-extrabold tracking-tight">Ownly</Text>
        <TouchableOpacity
          onPress={toggleLanguage}
          className="bg-white/20 rounded-full px-3 py-1"
        >
          <Text className="text-white text-xs font-bold">
            {settings.language === 'en' ? 'עב' : 'EN'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <CFSBanner />

        {/* Quick Actions */}
        <View className="flex-row gap-3 mx-4 mt-4" style={{ flexDirection: row }}>
          <ActionChip
            icon="arrow-down-circle-outline"
            label={t('transactions.addIncome')}
            color="#10b981"
            onPress={() => setActiveModal('income')}
          />
          <ActionChip
            icon="arrow-up-circle-outline"
            label={t('transactions.addExpense')}
            color="#ef4444"
            onPress={() => setActiveModal('expense')}
          />
          <ActionChip
            icon="options-outline"
            label={t('transactions.adjust')}
            color="#8b5cf6"
            onPress={() => setActiveModal('adjust')}
          />
        </View>

        <View className="mt-4">
          <RecentTransactions />
        </View>
      </ScrollView>

      {/* FAB — Add Expense */}
      <TouchableOpacity
        onPress={() => setActiveModal('expense')}
        className="absolute bottom-6 bg-expense w-14 h-14 rounded-full items-center justify-center"
        style={[
          { shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
          isRTL ? { left: 24 } : { right: 24 },
        ]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <AddExpenseModal visible={activeModal === 'expense'} onClose={() => setActiveModal(null)} />
      <AddIncomeModal  visible={activeModal === 'income'}  onClose={() => setActiveModal(null)} />
      <AdjustCFSModal  visible={activeModal === 'adjust'}  onClose={() => setActiveModal(null)} />
    </SafeAreaView>
  );
}

interface ActionChipProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

function ActionChip({ icon, label, color, onPress }: ActionChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center py-3 rounded-2xl bg-white"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
      activeOpacity={0.75}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mb-1"
        style={{ backgroundColor: color + '18' }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-xs font-semibold text-slate-600 text-center" numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
