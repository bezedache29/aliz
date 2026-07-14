import Ionicons from '@expo/vector-icons/Ionicons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { isAxiosError } from 'axios'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useCreateStock } from '@/src/apis/backendApi/hooks/stock/useCreateStock'
import { useCiqualSearch } from '@/src/apis/ciqualApi/hooks/food/useCiqualSearch'
import { useFoodByBarcode } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodByBarcode'
import { useFoodSearch } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodSearch'
import { Button } from '@/src/components/button'
import { ScreenHeader } from '@/src/components/screen-header'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import { FoodProduct } from '@/src/models/food/food.model'
import {
  STOCK_CATEGORIES,
  STOCK_ITEM_STATES,
  STOCK_UNITS,
  StockCategory,
  StockItemState,
} from '@/src/models/stock/stock-item.model'
import { customFoodsAtom, searchCustomFoods } from '@/src/store/customFoodsAtom'

type Tab = 'search' | 'barcode'
type SearchSource = 'ciqual' | 'off' | 'both'

type FormState = {
  name: string
  brand: string
  quantity: string
  unit: string
  category: StockCategory
  itemState: StockItemState | ''
  expiryDate: string | null
  kcal: string
  proteines: string
  glucides: string
  lipides: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  brand: '',
  quantity: '1',
  unit: 'pièce(s)',
  category: 'Frais',
  itemState: '',
  expiryDate: null,
  kcal: '',
  proteines: '',
  glucides: '',
  lipides: '',
}

function foodToForm(food: FoodProduct): Partial<FormState> {
  return {
    name: food.name,
    brand: food.brand ?? '',
    quantity: '1',
    unit: 'pièce(s)',
  }
}

