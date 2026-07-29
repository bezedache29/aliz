import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { useDeleteStock } from '@/src/apis/backendApi/hooks/stock/useDeleteStock'
import { useStock } from '@/src/apis/backendApi/hooks/stock/useStock'
import { useUpdateStock } from '@/src/apis/backendApi/hooks/stock/useUpdateStock'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
  SectionList,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { AvatarButton } from '@/src/components/avatar-button'
import { Button } from '@/src/components/button'
import { Text } from '@/src/components/text'
import { CATEGORY_ICONS, ProvisionCard } from '@/src/features/provisions/ProvisionCard'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import {
  STOCK_CATEGORIES,
  STOCK_ITEM_STATES,
  STOCK_UNITS,
  StockCategory,
  StockItem,
  StockItemState,
  getExpiryStatus,
} from '@/src/models/stock/stock-item.model'

type EditForm = {
  quantity: string
  unit: string
  category: StockCategory
  itemState: StockItemState | ''
  expiryDate: string | null
}

export default function FridgeScreen() {
  const c = useColors()
  const router = useRouter()
  const { data: provisions = [], refetch } = useStock()
  const { mutate: deleteStock } = useDeleteStock()
  const { mutate: updateStock } = useUpdateStock()
  const { refreshing, refresh } = useRefresh(() => refetch().then(() => {}))

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<StockCategory | null>(null)

  const [editItem, setEditItem] = useState<StockItem | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    quantity: '1',
    unit: 'pièce(s)',
    category: 'Frais',
    itemState: '',
    expiryDate: null,
  })
  const [calendarVisible, setCalendarVisible] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(dayjs().format('YYYY-MM-DD'))
  const editSheetRef = useRef<BottomSheetModal>(null)

  const alertItems = useMemo(
    () =>
      provisions.filter((item) => {
        const s = getExpiryStatus(item)
        return s === 'expired' || s === 'critical'
      }),
    [provisions],
  )

  const filteredProvisions = useMemo(() => {
    let result = provisions
    if (activeCategory) result = result.filter((it) => it.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      result = result.filter((it) => {
        const name = it.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        return name.includes(q)
      })
    }
    return result
  }, [provisions, activeCategory, searchQuery])

  const sections = useMemo(() => {
    const grouped = new Map<StockCategory, StockItem[]>()
    for (const item of filteredProvisions) {
      const existing = grouped.get(item.category) ?? []
      grouped.set(item.category, [...existing, item])
    }
    return STOCK_CATEGORIES.filter((cat) => grouped.has(cat)).map((cat) => ({
      title: cat,
      data: grouped.get(cat)!,
    }))
  }, [filteredProvisions])

  function handleDelete(id: string) {
    deleteStock(id)
  }

  function handleEdit(item: StockItem) {
    setEditItem(item)
    setEditForm({
      quantity: String(item.quantity),
      unit: item.unit,
      category: item.category,
      itemState: item.state ?? '',
      expiryDate: item.expiryDate ?? null,
    })
    editSheetRef.current?.present()
  }

  function setEditField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleEditSubmit() {
    if (!editItem) return
    const qty = parseFloat(editForm.quantity)
    if (isNaN(qty) || qty <= 0) return

    updateStock(
      {
        ...editItem,
        quantity: qty,
        unit: editForm.unit,
        category: editForm.category,
        state: editForm.itemState || undefined,
        expiryDate: editForm.expiryDate ?? undefined,
      },
      { onSuccess: () => editSheetRef.current?.dismiss() },
    )
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  const isEmpty = filteredProvisions.length === 0
  const hasFilters = !!activeCategory || searchQuery.length > 0
  const editFormIsValid = parseFloat(editForm.quantity) > 0

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[tw`flex-1`, { backgroundColor: c.background }]}
    >
      <View style={tw`flex-row items-center justify-between px-4 pt-4 pb-4`}>
        <Text variant="heading1" style={{ fontWeight: '700' }}>
          Provisions
        </Text>
        <AvatarButton />
      </View>

      {/* Alerte DLC */}
      {alertItems.length > 0 && (
        <View
          style={[
            tw`mx-4 mt-4 p-3 rounded-2xl flex-row items-center gap-2`,
            { backgroundColor: c.danger + '15', borderWidth: 1, borderColor: c.danger + '40' },
          ]}
        >
          <Ionicons name="warning-outline" size={18} color={c.danger} />
          <Text variant="caption" style={{ color: c.danger, fontWeight: '600', flex: 1 }}>
            {alertItems.length} article{alertItems.length > 1 ? 's' : ''} expiré
            {alertItems.length > 1 ? 's' : ''} ou à consommer d&apos;urgence
          </Text>
        </View>
      )}

      {/* Barre de recherche */}
      <View style={tw`px-4 pt-3 gap-2`}>
        <View
          style={[
            tw`flex-row items-center px-4 rounded-xl gap-3`,
            { backgroundColor: c.surfaceElevated, height: 48 },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={c.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher une provision..."
            placeholderTextColor={c.textMuted}
            style={{ flex: 1, color: c.textPrimary, fontSize: 15 }}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity hitSlop={8} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres catégorie */}
        <FlatList
          data={STOCK_CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(cat) => cat}
          contentContainerStyle={tw`gap-2 pb-1`}
          renderItem={({ item: cat }) => {
            const isActive = activeCategory === cat
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(isActive ? null : cat)}
                style={[
                  tw`flex-row items-center gap-1.5 px-3 py-2 rounded-xl`,
                  { backgroundColor: isActive ? c.primary : c.surfaceElevated },
                ]}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat]}
                  size={13}
                  color={isActive ? '#FFFFFF' : c.textSecondary}
                />
                <Text
                  variant="caption"
                  style={{ color: isActive ? '#FFFFFF' : c.textSecondary, fontWeight: '600' }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            )
          }}
        />
      </View>

      {/* Contenu */}
      {isEmpty ? (
        <EmptyState
          hasFilters={hasFilters}
          onAdd={() => router.push('/provision-add')}
          onReset={() => {
            setActiveCategory(null)
            setSearchQuery('')
          }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`px-4 pt-3 pb-28`}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
          }
          renderSectionHeader={({ section: { title, data } }) => (
            <SectionHeader title={title as StockCategory} count={data.length} />
          )}
          renderItem={({ item }) => (
            <ProvisionCard item={item} onDelete={handleDelete} onEdit={handleEdit} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/provision-add')}
        style={[
          tw`absolute bottom-12 right-6 w-14 h-14 rounded-full items-center justify-center`,
          {
            backgroundColor: c.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom sheet édition */}
      <BottomSheetModal
        ref={editSheetRef}
        snapPoints={['75%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
        keyboardBehavior="extend"
        onDismiss={() => setEditItem(null)}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={tw`px-4 pt-2 pb-10 gap-5`}
        >
          {/* Nom (lecture seule) */}
          <View style={tw`gap-0.5`}>
            <Text variant="heading3" style={{ fontWeight: '700' }}>
              {editItem?.name}
            </Text>
            {editItem?.brand ? (
              <Text variant="caption" color="muted">
                {editItem.brand}
              </Text>
            ) : null}
          </View>

          {/* Quantité */}
          <EditField label="Quantité *">
            <BottomSheetTextInput
              value={editForm.quantity}
              onChangeText={(v) => setEditField('quantity', v)}
              keyboardType="numeric"
              selectTextOnFocus
              style={[
                tw`px-4 rounded-xl`,
                {
                  color: c.textPrimary,
                  backgroundColor: c.surfaceElevated,
                  height: 48,
                  fontSize: 15,
                  width: 120,
                },
              ]}
            />
          </EditField>

          {/* Unité */}
          <EditField label="Unité">
            <View style={tw`flex-row flex-wrap gap-2`}>
              {STOCK_UNITS.map((u) => (
                <EditChip
                  key={u}
                  label={u}
                  active={editForm.unit === u}
                  onPress={() => setEditField('unit', u)}
                />
              ))}
            </View>
          </EditField>

          {/* Catégorie */}
          <EditField label="Catégorie">
            <View style={tw`flex-row flex-wrap gap-2`}>
              {STOCK_CATEGORIES.map((cat) => {
                const catColors: Record<StockCategory, string> = {
                  Frais: c.primary,
                  Sec: c.warning,
                  Conserve: c.info,
                  Surgelé: c.tertiary,
                }
                return (
                  <EditChip
                    key={cat}
                    label={cat}
                    active={editForm.category === cat}
                    onPress={() => setEditField('category', cat)}
                  />
                )
              })}
            </View>
          </EditField>

          {/* État */}
          <EditField label="État (optionnel)">
            <View style={tw`flex-row flex-wrap gap-2`}>
              {STOCK_ITEM_STATES.map((s) => (
                <EditChip
                  key={s}
                  label={s}
                  active={editForm.itemState === s}
                  onPress={() =>
                    setEditField('itemState', editForm.itemState === s ? '' : (s as StockItemState))
                  }
                />
              ))}
            </View>
          </EditField>

          {/* DLC */}
          <EditField label="Date limite de consommation (optionnel)">
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss()
                setCalendarMonth(editForm.expiryDate ?? dayjs().format('YYYY-MM-DD'))
                setCalendarVisible(true)
              }}
              style={[
                tw`flex-row items-center gap-3 px-4 rounded-xl`,
                {
                  backgroundColor: c.surfaceElevated,
                  height: 48,
                  borderWidth: editForm.expiryDate ? 1 : 0,
                  borderColor: c.primary + '60',
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={editForm.expiryDate ? c.primary : c.textMuted}
              />
              <Text
                variant="body"
                style={{ color: editForm.expiryDate ? c.textPrimary : c.textMuted, flex: 1 }}
              >
                {editForm.expiryDate
                  ? dayjs(editForm.expiryDate).format('DD/MM/YYYY')
                  : 'Choisir une date'}
              </Text>
              {editForm.expiryDate && (
                <TouchableOpacity hitSlop={8} onPress={() => setEditField('expiryDate', null)}>
                  <Ionicons name="close-circle" size={18} color={c.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </EditField>

          <Button
            label="Enregistrer"
            fullWidth
            disabled={!editFormIsValid}
            onPress={handleEditSubmit}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Calendrier DLC édition */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={tw`flex-1 bg-black/50 justify-center px-4`}>
          <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: c.surface }]}>
            <View style={tw`flex-row items-center justify-between px-4 pt-4`}>
              <Text variant="body" style={{ fontWeight: '700' }}>
                Choisir une date
              </Text>
              <TouchableOpacity hitSlop={8} onPress={() => setCalendarVisible(false)}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row items-center justify-center gap-3 pt-2`}>
              <TouchableOpacity
                onPress={() =>
                  setCalendarMonth((prev) => dayjs(prev).subtract(1, 'year').format('YYYY-MM-DD'))
                }
                style={[tw`px-3 py-1.5 rounded-lg`, { backgroundColor: c.surfaceElevated }]}
              >
                <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                  − 1 an
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setCalendarMonth((prev) => dayjs(prev).add(1, 'year').format('YYYY-MM-DD'))
                }
                style={[tw`px-3 py-1.5 rounded-lg`, { backgroundColor: c.surfaceElevated }]}
              >
                <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                  + 1 an
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ minHeight: 420, justifyContent: 'space-between' }}>
              <Calendar
                key={calendarMonth}
                current={calendarMonth}
                onMonthChange={(month) => setCalendarMonth(month.dateString)}
                onDayPress={(day) => {
                  setEditField('expiryDate', day.dateString)
                  setCalendarVisible(false)
                }}
                markedDates={
                  editForm.expiryDate
                    ? { [editForm.expiryDate]: { selected: true, selectedColor: c.primary } }
                    : {}
                }
                minDate={dayjs().format('YYYY-MM-DD')}
                firstDay={1}
                showSixWeeks
                theme={{
                  backgroundColor: c.surface,
                  calendarBackground: c.surface,
                  textSectionTitleColor: c.textMuted,
                  selectedDayBackgroundColor: c.primary,
                  selectedDayTextColor: '#FFFFFF',
                  todayTextColor: c.primary,
                  dayTextColor: c.textPrimary,
                  textDisabledColor: c.textMuted,
                  dotColor: c.primary,
                  arrowColor: c.primary,
                  monthTextColor: c.textPrimary,
                }}
              />

              <TouchableOpacity
                onPress={() => {
                  setEditField('expiryDate', dayjs().format('YYYY-MM-DD'))
                  setCalendarVisible(false)
                }}
                style={tw`items-center pb-4 pt-2`}
              >
                <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                  Aujourd&apos;hui
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: StockCategory; count: number }) {
  const c = useColors()
  const icon = CATEGORY_ICONS[title]

  const color = {
    Frais: c.primary,
    Sec: c.warning,
    Conserve: c.info,
    Surgelé: c.tertiary,
  }[title]

  return (
    <View
      style={[
        tw`flex-row items-center gap-2 mt-4 mb-1 pl-3 py-1`,
        { borderLeftWidth: 3, borderLeftColor: color },
      ]}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text variant="label" style={{ color, fontWeight: '700', letterSpacing: 0.6 }}>
        {title.toUpperCase()}
      </Text>
      <Text variant="label" style={{ color: c.textMuted }}>
        ({count})
      </Text>
    </View>
  )
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useColors()
  return (
    <View style={tw`gap-2`}>
      <Text variant="caption" style={{ color: c.textMuted, fontWeight: '600', letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  )
}

function EditChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const c = useColors()
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`px-3 py-2 rounded-xl`,
        {
          backgroundColor: active ? c.primary : c.surfaceElevated,
          borderWidth: 1,
          borderColor: active ? c.primary : 'transparent',
        },
      ]}
    >
      <Text
        variant="caption"
        style={{ color: active ? '#FFFFFF' : c.textSecondary, fontWeight: '600' }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function EmptyState({
  hasFilters,
  onAdd,
  onReset,
}: {
  hasFilters: boolean
  onAdd: () => void
  onReset: () => void
}) {
  const c = useColors()
  return (
    <View style={tw`flex-1 items-center pt-12 px-8 gap-4`}>
      <View
        style={[
          tw`w-20 h-20 rounded-full items-center justify-center`,
          { backgroundColor: c.primary + '15' },
        ]}
      >
        <Ionicons
          name={hasFilters ? 'filter-outline' : 'basket-outline'}
          size={36}
          color={c.primary}
        />
      </View>
      <Text variant="heading3" style={{ fontWeight: '700', textAlign: 'center' }}>
        {hasFilters ? 'Aucune provision trouvée' : 'Provisions vides'}
      </Text>
      <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
        {hasFilters
          ? 'Aucune provision ne correspond à ces critères.'
          : 'Ajoute tes aliments disponibles pour suivre tes provisions et leurs dates de péremption.'}
      </Text>
      {hasFilters ? (
        <TouchableOpacity
          onPress={onReset}
          style={[
            tw`flex-row items-center gap-2 px-6 py-3 rounded-xl`,
            { backgroundColor: c.surfaceElevated },
          ]}
        >
          <Ionicons name="refresh-outline" size={18} color={c.textSecondary} />
          <Text variant="body" style={{ color: c.textSecondary, fontWeight: '600' }}>
            Réinitialiser les filtres
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onAdd}
          style={[
            tw`flex-row items-center gap-2 px-6 py-3 rounded-xl`,
            { backgroundColor: c.primary },
          ]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Ajouter une provision
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
