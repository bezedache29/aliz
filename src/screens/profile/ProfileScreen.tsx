import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { ActivityIndicator, RefreshControl, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useProfile } from '@/src/apis/backendApi/hooks/profile/useProfile'
import { useWeightHistory } from '@/src/apis/backendApi/hooks/weight/useWeightHistory'
import { Card } from '@/src/components/card'
import { ScreenHeader } from '@/src/components/screen-header'
import { ScrollView } from '@/src/components/scroll-view'
import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import {
  ACTIVITY_LABELS,
  BMI_LABELS,
  computeBmi,
  getBmiCategory,
  type Profile,
} from '@/src/models/profile/profile.model'
import type { ColorTokens } from '@/src/styles/design-tokens'
import { getLatestWeightEntry } from '@/src/utils/weight'

const ACTIVITY_ICONS: Record<
  Profile['activityLevel'],
  React.ComponentProps<typeof Ionicons>['name']
> = {
  sedentary: 'bed-outline',
  light: 'walk-outline',
  moderate: 'bicycle-outline',
  active: 'barbell-outline',
  very_active: 'flash-outline',
}

export default function ProfileScreen() {
  const c = useColors()
  const { data: profile, isLoading, refetch } = useProfile()
  const { data: weightHistory = [] } = useWeightHistory()
  const { refreshing, refresh } = useRefresh(() => refetch().then(() => {}))

  const currentWeightKg =
    getLatestWeightEntry(weightHistory)?.weight ?? profile?.currentWeightKg ?? 0

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScreenHeader title="Profil" />

      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : !profile ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={tw`px-4 pb-10 gap-6`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
          }
        >
          <Avatar profile={profile} c={c} />
          <MesuresSection profile={profile} currentWeightKg={currentWeightKg} c={c} />
          <ObjectifSection profile={profile} currentWeightKg={currentWeightKg} c={c} />
          <ActiviteSection profile={profile} c={c} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Sections ────────────────────────────────────────────────────────────────

function Avatar({ profile, c }: { profile: Profile; c: ColorTokens }) {
  return (
    <View style={tw`items-center pt-4 pb-2 gap-3`}>
      <View
        style={[
          tw`w-24 h-24 rounded-full items-center justify-center`,
          { backgroundColor: c.primary + '18' },
        ]}
      >
        <Text style={{ fontSize: 40, fontWeight: '800', color: c.primary, lineHeight: 48 }}>
          {profile.firstName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={tw`items-center gap-1`}>
        <Text variant="heading2">{profile.firstName}</Text>
        <Text variant="body" color="secondary">
          {profile.gender === 'male' ? 'Homme' : 'Femme'} · {profile.age} ans
        </Text>
      </View>
    </View>
  )
}

function MesuresSection({
  profile,
  currentWeightKg,
  c,
}: {
  profile: Profile
  currentWeightKg: number
  c: ColorTokens
}) {
  const bmi = computeBmi(currentWeightKg, profile.heightCm)
  const cat = getBmiCategory(bmi)
  const bmiColor = {
    underweight: c.info,
    normal: c.primary,
    overweight: c.warning,
    obese: c.danger,
  }[cat]

  return (
    <View style={tw`gap-3`}>
      <SectionLabel label="Mesures" />
      <Card>
        <View style={tw`flex-row justify-between`}>
          <StatItem
            label="Taille"
            value={profile.heightCm}
            unit="cm"
            size="sm"
            align="center"
            style={tw`flex-1`}
          />
          <View style={[tw`w-px mx-2`, { backgroundColor: c.border }]} />
          <StatItem
            label="Poids"
            value={currentWeightKg}
            unit="kg"
            size="sm"
            align="center"
            style={tw`flex-1`}
          />
          <View style={[tw`w-px mx-2`, { backgroundColor: c.border }]} />
          <View style={tw`flex-1 items-center gap-1`}>
            <Text variant="caption" color="muted" uppercase style={{ fontWeight: '700' }}>
              IMC
            </Text>
            <Text variant="heading3" style={{ color: bmiColor, fontWeight: '600', lineHeight: 26 }}>
              {bmi}
            </Text>
            <Text variant="label" style={{ color: bmiColor }}>
              {BMI_LABELS[cat]}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  )
}

function ObjectifSection({
  profile,
  currentWeightKg,
  c,
}: {
  profile: Profile
  currentWeightKg: number
  c: ColorTokens
}) {
  const router = useRouter()
  const remaining = +(currentWeightKg - profile.targetWeightKg).toFixed(1)
  const isGoalReached = remaining <= 0

  return (
    <View style={tw`gap-3`}>
      <View style={tw`flex-row items-center justify-between`}>
        <SectionLabel label="Objectif poids" />
        <TouchableOpacity onPress={() => router.push('/goal-edit')} hitSlop={12}>
          <Ionicons name="create-outline" size={18} color={c.textMuted} />
        </TouchableOpacity>
      </View>
      <Card>
        <View style={tw`gap-4`}>
          <InfoRow label="Poids cible" value={`${profile.targetWeightKg} kg`} />
          <InfoRow label="Perte / semaine" value={`${profile.weightLossRateKg} kg`} />
          <View style={[tw`h-px`, { backgroundColor: c.border }]} />
          {isGoalReached ? (
            <View style={tw`flex-row items-center gap-2`}>
              <Ionicons name="checkmark-circle" size={20} color={c.primary} />
              <Text variant="body" color="accent" style={{ fontWeight: '600' }}>
                Objectif atteint !
              </Text>
            </View>
          ) : (
            <InfoRow
              label="Encore à perdre"
              value={`${remaining} kg`}
              valueStyle={{ color: c.warning, fontWeight: '600' }}
            />
          )}
        </View>
      </Card>
    </View>
  )
}

function ActiviteSection({ profile, c }: { profile: Profile; c: ColorTokens }) {
  return (
    <View style={tw`gap-3`}>
      <SectionLabel label="Activité" />
      <Card style={tw`flex-row items-center gap-4`}>
        <View
          style={[
            tw`w-12 h-12 rounded-xl items-center justify-center`,
            { backgroundColor: c.tertiary + '18' },
          ]}
        >
          <Ionicons name={ACTIVITY_ICONS[profile.activityLevel]} size={24} color={c.tertiary} />
        </View>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {ACTIVITY_LABELS[profile.activityLevel]}
        </Text>
      </Card>
    </View>
  )
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      variant="caption"
      color="muted"
      uppercase
      style={{ fontWeight: '700', letterSpacing: 0.8 }}
    >
      {label}
    </Text>
  )
}

function InfoRow({
  label,
  value,
  valueStyle,
}: {
  label: string
  value: string
  valueStyle?: object
}) {
  const c = useColors()
  return (
    <View style={tw`flex-row justify-between items-center`}>
      <Text variant="body" color="secondary">
        {label}
      </Text>
      <Text variant="body" style={[{ fontWeight: '600', color: c.textPrimary }, valueStyle]}>
        {value}
      </Text>
    </View>
  )
}

function EmptyState() {
  const c = useColors()
  return (
    <View style={tw`flex-1 items-center justify-center gap-4 px-8`}>
      <View
        style={[
          tw`w-20 h-20 rounded-full items-center justify-center`,
          { backgroundColor: c.surfaceElevated },
        ]}
      >
        <Ionicons name="person-outline" size={36} color={c.textMuted} />
      </View>
      <Text variant="heading3" color="muted" style={{ textAlign: 'center' }}>
        Aucun profil trouvé
      </Text>
    </View>
  )
}
