import Ionicons from '@expo/vector-icons/Ionicons'
import { useAtomValue } from 'jotai'
import { ActivityIndicator, RefreshControl, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useDeleteWeight } from '@/src/apis/backendApi/hooks/weight/useDeleteWeight'
import { useWeightHistory } from '@/src/apis/backendApi/hooks/weight/useWeightHistory'
import { ScrollView } from '@/src/components/scroll-view'
import { Card } from '@/src/components/card'
import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { WeightChart } from '@/src/features/tracking/WeightChart'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import { type WeightEntry } from '@/src/models/weight/weight.model'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { spacing } from '@/src/styles/design-tokens'

function weightTrend(entries: WeightEntry[]): 'up' | 'stable' | 'down' {
  const withWeight = entries.filter(
    (e): e is WeightEntry & { weight: number } => e.weight !== null && !!e.measuredAt,
  )
  if (withWeight.length < 2) return 'stable'
  const sorted = [...withWeight].sort((a, b) =>
    a.measuredAt < b.measuredAt ? -1 : a.measuredAt > b.measuredAt ? 1 : 0,
  )
  const diff = sorted[sorted.length - 1].weight - sorted[sorted.length - 2].weight
  if (diff > 0.2) return 'up'
  if (diff < -0.2) return 'down'
  return 'stable'
}

export default function TrackingScreen() {
  const c = useColors()
  const onboarding = useAtomValue(onboardingAtom)
  const { data: history = [], isLoading, refetch } = useWeightHistory()
  const { refreshing, refresh } = useRefresh(() => refetch().then(() => {}))
  const { mutate: deleteWeight } = useDeleteWeight()

  const sorted = [...history]
    .filter((e) => !!e.measuredAt)
    .sort((a, b) => (b.measuredAt < a.measuredAt ? -1 : b.measuredAt > a.measuredAt ? 1 : 0))
  const latest = sorted[0]
  const trend = weightTrend(history)

  const trendIcon = { up: 'trending-up', stable: 'remove-outline', down: 'trending-down' } as const
  const trendColor = { up: c.danger, stable: c.info, down: c.primary }
  const trendLabel = { up: 'En hausse', stable: 'Stable', down: 'En baisse' }

  const kgToGoal =
    latest?.weight != null && onboarding.targetWeight
      ? Math.abs(latest.weight - onboarding.targetWeight).toFixed(1)
      : null

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
          </View>

          {isLoading ? (
            <View style={[tw`items-center`, { paddingVertical: spacing.xl }]}>
              <ActivityIndicator testID="loading-indicator" color={c.primary} />
            </View>
          ) : latest ? (
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
                    {latest.weight?.toFixed(1) ?? '—'}
                  </Text>
                  <Text variant="heading2" color="muted" style={{ marginBottom: 6, marginLeft: 6 }}>
                    kg
                  </Text>
                </View>
                <Text variant="caption" color="muted">
                  {dayjs(latest.measuredAt).format('dddd D MMMM')}
                </Text>
              </View>

              {latest.bmi || latest.bodyfat || latest.muscle ? (
                <>
                  <View style={[tw`h-px`, { backgroundColor: c.border }]} />
                  <View style={[tw`flex-row justify-between`, { marginTop: spacing.md }]}>
                    {latest.bmi ? (
                      <StatItem label="IMC" value={`${latest.bmi}`} unit="" size="sm" />
                    ) : null}
                    {latest.bodyfat ? (
                      <StatItem label="Gras" value={`${latest.bodyfat}`} unit="%" size="sm" />
                    ) : null}
                    {latest.muscle ? (
                      <StatItem label="Muscles" value={`${latest.muscle}`} unit="%" size="sm" />
                    ) : null}
                    {latest.bmr ? (
                      <StatItem label="BMR" value={`${latest.bmr}`} unit="kcal" size="sm" />
                    ) : null}
                  </View>
                </>
              ) : null}

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
                          (latest.weight ?? 0) > (onboarding.targetWeight ?? 0)
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
                Aucune pesée synchronisée.{'\n'}La balance Renpho se sync au démarrage.
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
                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row items-baseline gap-2`}>
                        <Text variant="body" style={{ fontWeight: '600' }}>
                          {entry.weight?.toFixed(1) ?? '—'} kg
                        </Text>
                        {entry.bmi ? (
                          <Text variant="caption" color="muted">
                            IMC {entry.bmi}
                          </Text>
                        ) : null}
                      </View>
                      <Text variant="caption" color="muted">
                        {dayjs(entry.measuredAt).format('dddd D MMMM')}
                      </Text>
                      {entry.bodyfat || entry.muscle ? (
                        <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
                          {[
                            entry.bodyfat ? `${entry.bodyfat}% gras` : null,
                            entry.muscle ? `${entry.muscle}% musc.` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity onPress={() => deleteWeight(entry.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={c.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
