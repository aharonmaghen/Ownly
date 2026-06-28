import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useRTL } from '../../src/hooks/useRTL';
import { NetWorthBanner } from '../../src/components/dashboard/NetWorthBanner';
import { EnvelopeCard } from '../../src/components/dashboard/EnvelopeCard';
import { RecentTransactions } from '../../src/components/dashboard/RecentTransactions';
import { AddExpenseModal } from '../../src/components/modals/AddExpenseModal';
import { AddIncomeModal } from '../../src/components/modals/AddIncomeModal';
import { AllocateFundsModal } from '../../src/components/modals/AllocateFundsModal';
import { Language } from '../../src/types';

type ModalType = 'expense' | 'income' | 'allocate' | null;

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { isRTL, row, textAlign, backIcon } = useRTL();
  const { settings, setLanguage } = useSettingsStore();
  const envelopeBalances = useBudgetStore((s) => s.getEnvelopeBalances());

  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const toggleLanguage = () => {
    setLanguage(settings.language === 'en' ? 'he' : 'en');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* ── Top app bar ── */}
      <View
        className="flex-row items-center justify-between px-4 pt-2 pb-3 bg-brand-700"
        style={{ flexDirection: row }}
      >
        <Text className="text-white text-xl font-extrabold tracking-tight">Ownly</Text>

        <View className="flex-row items-center gap-3" style={{ flexDirection: row }}>
          {/* Language toggle */}
          <TouchableOpacity
            onPress={toggleLanguage}
            className="bg-white/20 rounded-full px-3 py-1"
          >
            <Text className="text-white text-xs font-bold">
              {settings.language === 'en' ? 'עב' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Net Worth Banner */}
        <NetWorthBanner />

        {/* Quick Actions */}
        <View className="flex-row gap-3 mx-4 mt-4" style={{ flexDirection: row }}>
          <ActionChip
            icon="add-circle-outline"
            label={t('transactions.addExpense')}
            color="#ef4444"
            onPress={() => setActiveModal('expense')}
          />
          <ActionChip
            icon="arrow-down-circle-outline"
            label={t('transactions.addIncome')}
            color="#10b981"
            onPress={() => setActiveModal('income')}
          />
          <ActionChip
            icon="swap-horizontal-outline"
            label={t('transactions.allocate')}
            color="#8b5cf6"
            onPress={() => setActiveModal('allocate')}
          />
        </View>

        {/* Envelopes section */}
        <Text className="text-slate-700 font-bold text-base mx-4 mt-5 mb-2" style={{ textAlign }}>
          {t('tabs.envelopes')}
        </Text>
        {envelopeBalances.length === 0 ? (
          <Text className="text-slate-400 text-sm text-center my-4">
            {t('envelopes.empty')}
          </Text>
        ) : (
          envelopeBalances.map((b) => (
            <EnvelopeCard key={b.envelope.id} data={b} />
          ))
        )}

        {/* Recent Transactions */}
        <View className="mt-4">
          <RecentTransactions />
        </View>
      </ScrollView>

      {/* ── Primary FAB (Add Expense) ── */}
      <TouchableOpacity
        onPress={() => setActiveModal('expense')}
        className="absolute bottom-6 bg-brand-600 w-14 h-14 rounded-full items-center justify-center"
        style={[
          { shadowColor: '#0284c7', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
          isRTL ? { left: 24 } : { right: 24 },
        ]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* ── Modals ── */}
      <AddExpenseModal
        visible={activeModal === 'expense'}
        onClose={() => setActiveModal(null)}
      />
      <AddIncomeModal
        visible={activeModal === 'income'}
        onClose={() => setActiveModal(null)}
      />
      <AllocateFundsModal
        visible={activeModal === 'allocate'}
        onClose={() => setActiveModal(null)}
      />
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
