import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { useBudgetStore } from '../../src/store/budgetStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCurrency } from '../../src/hooks/useCurrency';
import { useRTL } from '../../src/hooks/useRTL';
import { useScreenHeight } from '../../src/hooks/useScreenHeight';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { AmountInput } from '../../src/components/ui/AmountInput';
import { Button } from '../../src/components/ui/Button';
import { BudgetCategory } from '../../src/types';

const ICON_OPTIONS = [
  'cart-outline', 'restaurant-outline', 'car-outline', 'game-controller-outline',
  'home-outline', 'medkit-outline', 'shirt-outline', 'book-outline',
  'airplane-outline', 'gift-outline', 'barbell-outline', 'laptop-outline',
  'paw-outline', 'musical-notes-outline', 'cash-outline', 'school-outline',
];

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#0ea5e9', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#0284c7',
];

export default function BudgetScreen() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { row, textAlign } = useRTL();
  const screenHeight = useScreenHeight();
  const categories   = useBudgetStore((s) => s.categories);
  const monthlySpent = useBudgetStore(useShallow((s) => s.getMonthlySpentByCategory()));
  const { addCategory, updateCategory, deleteCategory } = useBudgetStore();

  const [showAddForm, setShowAddForm]               = useState(false);
  const [editingCategory, setEditingCategory]       = useState<BudgetCategory | null>(null);
  const [confirmingDelete, setConfirmingDelete]     = useState(false);
  const [name, setName]                             = useState('');
  const [limit, setLimit]                           = useState('');
  const [newName, setNewName]                       = useState('');
  const [newLimit, setNewLimit]                     = useState('');
  const [icon, setIcon]                             = useState(ICON_OPTIONS[0]);
  const [color, setColor]                           = useState(COLOR_OPTIONS[0]);
  const [errors, setErrors]                         = useState<Record<string, string>>({});

  const totalMonthlyLimit = useMemo(
    () => categories.reduce((s, c) => s + c.monthlyLimit, 0),
    [categories],
  );
  const totalMonthlySpent = useMemo(
    () => Object.values(monthlySpent).reduce((s, v) => s + v, 0),
    [monthlySpent],
  );

  const handleAdd = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('errors.nameRequired');
    if (!limit || parseFloat(limit) <= 0) e.limit = t('errors.limitRequired');
    if (Object.keys(e).length) { setErrors(e); return; }
    addCategory({ name: name.trim(), monthlyLimit: parseFloat(limit), icon, color });
    setName(''); setLimit(''); setIcon(ICON_OPTIONS[0]); setColor(COLOR_OPTIONS[0]); setErrors({});
    setShowAddForm(false);
  };

  const openEditModal = (cat: BudgetCategory) => {
    setEditingCategory(cat);
    setNewName(cat.name);
    setNewLimit(cat.monthlyLimit === 0 ? '' : String(cat.monthlyLimit));
    setConfirmingDelete(false);
  };

  const closeEditModal = () => {
    setEditingCategory(null);
    setConfirmingDelete(false);
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;
    const patch: Partial<Pick<BudgetCategory, 'name' | 'monthlyLimit'>> = {};
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== editingCategory.name) patch.name = trimmedName;
    const num = parseFloat(newLimit);
    if (num > 0 && num !== editingCategory.monthlyLimit) patch.monthlyLimit = num;
    if (Object.keys(patch).length) updateCategory(editingCategory.id, patch);
    closeEditModal();
  };

  return (
    <SafeAreaView className="bg-surface" style={{ height: screenHeight, flex: screenHeight ? undefined : 1 }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100"
        style={{ flexDirection: row }}
      >
        <Text className="text-xl font-bold text-slate-800" style={{ textAlign }}>
          {t('budget.title')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="w-9 h-9 bg-brand-600 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Monthly summary strip */}
        <View className="flex-row gap-3 mx-4 mt-4 mb-2" style={{ flexDirection: row }}>
          <SummaryCard label={t('budget.totalBudget')} value={format(totalMonthlyLimit)} color="#0284c7" />
          <SummaryCard label={t('budget.totalSpent')}  value={format(totalMonthlySpent)} color="#ef4444" />
          <SummaryCard label={t('budget.remaining')}   value={format(Math.max(0, totalMonthlyLimit - totalMonthlySpent))} color="#10b981" />
        </View>

        {categories.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="grid-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3 text-center">{t('budget.empty')}</Text>
          </View>
        ) : (
          categories.map((cat) => {
            const spent     = monthlySpent[cat.id] ?? 0;
            const remaining = cat.monthlyLimit - spent;
            const percent   = cat.monthlyLimit > 0 ? Math.min(100, (spent / cat.monthlyLimit) * 100) : 0;
            const over      = remaining < 0;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => openEditModal(cat)}
                activeOpacity={0.8}
                className="bg-white rounded-2xl p-4 mb-3 mx-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <View className="flex-row items-center mb-3" style={{ flexDirection: row }}>
                  <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: cat.color + '22' }}>
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <View className="flex-1 mx-3">
                    <Text className="font-semibold text-slate-800 text-sm" style={{ textAlign }}>{cat.name}</Text>
                    <Text className="text-slate-400 text-xs" style={{ textAlign }}>
                      {format(spent)} {t('budget.of')} {format(cat.monthlyLimit)}
                    </Text>
                  </View>
                  <View
                    className="rounded-lg px-2 py-1"
                    style={{ backgroundColor: over ? '#ef4444' : '#f0fdf4' }}
                  >
                    <Text className="text-xs font-bold" style={{ color: over ? '#fff' : '#16a34a' }}>
                      {over ? t('budget.overBudget') : format(remaining)}
                    </Text>
                  </View>
                </View>
                <ProgressBar percent={percent} color={cat.color} overBudget={over} height={6} />
                <Text className="text-xs text-slate-400 mt-1 text-right">{Math.round(percent)}%</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Category Sheet */}
      {showAddForm && (
        <Modal visible animationType="slide" transparent presentationStyle="pageSheet">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="flex-1 justify-end">
              <View className="bg-white rounded-t-3xl pt-3 pb-10 px-5">
                <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />
                <Text className="text-xl font-bold text-slate-800 mb-4" style={{ textAlign }}>
                  {t('budget.addTitle')}
                </Text>

                <Text className="text-sm font-medium text-slate-600 mb-1">{t('budget.name')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('budget.namePlaceholder')}
                  placeholderTextColor="#94a3b8"
                  className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 mb-1"
                />
                {errors.name && <Text className="text-expense text-xs mb-2">{errors.name}</Text>}

                <AmountInput value={limit} onChangeText={setLimit} label={t('budget.limit')} error={errors.limit} />

                <Text className="text-sm font-medium text-slate-600 mb-2">{t('budget.icon')}</Text>
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

                <Text className="text-sm font-medium text-slate-600 mb-2">{t('budget.color')}</Text>
                <View className="flex-row flex-wrap gap-2 mb-5">
                  {COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff', shadowColor: c, shadowOpacity: color === c ? 0.5 : 0, shadowRadius: 4, elevation: color === c ? 4 : 0 }}
                    />
                  ))}
                </View>

                <View className="flex-row gap-3">
                  <Button label={t('misc.cancel')} variant="secondary" onPress={() => { setShowAddForm(false); setErrors({}); }} style={{ flex: 1 }} />
                  <Button label={t('misc.add')} variant="primary" onPress={handleAdd} style={{ flex: 1 }} />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Edit Category Sheet */}
      {!!editingCategory && (
        <Modal visible animationType="slide" transparent presentationStyle="pageSheet">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="flex-1 justify-end">
              <View className="bg-white rounded-t-3xl pt-3 pb-10 px-5">
                <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />

                {confirmingDelete ? (
                  <>
                    <Text className="text-xl font-bold text-slate-800 mb-2" style={{ textAlign }}>
                      {t('misc.delete')} "{editingCategory.name}"?
                    </Text>
                    <Text className="text-slate-500 text-sm mb-6" style={{ textAlign }}>
                      {t('budget.deleteConfirm')}
                    </Text>
                    <View className="flex-row gap-3">
                      <Button label={t('misc.cancel')} variant="secondary" onPress={() => setConfirmingDelete(false)} style={{ flex: 1 }} />
                      <Button label={t('misc.delete')} variant="danger" onPress={() => { deleteCategory(editingCategory.id); closeEditModal(); }} style={{ flex: 1 }} />
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="text-xl font-bold text-slate-800 mb-4" style={{ textAlign }}>
                      {t('budget.editTitle')}
                    </Text>

                    <Text className="text-sm font-medium text-slate-600 mb-1">{t('budget.name')}</Text>
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      placeholder={t('budget.namePlaceholder')}
                      placeholderTextColor="#94a3b8"
                      className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 mb-3"
                    />

                    <AmountInput value={newLimit} onChangeText={setNewLimit} label={t('budget.limit')} />

                    <View className="flex-row gap-3 mt-2">
                      <Button label={t('misc.cancel')} variant="secondary" onPress={closeEditModal} style={{ flex: 1 }} />
                      <Button label={t('misc.save')} variant="primary" onPress={handleSaveCategory} style={{ flex: 1 }} />
                    </View>

                    <TouchableOpacity
                      onPress={() => setConfirmingDelete(true)}
                      className="mt-4 py-3 items-center"
                    >
                      <Text className="text-red-500 font-medium text-sm">{t('misc.delete')} "{editingCategory.name}"</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
