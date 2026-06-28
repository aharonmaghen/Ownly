import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCurrency } from '../../src/hooks/useCurrency';
import { useRTL } from '../../src/hooks/useRTL';
import { AmountInput } from '../../src/components/ui/AmountInput';
import { Button } from '../../src/components/ui/Button';
import { Account, AccountType } from '../../src/types';

const ICON_OPTIONS = [
  'wallet-outline','save-outline','card-outline','cash-outline',
  'home-outline','car-outline','business-outline','school-outline',
];

const COLOR_OPTIONS = [
  '#0284c7','#10b981','#ef4444','#f59e0b',
  '#8b5cf6','#ec4899','#06b6d4','#64748b',
];

interface AccountRowProps {
  account: Account;
  onDelete: () => void;
}

function AccountRow({ account, onDelete }: AccountRowProps) {
  const { format } = useCurrency();
  const { row, textAlign } = useRTL();
  return (
    <TouchableOpacity
      onLongPress={onDelete}
      className="flex-row items-center py-3 border-b border-slate-100"
      style={{ flexDirection: row }}
      activeOpacity={0.7}
    >
      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: account.color + '20' }}>
        <Ionicons name={account.icon as any} size={20} color={account.color} />
      </View>
      <View className="flex-1 mx-3">
        <Text className="text-slate-800 font-semibold text-sm" style={{ textAlign }}>{account.name}</Text>
        <Text className="text-slate-400 text-xs" style={{ textAlign }}>
          {account.type === 'asset' ? 'Asset' : 'Liability'}
        </Text>
      </View>
      <Text className="font-bold text-sm" style={{ color: account.type === 'asset' ? '#10b981' : '#ef4444' }}>
        {format(account.balance)}
      </Text>
    </TouchableOpacity>
  );
}

export default function AccountsScreen() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { isRTL, row, textAlign } = useRTL();
  const { accounts, addAccount, deleteAccount } = useBudgetStore();
  const summary = useBudgetStore((s) => s.getFinancialSummary());

  const [showForm, setShowForm]         = useState(false);
  const [name, setName]                 = useState('');
  const [balance, setBalance]           = useState('');
  const [accountType, setAccountType]   = useState<AccountType>('asset');
  const [icon, setIcon]                 = useState(ICON_OPTIONS[0]);
  const [color, setColor]               = useState(COLOR_OPTIONS[0]);
  const [errors, setErrors]             = useState<Record<string, string>>({});

  const assetAccounts      = accounts.filter((a) => a.type === 'asset');
  const liabilityAccounts  = accounts.filter((a) => a.type === 'liability');

  const handleAdd = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addAccount({
      name: name.trim(),
      type: accountType,
      balance: parseFloat(balance) || 0,
      icon,
      color,
    });
    setName(''); setBalance(''); setAccountType('asset'); setErrors({});
    setShowForm(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100" style={{ flexDirection: row }}>
        <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
          {t('accounts.title')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="w-9 h-9 bg-brand-600 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Summary cards */}
        <View className="flex-row gap-3 mx-4 mt-4 mb-5" style={{ flexDirection: row }}>
          <SummaryCard label={t('accounts.assets')}      value={format(summary.totalAssets)}      color="#10b981" />
          <SummaryCard label={t('accounts.liabilities')} value={format(summary.totalLiabilities)} color="#ef4444" />
          <SummaryCard label={t('banner.netWorth')}      value={format(summary.netWorth)}         color="#0284c7" />
        </View>

        {/* Assets */}
        <SectionHeader label={t('accounts.assets')} />
        <View className="bg-white mx-4 rounded-2xl px-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
          {assetAccounts.length === 0 ? (
            <Text className="text-slate-400 text-sm text-center py-4">{t('accounts.empty')}</Text>
          ) : (
            assetAccounts.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                onDelete={() =>
                  Alert.alert(a.name, undefined, [
                    { text: t('misc.delete'), style: 'destructive', onPress: () => deleteAccount(a.id) },
                    { text: t('misc.cancel'), style: 'cancel' },
                  ])
                }
              />
            ))
          )}
        </View>

        {/* Liabilities */}
        <SectionHeader label={t('accounts.liabilities')} />
        <View className="bg-white mx-4 rounded-2xl px-4" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
          {liabilityAccounts.length === 0 ? (
            <Text className="text-slate-400 text-sm text-center py-4">No liabilities</Text>
          ) : (
            liabilityAccounts.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                onDelete={() =>
                  Alert.alert(a.name, undefined, [
                    { text: t('misc.delete'), style: 'destructive', onPress: () => deleteAccount(a.id) },
                    { text: t('misc.cancel'), style: 'cancel' },
                  ])
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Account Sheet */}
      <Modal visible={showForm} animationType="slide" transparent presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl pt-3 pb-10 px-5">
              <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />
              <Text className="text-xl font-bold text-slate-800 mb-4" style={{ textAlign }}>
                {t('accounts.addTitle')}
              </Text>

              {/* Type toggle */}
              <View className="flex-row mb-4 bg-slate-100 rounded-xl p-1" style={{ flexDirection: row }}>
                {(['asset', 'liability'] as AccountType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setAccountType(type)}
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{ backgroundColor: accountType === type ? '#fff' : 'transparent' }}
                  >
                    <Text className={`text-sm font-semibold ${accountType === type ? 'text-slate-800' : 'text-slate-400'}`}>
                      {type === 'asset' ? t('accounts.asset') : t('accounts.liability')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-medium text-slate-600 mb-1" style={{ textAlign }}>{t('accounts.name')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Checking Account"
                placeholderTextColor="#94a3b8"
                textAlign={isRTL ? 'right' : 'left'}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 mb-1"
              />
              {errors.name && <Text className="text-expense text-xs mb-2">{errors.name}</Text>}

              <AmountInput
                value={balance}
                onChangeText={setBalance}
                label={t('accounts.balance')}
              />

              {/* Icon picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row gap-2">
                  {ICON_OPTIONS.map((ic) => (
                    <TouchableOpacity
                      key={ic}
                      onPress={() => setIcon(ic)}
                      className="w-10 h-10 rounded-xl items-center justify-center border"
                      style={{ borderColor: icon === ic ? color : '#e2e8f0', backgroundColor: icon === ic ? color + '18' : '#f8fafc' }}
                    >
                      <Ionicons name={ic as any} size={20} color={icon === ic ? color : '#94a3b8'} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Color picker */}
              <View className="flex-row flex-wrap gap-2 mb-5" style={{ flexDirection: row }}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: c,
                      borderWidth: color === c ? 3 : 0,
                      borderColor: '#fff',
                      shadowColor: c,
                      shadowOpacity: color === c ? 0.5 : 0,
                      shadowRadius: 4,
                      elevation: color === c ? 4 : 0,
                    }}
                  />
                ))}
              </View>

              <View className="flex-row gap-3" style={{ flexDirection: row }}>
                <Button label={t('misc.cancel')} variant="secondary" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
                <Button label={t('misc.add')} variant="primary" onPress={handleAdd} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-3 items-center" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
      <Text className="text-xs text-slate-500 mb-1 text-center">{label}</Text>
      <Text className="font-bold text-sm" style={{ color }}>{value}</Text>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  const { textAlign } = useRTL();
  return (
    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mx-4 mt-5 mb-2" style={{ textAlign }}>
      {label}
    </Text>
  );
}
