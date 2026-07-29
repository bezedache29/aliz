import Ionicons from '@expo/vector-icons/Ionicons'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { ActivityIndicator, RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useActivities } from '@/src/apis/backendApi/hooks/activity/useActivities'
import { useActivitySync } from '@/src/apis/backendApi/hooks/activity/useActivitySync'
import { useStravaStatus } from '@/src/apis/backendApi/hooks/strava/useStravaStatus'
import { useDeleteWeight } from '@/src/apis/backendApi/hooks/weight/useDeleteWeight'
import { useWeightHistory } from '@/src/apis/backendApi/hooks/weight/useWeightHistory'
import { AvatarButton } from '@/src/components/avatar-button'
import { ScrollView } from '@/src/components/scroll-view'
import { Card } from '@/src/components/card'
import { ShowMoreControls } from '@/src/components/show-more-button'
import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { ActivityRow } from '@/src/features/tracking/ActivityRow'
import { StravaConnectButton } from '@/src/features/tracking/StravaConnectButton'
import { WeightChart } from '@/src/features/tracking/WeightChart'
import { WeightEntryRow } from '@/src/features/tracking/WeightEntryRow'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import { type WeightEntry } from '@/src/models/weight/weight.model'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { spacing } from '@/src/styles/design-tokens'

const PREVIEW_COUNT = 3
const LOAD_MORE_COUNT = 5

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
  const { mutate: deleteWeight } = useDeleteWeight()
  const {
    data: stravaStatus,
    isLoading: isStravaStatusLoading,
    refetch: refetchStravaStatus,
  } = useStravaStatus()
  const {
    data: activities = [],
    isLoading: isActivitiesLoading,
    refetch: refetchActivities,
  } = useActivities()
  const { mutateAsync: syncActivities } = useActivitySync()
  const { refreshing, refresh } = useRefresh(() =>
    Promise.all([
      refetch(),
      refetchStravaStatus(),
      stravaStatus?.connected ? syncActivities() : refetchActivities(),
    ]).then(() => {}),
  )
  const [historyVisibleCount, setHistoryVisibleCount] = useState(PREVIEW_COUNT)
  const [activitiesVisibleCount, setActivitiesVisibleCount] = useState(PREVIEW_COUNT)

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
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <View style={tw`flex-row items-center justify-between px-4 pt-4 pb-4`}>
        <Text variant="heading1" style={{ fontWeight: '700' }}>
          Suivi
        </Text>
        <AvatarButton />
      </View>

      <ScrollView
        contentContainerStyle={tw`p-4 gap-8`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
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
          <View style={tw`gap-3`}>
            <View style={tw`flex-row items-center gap-2.5`}>
              <View
                style={[
                  tw`items-center justify-center rounded-full`,
                  { width: 34, height: 34, backgroundColor: `${c.info}1F` },
                ]}
              >
                <Ionicons name="scale-outline" size={18} color={c.info} />
              </View>
              <Text variant="heading2">Historique du poids</Text>
            </View>
            <View style={[tw`h-px`, { backgroundColor: c.border }]} />
            <View style={tw`gap-2`}>
              {sorted.slice(0, historyVisibleCount).map((entry, index) => (
                <WeightEntryRow
                  key={entry.id}
                  entry={entry}
                  previousWeight={sorted[index + 1]?.weight ?? null}
                  onDelete={deleteWeight}
                />
              ))}
            </View>
            <ShowMoreControls
              visibleCount={historyVisibleCount}
              total={sorted.length}
              previewCount={PREVIEW_COUNT}
              step={LOAD_MORE_COUNT}
              onChange={setHistoryVisibleCount}
            />
          </View>
        )}

        <View style={tw`gap-3`}>
          <View style={tw`flex-row items-center gap-2.5`}>
            <View
              style={[
                tw`items-center justify-center rounded-full`,
                { width: 34, height: 34, backgroundColor: `${c.tertiary}1F` },
              ]}
            >
              <Ionicons name="bicycle-outline" size={18} color={c.tertiary} />
            </View>
            <Text variant="heading2">Activités sportives</Text>
          </View>
          <View style={[tw`h-px`, { backgroundColor: c.border }]} />
          {isStravaStatusLoading || isActivitiesLoading ? (
            <Card>
              <View style={[tw`items-center`, { paddingVertical: spacing.xl }]}>
                <ActivityIndicator color={c.primary} />
              </View>
            </Card>
          ) : !stravaStatus?.connected ? (
            <Card>
              <View style={[tw`items-center gap-3`, { paddingVertical: spacing.md }]}>
                <Ionicons name="bicycle-outline" size={40} color={c.textMuted} />
                <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
                  Connecte ton compte Strava pour récupérer tes activités.
                </Text>
                <StravaConnectButton />
              </View>
            </Card>
          ) : activities.length === 0 ? (
            <Card>
              <View style={[tw`items-center`, { paddingVertical: spacing.xl }]}>
                <Ionicons name="bicycle-outline" size={40} color={c.textMuted} />
                <Text
                  variant="body"
                  color="muted"
                  style={{ marginTop: spacing.sm, textAlign: 'center' }}
                >
                  Aucune activité synchronisée pour l&apos;instant.
                </Text>
              </View>
            </Card>
          ) : (
            <>
              <View style={tw`gap-2`}>
                {activities.slice(0, activitiesVisibleCount).map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </View>
              <ShowMoreControls
                visibleCount={activitiesVisibleCount}
                total={activities.length}
                previewCount={PREVIEW_COUNT}
                step={LOAD_MORE_COUNT}
                onChange={setActivitiesVisibleCount}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
