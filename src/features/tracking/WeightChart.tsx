import { View } from 'react-native'
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
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

const CHART_HEIGHT = 160
const CHART_PADDING_H = 8
const CHART_PADDING_V = 20

type Point = { x: number; y: number }

function smoothPath(points: Point[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

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
  const linePath = smoothPath(points)
  const baseline = CHART_HEIGHT - CHART_PADDING_V
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`

  const targetY = targetWeight ? yFor(targetWeight) : null
  const last = points[points.length - 1]

  const firstDate = dayjs(sorted[0].measuredAt).format('D MMM')
  const lastDate = dayjs(sorted[sorted.length - 1].measuredAt).format('D MMM')

  return (
    <View>
      <Svg width="100%" viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={c.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Line
          x1={CHART_PADDING_H}
          y1={CHART_PADDING_V}
          x2={chartWidth - CHART_PADDING_H}
          y2={CHART_PADDING_V}
          stroke={c.border}
          strokeWidth="1"
        />
        <Line
          x1={CHART_PADDING_H}
          y1={baseline}
          x2={chartWidth - CHART_PADDING_H}
          y2={baseline}
          stroke={c.border}
          strokeWidth="1"
        />

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

        <Path d={fillPath} fill="url(#weightGrad)" />

        <Path
          d={linePath}
          fill="none"
          stroke={c.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Circle
          cx={last.x}
          cy={last.y}
          r={5}
          fill={c.surface}
          stroke={c.primary}
          strokeWidth="2.5"
        />

        <SvgText
          x={CHART_PADDING_H + 2}
          y={CHART_PADDING_V - 6}
          fontSize="10"
          fill={c.textMuted}
          textAnchor="start"
        >
          {maxW.toFixed(1)}
        </SvgText>
        <SvgText
          x={CHART_PADDING_H + 2}
          y={baseline + 12}
          fontSize="10"
          fill={c.textMuted}
          textAnchor="start"
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