export default function AddProvisionScreen() {
  const c = useColors()
  const router = useRouter()
  const { mutate: createStock } = useCreateStock()
  const [customFoods] = useAtom(customFoodsAtom)

  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [searchSource, setSearchSource] = useState<SearchSource>('ciqual')
  const [searchQuery, setSearchQuery] = useState('')
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)
  const [selectedFood, setSelectedFood] = useState<FoodProduct | null>(null)
  const [isManual, setIsManual] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [calendarVisible, setCalendarVisible] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [permission, requestPermission] = useCameraPermissions()

  const formSheetRef = useRef<BottomSheetModal>(null)

  const { data: ciqualResults = [], isFetching: ciqualLoading } = useCiqualSearch(
    searchQuery,
    searchSource === 'ciqual' || searchSource === 'both',
  )
  const { data: offResults = [], isFetching: offLoading } = useFoodSearch(
    searchQuery,
    searchSource === 'off' || searchSource === 'both',
  )
  const { data: barcodeFood, isFetching: barcodeLoading } = useFoodByBarcode(scannedBarcode)

  const customResults = searchCustomFoods(customFoods, searchQuery)

  const searchResults = [
    ...customResults,
    ...ciqualResults.filter((f) => !customResults.some((c) => c.id === f.id)),
    ...offResults.filter(
      (f) => !customResults.some((c) => c.id === f.id) && !ciqualResults.some((r) => r.id === f.id),
    ),
  ]

  const isSearchLoading = (ciqualLoading || offLoading) && searchQuery.trim().length >= 2

  useEffect(() => {
    if (barcodeFood) {
      openFormWithFood(barcodeFood)
    }
  }, [barcodeFood])

  function openFormWithFood(food: FoodProduct) {
    setSelectedFood(food)
    setIsManual(false)
    setForm({ ...DEFAULT_FORM, ...foodToForm(food) })
    formSheetRef.current?.present()
  }

  function openManualForm() {
    setSelectedFood(null)
    setIsManual(true)
    setForm(DEFAULT_FORM)
    formSheetRef.current?.present()
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const qty = parseFloat(form.quantity)
    if (!form.name.trim() || isNaN(qty) || qty <= 0) return

    setFieldErrors({})
    setApiError(null)

    const source = isManual ? 'manual' : (selectedFood?.source ?? 'manual')

    const manualPer100g =
      isManual && (form.kcal || form.proteines || form.glucides || form.lipides)
        ? {
            kcal: parseFloat(form.kcal) || 0,
            proteines: parseFloat(form.proteines) || 0,
            glucides: parseFloat(form.glucides) || 0,
            lipides: parseFloat(form.lipides) || 0,
          }
        : undefined

    createStock(
      {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        quantity: qty,
        unit: form.unit,
        category: form.category,
        state: form.itemState || undefined,
        expiryDate: form.expiryDate ?? undefined,
        per100g: selectedFood?.per100g ?? manualPer100g,
        source,
        foodProductId: selectedFood?.id,
      },
      {
        onSuccess: () => {
          ToastAndroid.show('Provision ajoutée !', ToastAndroid.SHORT)
          formSheetRef.current?.dismiss()
          router.back()
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.data?.errors) {
            const serverErrors = error.response.data.errors as Record<string, string[]>
            const mapped: Record<string, string> = {}
            let hasOtherError = false

            for (const [key, messages] of Object.entries(serverErrors)) {
              if (key === 'name' || key === 'quantity') {
                mapped[key] = messages[0]
              } else {
                hasOtherError = true
              }
            }

            if (Object.keys(mapped).length > 0) setFieldErrors(mapped)
            if (hasOtherError)
              setApiError('Une erreur est survenue. Vérifie les informations saisies.')
          } else {
            setApiError('Une erreur est survenue. Réessaie.')
          }
        },
      },
    )
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  )

  const formIsValid = form.name.trim().length > 0 && parseFloat(form.quantity) > 0

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScreenHeader title="Ajouter une provision" />

      {/* Onglets */}
      <View style={tw`flex-row gap-2 px-4 pb-3`}>
        {(
          [
            { key: 'search', label: 'Recherche', icon: 'search-outline' },
            { key: 'barcode', label: 'Scanner', icon: 'barcode-outline' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
                { backgroundColor: isActive ? c.primary : c.surfaceElevated },
              ]}
            >
              <Ionicons name={tab.icon} size={16} color={isActive ? '#FFFFFF' : c.textSecondary} />
              <Text
                variant="caption"
                style={{ color: isActive ? '#FFFFFF' : c.textSecondary, fontWeight: '600' }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {activeTab === 'search' ? (
        <SearchTab
          c={c}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchSource={searchSource}
          onSourceChange={setSearchSource}
          results={searchResults}
          isLoading={isSearchLoading}
          onSelectFood={openFormWithFood}
          onManual={openManualForm}
        />
      ) : (
        <BarcodeTab
          c={c}
          permission={permission}
          requestPermission={requestPermission}
          scannedBarcode={scannedBarcode}
          isLoading={barcodeLoading}
          onScan={setScannedBarcode}
        />
      )}

      {/* Bottom sheet formulaire */}
      <BottomSheetModal
        ref={formSheetRef}
        snapPoints={['95%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
        keyboardBehavior="extend"
        onDismiss={() => {
          setSelectedFood(null)
          setIsManual(false)
        }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`px-4 pt-2 pb-10 gap-5`}
        >
          {/* Titre formulaire */}
          <Text variant="heading3" style={{ fontWeight: '700' }}>
            {isManual ? 'Saisie manuelle' : (selectedFood?.name ?? '')}
          </Text>

          {/* Nom */}
          {isManual && (
            <FormField label="Nom de l'aliment *">
              <BottomSheetTextInput
                value={form.name}
                onChangeText={(v) => setField('name', v)}
                placeholder="ex : Tomates cerises"
                placeholderTextColor={c.textMuted}
                style={[
                  tw`px-4 rounded-xl`,
                  {
                    color: c.textPrimary,
                    backgroundColor: c.surfaceElevated,
                    height: 48,
                    fontSize: 15,
                  },
                ]}
              />
              {fieldErrors.name && (
                <Text variant="caption" style={{ color: '#ef4444' }}>
                  {fieldErrors.name}
                </Text>
              )}
            </FormField>
          )}

          {/* Marque (manuel uniquement) */}
          {isManual && (
            <FormField label="Marque (optionnel)">
              <BottomSheetTextInput
                value={form.brand}
                onChangeText={(v) => setField('brand', v)}
                placeholder="ex : Bonduelle"
                placeholderTextColor={c.textMuted}
                style={[
                  tw`px-4 rounded-xl`,
                  {
                    color: c.textPrimary,
                    backgroundColor: c.surfaceElevated,
                    height: 48,
                    fontSize: 15,
                  },
                ]}
              />
            </FormField>
          )}

          {/* Macros manuels */}
          {isManual && (
            <FormField label="Macronutriments /100g (optionnel)">
              <View style={tw`flex-row gap-2`}>
                <MacroInput
                  label="Kcal"
                  value={form.kcal}
                  onChangeText={(v) => setField('kcal', v)}
                  color={c.warning}
                />
                <MacroInput
                  label="Prot."
                  value={form.proteines}
                  onChangeText={(v) => setField('proteines', v)}
                  color={c.primary}
                />
                <MacroInput
                  label="Glu."
                  value={form.glucides}
                  onChangeText={(v) => setField('glucides', v)}
                  color={c.info}
                />
                <MacroInput
                  label="Lip."
                  value={form.lipides}
                  onChangeText={(v) => setField('lipides', v)}
                  color={c.tertiary}
                />
              </View>
            </FormField>
          )}

          {/* Quantité */}
          <FormField label="Quantité *">
            <BottomSheetTextInput
              value={form.quantity}
              onChangeText={(v) => setField('quantity', v)}
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
            {fieldErrors.quantity && (
              <Text variant="caption" style={{ color: '#ef4444' }}>
                {fieldErrors.quantity}
              </Text>
            )}
          </FormField>

          {/* Unité */}
          <FormField label="Unité">
            <View style={tw`flex-row flex-wrap gap-2`}>
              {STOCK_UNITS.map((u) => (
                <Chip
                  key={u}
                  label={u}
                  active={form.unit === u}
                  onPress={() => setField('unit', u)}
                  c={c}
                />
              ))}
            </View>
          </FormField>

          {/* Catégorie */}
          <FormField label="Catégorie">
            <View style={tw`flex-row flex-wrap gap-2`}>
              {STOCK_CATEGORIES.map((cat) => {
                return (
                  <Chip
                    key={cat}
                    label={cat}
                    active={form.category === cat}
                    onPress={() => setField('category', cat)}
                    c={c}
                  />
                )
              })}
            </View>
          </FormField>

          {/* État */}
          <FormField label="État (optionnel)">
            <View style={tw`flex-row flex-wrap gap-2`}>
              {STOCK_ITEM_STATES.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={form.itemState === s}
                  onPress={() => setField('itemState', form.itemState === s ? '' : s)}
                  c={c}
                />
              ))}
            </View>
          </FormField>

          {/* DLC */}
          <FormField label="Date limite de consommation (optionnel)">
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss()
                setCalendarVisible(true)
              }}
              style={[
                tw`flex-row items-center gap-3 px-4 rounded-xl`,
                {
                  backgroundColor: c.surfaceElevated,
                  height: 48,
                  borderWidth: form.expiryDate ? 1 : 0,
                  borderColor: c.primary + '60',
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={form.expiryDate ? c.primary : c.textMuted}
              />
              <Text
                variant="body"
                style={{ color: form.expiryDate ? c.textPrimary : c.textMuted, flex: 1 }}
              >
                {form.expiryDate ? dayjs(form.expiryDate).format('DD/MM/YYYY') : 'Choisir une date'}
              </Text>
              {form.expiryDate && (
                <TouchableOpacity hitSlop={8} onPress={() => setField('expiryDate', null)}>
                  <Ionicons name="close-circle" size={18} color={c.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </FormField>

          {/* Macros info (si disponible) */}
          {selectedFood?.per100g && (
            <View
              style={[tw`p-3 rounded-xl flex-row gap-4`, { backgroundColor: c.surfaceElevated }]}
            >
              <MacroCell label="Kcal" value={selectedFood.per100g.kcal} color={c.warning} />
              <MacroCell label="Prot." value={selectedFood.per100g.proteines} color={c.primary} />
              <MacroCell label="Glu." value={selectedFood.per100g.glucides} color={c.info} />
              <MacroCell label="Lip." value={selectedFood.per100g.lipides} color={c.tertiary} />
              <Text variant="label" color="muted" style={tw`self-end`}>
                /100g
              </Text>
            </View>
          )}

          {apiError && (
            <View
              style={[
                tw`rounded-xl px-4 py-3`,
                { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444' },
              ]}
            >
              <Text variant="caption" style={{ color: '#ef4444' }}>
                {apiError}
              </Text>
            </View>
          )}

          <Button
            label="Ajouter aux provisions"
            fullWidth
            disabled={!formIsValid}
            onPress={handleSubmit}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Calendrier DLC */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableOpacity
          style={tw`flex-1 bg-black/50 justify-center px-4`}
          activeOpacity={1}
          onPress={() => setCalendarVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: c.surface }]}
          >
            <Calendar
              onDayPress={(day) => {
                setField('expiryDate', day.dateString)
                setCalendarVisible(false)
              }}
              markedDates={
                form.expiryDate
                  ? { [form.expiryDate]: { selected: true, selectedColor: c.primary } }
                  : {}
              }
              minDate={dayjs().format('YYYY-MM-DD')}
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

const SEARCH_SOURCES: { key: SearchSource; label: string }[] = [
  { key: 'ciqual', label: 'Ciqual' },
  { key: 'off', label: 'OFF' },
  { key: 'both', label: 'Les deux' },
]

function SearchTab({
  c,
  searchQuery,
  onSearchChange,
  searchSource,
  onSourceChange,
  results,
  isLoading,
  onSelectFood,
  onManual,
}: {
  c: ReturnType<typeof useColors>
  searchQuery: string
  onSearchChange: (v: string) => void
  searchSource: SearchSource
  onSourceChange: (s: SearchSource) => void
  results: FoodProduct[]
  isLoading: boolean
  onSelectFood: (food: FoodProduct) => void
  onManual: () => void
}) {
  return (
    <View style={tw`flex-1`}>
      <View style={tw`px-4 gap-2 pb-2`}>
        <View
          style={[
            tw`flex-row items-center px-4 rounded-xl gap-3`,
            { backgroundColor: c.surfaceElevated, height: 48 },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={c.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Rechercher un aliment..."
            placeholderTextColor={c.textMuted}
            style={{ flex: 1, color: c.textPrimary, fontSize: 15 }}
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity hitSlop={8} onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle source */}
        <View style={[tw`flex-row rounded-xl p-1 gap-1`, { backgroundColor: c.surfaceElevated }]}>
          {SEARCH_SOURCES.map((s) => {
            const active = searchSource === s.key
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => onSourceChange(s.key)}
                style={[
                  tw`flex-1 items-center py-1.5 rounded-lg`,
                  { backgroundColor: active ? c.primary : 'transparent' },
                ]}
              >
                <Text
                  variant="caption"
                  style={{ color: active ? '#FFFFFF' : c.textSecondary, fontWeight: '600' }}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={tw`flex-1 items-center pt-12`}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : searchQuery.trim().length < 2 ? (
        <View style={tw`flex-1 items-center pt-12 px-8 gap-3`}>
          <Ionicons name="search-outline" size={40} color={c.textMuted} />
          <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Tape au moins 2 caractères pour lancer la recherche.
          </Text>
          <TouchableOpacity
            onPress={onManual}
            style={[
              tw`flex-row items-center gap-2 px-5 py-3 rounded-xl mt-4`,
              { backgroundColor: c.primary },
            ]}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Saisie manuelle
            </Text>
          </TouchableOpacity>
        </View>
      ) : results.length === 0 ? (
        <View style={tw`flex-1 items-center pt-12 px-8 gap-3`}>
          <Ionicons name="help-circle-outline" size={40} color={c.textMuted} />
          <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Aucun aliment trouvé pour « {searchQuery} ».
          </Text>
          <TouchableOpacity
            onPress={onManual}
            style={[
              tw`flex-row items-center gap-2 px-5 py-3 rounded-xl`,
              { backgroundColor: c.primary },
            ]}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Créer manuellement
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`px-4 pb-8`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelectFood(item)}
              style={[tw`flex-row items-center gap-3 py-3 border-b`, { borderColor: c.border }]}
            >
              <View
                style={[
                  tw`w-9 h-9 rounded-full items-center justify-center shrink-0`,
                  { backgroundColor: c.surfaceElevated },
                ]}
              >
                <Ionicons
                  name={item.source === 'manual' ? 'person-outline' : 'nutrition-outline'}
                  size={16}
                  color={c.textSecondary}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {[item.brand, item.per100g ? `${item.per100g.kcal} kcal/100g` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              onPress={onManual}
              style={[tw`flex-row items-center gap-2 py-4 justify-center`]}
            >
              <Ionicons name="create-outline" size={16} color={c.textMuted} />
              <Text variant="caption" color="muted">
                Vous ne trouvez pas ? Saisie manuelle
              </Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  )
}

function BarcodeTab({
  c,
  permission,
  requestPermission,
  scannedBarcode,
  isLoading,
  onScan,
}: {
  c: ReturnType<typeof useColors>
  permission: ReturnType<typeof useCameraPermissions>[0]
  requestPermission: ReturnType<typeof useCameraPermissions>[1]
  scannedBarcode: string | null
  isLoading: boolean
  onScan: (barcode: string) => void
}) {
  if (!permission) {
    return (
      <View style={tw`flex-1 items-center pt-12`}>
        <ActivityIndicator color={c.primary} />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={tw`flex-1 items-center pt-12 px-8 gap-4`}>
        <Ionicons name="camera-outline" size={48} color={c.textMuted} />
        <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
          L&apos;accès à la caméra est nécessaire pour scanner un code-barres.
        </Text>
        <Button label="Autoriser la caméra" onPress={requestPermission} />
      </View>
    )
  }

  return (
    <View style={tw`flex-1`}>
      {isLoading || scannedBarcode ? (
        <View style={tw`flex-1 items-center pt-12 gap-4`}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
            {isLoading ? 'Recherche du produit...' : 'Code scanné, chargement...'}
          </Text>
          {scannedBarcode && !isLoading && (
            <TouchableOpacity onPress={() => onScan('')}>
              <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
                Scanner à nouveau
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={tw`flex-1`}>
          <CameraView
            style={tw`flex-1`}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={(result) => {
              if (!scannedBarcode) onScan(result.data)
            }}
          />
          <View
            style={[tw`absolute top-0 left-0 right-0 bottom-0 items-center justify-center`]}
            pointerEvents="none"
          >
            <View style={[tw`w-64 h-32 rounded-2xl`, { borderWidth: 2, borderColor: c.primary }]} />
            <Text
              variant="body"
              style={[tw`mt-4 text-center`, { color: '#FFFFFF', fontWeight: '600' }]}
            >
              Pointez le code-barres
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
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

function Chip({
  label,
  active,
  onPress,
  c,
}: {
  label: string
  active: boolean
  onPress: () => void
  c: ReturnType<typeof useColors>
}) {
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

function MacroCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={tw`items-center gap-0.5`}>
      <Text variant="body" style={{ fontWeight: '700', color }}>
        {Math.round(value * 10) / 10}
      </Text>
      <Text variant="label" color="muted">
        {label}
      </Text>
    </View>
  )
}

function MacroInput({
  label,
  value,
  onChangeText,
  color,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  color: string
}) {
  const c = useColors()
  return (
    <View style={tw`flex-1 gap-1`}>
      <Text variant="label" style={{ color, fontWeight: '700', textAlign: 'center' }}>
        {label}
      </Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        selectTextOnFocus
        placeholder="–"
        placeholderTextColor={c.textMuted}
        style={[
          tw`rounded-xl text-center`,
          {
            color: c.textPrimary,
            backgroundColor: c.surfaceElevated,
            height: 44,
            fontSize: 15,
          },
        ]}
      />
    </View>
  )
}
