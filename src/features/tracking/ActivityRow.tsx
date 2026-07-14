import Ionicons from '@expo/vector-icons/Ionicons'
import { View } from 'react-native'
import tw from 'twrnc'

import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import type { StravaActivity } from '@/src/models/activity/strava-activity.model'
import {
  formatActivityCalories,
  formatActivityDistance,
  formatActivityDuration,
  formatActivityElevation,
  getActivityTypeColor,
  getActivityTypeInfo,
} from '@/src/utils/activity'

interface ActivityRowProps {
  activity: StravaActivity
  showDate?: boolean
}

export function ActivityRow({ activity, showDate = true }: ActivityRowProps) {
  const c = useColors()
  const { label, icon, colorKey } = getActivityTypeInfo(activity.type)
  const color = getActivityTypeColor(colorKey, c)

  const stats = [
    { label: 'Distance', value: formatActivityDistance(activity.distance) },
    { label: 'Durée', value: formatActivityDuration(activity.movingTime) },
    { label: 'D+', value: formatActivityElevation(activity.totalElevationGain) },
    { label: 'Calories', value: formatActivityCalories(activity.calories) },
  ].filter((item): item is { label: string; value: string } => !!item.value)

  return (
    <View
      style={[
        tw`overflow-hidden rounded-2xl border`,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <View style={[tw`h-1`, { backgroundColor: color }]} />

      <View style={tw`flex-row items-center gap-3 p-3`}>
        <View
          style={[
            tw`items-center justify-center rounded-full`,
            { width: 40, height: 40, backgroundColor: `${color}1F` },
          ]}
        >
          <Ionicons name={icon} size={19} color={color} />
        </View>
        <View style={tw`flex-1 gap-1`}>
          <Text variant="heading3" numberOfLines={1}>
            {activity.name}
          </Text>
          <View style={tw`flex-row items-center gap-2`}>
            <View
              style={[tw`rounded-full px-2`, { paddingVertical: 2, backgroundColor: `${color}1F` }]}
            >
              <Text variant="label" style={{ color, fontWeight: '700' }}>
                {label}
              </Text>
            </View>
            {showDate && (
              <Text variant="caption" color="muted">
                {dayjs(activity.startedAt).format('dddd D MMMM')}
              </Text>
            )}
          </View>
        </View>
      </View>

      {stats.length > 0 && (
        <>
          <View style={[tw`h-px`, { backgroundColor: c.border }]} />
          <View style={tw`flex-row flex-wrap gap-y-3 p-3`}>
            {stats.map((stat) => (
              <StatItem
                key={stat.label}
                label={stat.label}
                value={stat.value}
                size="sm"
                style={{ width: '50%' }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  )
}
