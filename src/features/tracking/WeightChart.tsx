import { View } from 'react-native'
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import { type WeightEntry } from '@/src/models/weight/weight.model'

type Props = {
  entries: WeightEntry[]
  targetWeight?: number | null
}

const CHART_HEIGHT = 140
const CHART_PADDING_H = 40
const CHART_PADDING_V = 16

export function WeightChart({ entries, targetWeight }: Props) {
  const c = useColors()

  const withWeight = entries.filter((e): e is typeof e & { weight: number } => e.weight !== null)
  if (withWeight.length < 2) {
    return (
      <View style={[tw`items-center justify-center`, { height: CHART_HEIGHT }]}>
        <Text variant="caption" color="muted">
          Ajoute au moins 2 pesées pour voir la courbe
        </Text>
      </View>
    )
  }
  const sorted = [...withWeight]
    .sort((a, b) => (a.measuredAt < b.measuredAt ? -1 : a.measuredAt > b.measuredAt ? 1 : 0))
    .slice(-30)
  const weights = sorted.map((e) => e.weight)
  const minW = Math.min(...weights, targetWeight ?? Infinity) - 1
  const maxW = Math.max(...weights) + 1

  const chartWidth = 320
  const innerW = chartWidth - CHART_PADDING_H * 2
  const innerH = CHART_HEIGHT - CHART_PADDING_V * 2

  function xFor(i: number) {
    return CHART_PADDING_H + (i / (sorted.length - 1)) * innerW
  }

  function yFor(w: number) {
    return CHART_PADDING_V + (1 - (w - minW) / (maxW - minW)) * innerH
  }

  const points = sorted.map((e, i) => ({ x: xFor(i), y: yFor(e.weight), entry: e }))
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')
  const fillPolygon = [
    `${points[0].x},${CHART_HEIGHT - CHART_PADDING_V}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${CHART_HEIGHT - CHART_PADDING_V}`,
  ].join(' ')

  const targetY = targetWeight ? yFor(targetWeight) : null

  const firstDate = dayjs(sorted[0].measuredAt).format('D MMM')
  const lastDate = dayjs(sorted[sorted.length - 1].measuredAt).format('D MMM')

  return (
    <View>
      <Svg width="100%" viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.primary} stopOpacity="0.25" />
            <Stop offset="1" stopColor={c.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {targetY !== null && (
          <Line
            x1={CHART_PADDING_H}
            y1={targetY}
            x2={chartWidth - CHART_PADDING_H}
            y2={targetY}
            stroke={c.info}
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        <Polygon points={fillPolygon} fill="url(#weightGrad)" />

        <Path
          d={`M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
          fill="none"
          stroke={c.primary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={c.primary} />
        ))}

        <SvgText
          x={CHART_PADDING_H}
          y={CHART_PADDING_V - 4}
          fontSize="10"
          fill={c.textMuted}
          textAnchor="middle"
        >
          {maxW.toFixed(1)}
        </SvgText>
        <SvgText
          x={CHART_PADDING_H}
          y={CHART_HEIGHT - CHART_PADDING_V + 12}
          fontSize="10"
          fill={c.textMuted}
          textAnchor="middle"
        >
          {minW.toFixed(1)}
        </SvgText>
      </Svg>

      <View style={tw`flex-row justify-between px-1 -mt-1`}>
        <Text variant="caption" color="muted">
          {firstDate}
        </Text>
        <Text variant="caption" color="muted">
          {lastDate}
        </Text>
      </View>
    </View>
  )
}
