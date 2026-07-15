import Ionicons from '@expo/vector-icons/Ionicons'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useAddPreference } from '@/src/apis/backendApi/hooks/preference/useAddPreference'
import { useDeletePreference } from '@/src/apis/backendApi/hooks/preference/useDeletePreference'
import { usePreferences } from '@/src/apis/backendApi/hooks/preference/usePreferences'
import { ScreenHeader } from '@/src/components/screen-header'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import type { FoodPreference, PreferenceType } from '@/src/models/preference/food-preference.model'

export default function FoodPreferencesScreen() {
  const c = useColors()
  const { data: preferences, isLoading, refetch } = usePreferences()
  const { refreshing, refresh } = useRefresh(() => refetch().then(() => {}))
  const [activeTab, setActiveTab] = useState<PreferenceType>('liked')

  const tabs = [
    {
      key: 'liked' as PreferenceType,
      label: "J'aime",
      icon: 'heart' as const,
      color: c.primary,
      count: preferences?.liked.length ?? 0,
    },
    {
      key: 'disliked' as PreferenceType,
      label: "Je n'aime pas",
      icon: 'ban' as const,
      color: c.danger,
      count: preferences?.disliked.length ?? 0,
    },
  ]

  const active = tabs.find((t) => t.key === activeTab)!

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScreenHeader title="Préférences" />

      {/* Contrôle segmenté */}
      <View style={[tw`mx-4 my-5 p-1 rounded-2xl`, { backgroundColor: c.surfaceElevated }]}>
        <View style={tw`flex-row`}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
                style={[
                  tw`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl`,
                  isActive && { backgroundColor: c.surface, elevation: 3 },
                ]}
              >
                <Ionicons name={tab.icon} size={14} color={isActive ? tab.color : c.textMuted} />
                <Text
                  variant="caption"
                  style={{
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? tab.color : c.textMuted,
                  }}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      tw`rounded-full w-5 h-5 items-center justify-center`,
                      { backgroundColor: isActive ? tab.color : c.border },
                    ]}
                  >
                    <Text
                      style={{
                        color: isActive ? '#fff' : c.textMuted,
                        fontSize: 10,
                        fontWeight: '700',
                        lineHeight: 20,
                      }}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Contenu */}
      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
          }
        >
          <PreferenceContent
            key={activeTab}
            type={activeTab}
            accentColor={active.color}
            items={
              activeTab === 'liked' ? (preferences?.liked ?? []) : (preferences?.disliked ?? [])
            }
          />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Contenu de l'onglet ─────────────────────────────────────────────────────

interface PreferenceContentProps {
  type: PreferenceType
  accentColor: string
  items: FoodPreference[]
}

function PreferenceContent({ type, accentColor, items }: PreferenceContentProps) {
  const c = useColors()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate: addPreference, isPending: isAdding } = useAddPreference()
  const {
    mutate: deletePreference,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeletePreference()

  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    setError(null)
    addPreference(
      { foodName: trimmed, type },
      {
        onSuccess: () => setValue(''),
        onError: (err) => {
          if (isAxiosError(err) && err.response?.status === 409) {
            setError('Déjà dans la liste')
          } else {
            setError('Une erreur est survenue')
          }
        },
      },
    )
  }

  return (
    <View style={tw`px-4 pt-2 pb-10 gap-8`}>
      {/* Champ d'ajout */}
      <View style={tw`gap-2`}>
        <View
          style={[
            tw`flex-row items-center rounded-2xl px-4 gap-3 border-2`,
            {
              backgroundColor: c.surface,
              borderColor: error ? c.danger : accentColor + '35',
            },
          ]}
        >
          <Ionicons
            name={type === 'liked' ? 'heart-outline' : 'ban-outline'}
            size={18}
            color={accentColor + '80'}
          />
          <TextInput
            style={[tw`flex-1 py-4 text-base`, { color: c.textPrimary }]}
            placeholder={
              type === 'liked' ? 'Un aliment que vous aimez...' : 'Un aliment à éviter...'
            }
            placeholderTextColor={c.textMuted}
            value={value}
            onChangeText={(t) => {
              setValue(t)
              setError(null)
            }}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAdd}
            disabled={!value.trim() || isAdding}
            hitSlop={8}
            activeOpacity={0.7}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <View
                style={[
                  tw`rounded-full w-8 h-8 items-center justify-center`,
                  { backgroundColor: value.trim() ? accentColor : c.surfaceElevated },
                ]}
              >
                <Ionicons name="add" size={20} color={value.trim() ? '#fff' : c.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        </View>
        {error && (
          <Text variant="caption" color="danger" style={tw`pl-1`}>
            {error}
          </Text>
        )}
      </View>

      {/* Chips ou empty state */}
      {items.length > 0 ? (
        <View style={tw`flex-row flex-wrap gap-2.5`}>
          {items.map((item) => (
            <FoodChip
              key={item.id}
              item={item}
              accentColor={accentColor}
              onDelete={() => deletePreference(item.id)}
              isDeleting={isDeleting && deletingId === item.id}
            />
          ))}
        </View>
      ) : (
        <EmptyState type={type} accentColor={accentColor} />
      )}
    </View>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ type, accentColor }: { type: PreferenceType; accentColor: string }) {
  return (
    <View style={tw`items-center py-12 gap-4`}>
      <View
        style={[
          tw`w-20 h-20 rounded-full items-center justify-center`,
          { backgroundColor: accentColor + '15' },
        ]}
      >
        <Ionicons
          name={type === 'liked' ? 'heart-outline' : 'ban-outline'}
          size={36}
          color={accentColor}
        />
      </View>
      <View style={tw`items-center gap-1`}>
        <Text variant="heading3" color="muted">
          {type === 'liked' ? 'Aucun favori' : 'Aucun aliment exclu'}
        </Text>
        <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
          {type === 'liked'
            ? 'Ajoutez les aliments que vous aimez\npour personnaliser vos recettes'
            : 'Ajoutez les aliments que vous évitez\npour les exclure de vos recettes'}
        </Text>
      </View>
    </View>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface FoodChipProps {
  item: FoodPreference
  accentColor: string
  onDelete: () => void
  isDeleting: boolean
}

function FoodChip({ item, accentColor, onDelete, isDeleting }: FoodChipProps) {
  return (
    <View
      style={[
        tw`flex-row items-center gap-2 rounded-full border px-3 py-2`,
        { borderColor: accentColor + '60', backgroundColor: accentColor + '12' },
      ]}
    >
      <Text variant="label" style={{ color: accentColor, fontWeight: '600' }}>
        {item.foodName}
      </Text>
      {isDeleting ? (
        <ActivityIndicator size="small" color={accentColor} style={{ width: 14, height: 14 }} />
      ) : (
        <TouchableOpacity onPress={onDelete} hitSlop={6} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={16} color={accentColor + '90'} />
        </TouchableOpacity>
      )}
    </View>
  )
}
