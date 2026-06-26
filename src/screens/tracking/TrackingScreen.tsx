import Ionicons from '@expo/vector-icons/Ionicons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useAtom, useAtomValue } from 'jotai'
import { useRef } from 'react'
import { RefreshControl, TouchableOpacity, View } from 'react-native'

import { ScrollView } from '@/src/components/scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { Card } from '@/src/components/card'
import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { AddWeightSheet } from '@/src/features/tracking/AddWeightSheet'
import { WeightChart } from '@/src/features/tracking/WeightChart'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import { type WeightEntry } from '@/src/models/weight/weight.model'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { weightHistoryAtom } from '@/src/store/weightAtom'
import { spacing } from '@/src/styles/design-tokens'

function weightTrend(entries: WeightEntry[]): 'up' | 'stable' | 'down' {
  if (entries.length < 2) return 'stable'
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const diff = sorted[sorted.length - 1].weight - sorted[sorted.length - 2].weight
  if (diff > 0.2) return 'up'
  if (diff < -0.2) return 'down'
  return 'stable'
}

export default function TrackingScreen() {
  const c = useColors()
  const { refreshing, refresh } = useRefresh()
  const onboarding = useAtomValue(onboardingAtom)
  const [history, setHistory] = useAtom(weightHistoryAtom)
  const addSheetRef = useRef<BottomSheetModal>(null)

  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const trend = weightTrend(history)

  const trendIcon = { up: 'trending-up', stable: 'remove-outline', down: 'trending-down' } as const
  const trendColor = { up: c.danger, stable: c.info, down: c.primary }
  const trendLabel = { up: 'En hausse', stable: 'Stable', down: 'En baisse' }

  const kgToGoal =
    latest && onboarding.targetWeight
      ? Math.abs(latest.weight - onboarding.targetWeight).toFixed(1)
      : null

  function handleSaveWeight(weight: number) {
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: dayjs().toISOString(),
      weight,
      source: 'manual',
    }
    setHistory((prev) => [...prev, entry])
    addSheetRef.current?.dismiss()
  }

  function handleDelete(id: string) {
    setHistory((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScrollView
        contentContainerStyle={tw`p-4 gap-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        <Text variant="heading1">Suivi</Text>

        <Card>
          <View style={tw`flex-row justify-between items-center`}>
            <Text variant="label" color="muted" uppercase>
              Poids
            </Text>
            <View style={tw`flex-row items-center gap-2`}>
              {history.length > 0 && (
                <View
                  style={[
                    tw`flex-row items-center gap-1 px-2 rounded-full`,
                    { paddingVertical: 4, backgroundColor: c.surfaceElevated },
                  ]}
                >
                  <Ionicons name={trendIcon[trend]} size={13} color={trendColor[trend]} />
                  <Text variant="label" style={{ color: trendColor[trend] }}>
                    {trendLabel[trend]}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => addSheetRef.current?.present()}
                style={[
                  tw`flex-row items-center gap-1 px-3 rounded-full`,
                  { paddingVertical: 6, backgroundColor: c.primary + '20' },
                ]}
              >
                <Ionicons name="add" size={14} color={c.primary} />
                <Text variant="label" style={{ color: c.primary, fontWeight: '600' }}>
                  Peser
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {latest ? (
            <>
              <View style={[tw`items-center`, { marginVertical: spacing.md }]}>
                <View style={tw`flex-row items-end`}>
                  <Text
                    style={{
                      fontSize: 64,
                      fontWeight: '900',
                      lineHeight: 64,
                      color: c.textPrimary,
                      letterSpacing: -2,
                    }}
                  >
                    {latest.weight.toFixed(1)}
                  </Text>
                  <Text variant="heading2" color="muted" style={{ marginBottom: 6, marginLeft: 6 }}>
                    kg
                  </Text>
                </View>
                <Text variant="caption" color="muted">
                  {dayjs(latest.date).format('dddd D MMMM')}
                </Text>
              </View>

              {(onboarding.targetWeight || kgToGoal) && (
                <>
                  <View style={[tw`h-px`, { backgroundColor: c.border }]} />
                  <View style={[tw`flex-row justify-between`, { marginTop: spacing.md }]}>
                    {onboarding.targetWeight && (
                      <StatItem
                        label="Objectif"
                        value={`${onboarding.targetWeight}`}
                        unit="kg"
                        size="sm"
                      />
                    )}
                    {kgToGoal && (
                      <StatItem
                        label={
                          latest.weight > (onboarding.targetWeight ?? 0)
                            ? 'Reste à perdre'
                            : 'Objectif dépassé'
                        }
                        value={kgToGoal}
                        unit="kg"
                        size="sm"
                      />
                    )}
                    <StatItem label="Pesées" value={`${history.length}`} unit="" size="sm" />
                  </View>
                </>
              )}

              {history.length >= 2 && (
                <>
                  <View
                    style={[tw`h-px`, { marginVertical: spacing.md, backgroundColor: c.border }]}
                  />
                  <WeightChart entries={history} targetWeight={onboarding.targetWeight} />
                </>
              )}
            </>
          ) : (
            <View style={[tw`items-center`, { paddingVertical: spacing.xl }]}>
              <Ionicons name="scale-outline" size={40} color={c.textMuted} />
              <Text
                variant="body"
                color="muted"
                style={{ marginTop: spacing.sm, textAlign: 'center' }}
              >
                Aucune pesée enregistrée.{'\n'}Appuie sur &quot;Peser&quot; pour commencer.
              </Text>
            </View>
          )}
        </Card>

        {sorted.length > 0 && (
          <View style={tw`gap-2`}>
            <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
              Historique
            </Text>
            <Card noPadding style={tw`px-4`}>
              {sorted.slice(0, 10).map((entry, index) => (
                <View key={entry.id}>
                  {index > 0 && <View style={[tw`h-px`, { backgroundColor: c.border }]} />}
                  <View style={tw`flex-row items-center justify-between py-3`}>
                    <View>
                      <Text variant="body" style={{ fontWeight: '600' }}>
                        {entry.weight.toFixed(1)} kg
                      </Text>
                      <Text variant="caption" color="muted">
                        {dayjs(entry.date).format('dddd D MMMM')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(entry.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={c.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>

      <AddWeightSheet ref={addSheetRef} onSave={handleSaveWeight} />
    </SafeAreaView>
  )
}
