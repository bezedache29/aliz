import Ionicons from '@expo/vector-icons/Ionicons'
import { TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import type { WeightEntry } from '@/src/models/weight/weight.model'

interface WeightEntryRowProps {
  entry: WeightEntry
  previousWeight?: number | null
  onDelete: (id: string) => void
}

const TREND_ARROW = { up: 'arrow-up', stable: 'remove', down: 'arrow-down' } as const

export function WeightEntryRow({ entry, previousWeight, onDelete }: WeightEntryRowProps) {
  const c = useColors()

  const diff = entry.weight != null && previousWeight != null ? entry.weight - previousWeight : 0
  const trend = diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'stable'
  const trendColor = { up: c.danger, stable: c.info, down: c.primary }[trend]

  const stats = [
    entry.bodyfat != null ? { label: 'Gras', value: `${entry.bodyfat}%` } : null,
    entry.muscle != null ? { label: 'Muscles', value: `${entry.muscle}%` } : null,
  ].filter((item): item is { label: string; value: string } => !!item)

  return (
    <View
      style={[
        tw`overflow-hidden rounded-2xl border`,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <View style={[tw`h-1`, { backgroundColor: trendColor }]} />

      <View style={tw`flex-row items-center gap-3 p-3`}>
        <View
          style={[
            tw`items-center justify-center rounded-full`,
            { width: 40, height: 40, backgroundColor: `${trendColor}1F` },
          ]}
        >
          <Ionicons name="scale-outline" size={19} color={trendColor} />
        </View>
        <View style={tw`flex-1 gap-1`}>
          <View style={tw`flex-row items-center gap-2`}>
            <Text variant="heading3">{entry.weight?.toFixed(1) ?? '—'} kg</Text>
            <Ionicons name={TREND_ARROW[trend]} size={13} color={trendColor} />
            {entry.bmi ? (
              <View
                style={[
                  tw`rounded-full px-2`,
                  { paddingVertical: 2, backgroundColor: `${trendColor}1F` },
                ]}
              >
                <Text variant="label" style={{ color: trendColor, fontWeight: '700' }}>
                  IMC {entry.bmi}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="muted">
            {dayjs(entry.measuredAt).format('dddd D MMMM')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(entry.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={c.textMuted} />
        </TouchableOpacity>
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
