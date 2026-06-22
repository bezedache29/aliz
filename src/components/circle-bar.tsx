import { type ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { useColors } from '@/src/hooks/use-colors'

type CircleBarProps = {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  arcAngle?: number
  children?: ReactNode
  style?: ViewStyle
}

export function CircleBar({
  value,
  max,
  size = 120,
  strokeWidth = 12,
  color,
  trackColor,
  arcAngle = 270,
  children,
  style,
}: CircleBarProps) {
  const c = useColors()
  const track = trackColor ?? c.border
  const fill = color ?? c.primary

  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const arcLength = (arcAngle / 360) * circumference
  const progressLength = Math.min(Math.max(value / max, 0), 1) * arcLength

  // Gap centered at bottom: rotate so arc starts at bottom-left going clockwise
  const rotation = 90 + (360 - arcAngle) / 2

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          rotation={rotation}
          origin={`${cx}, ${cy}`}
        />
        {progressLength > 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={fill}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progressLength} ${circumference}`}
            strokeLinecap="round"
            rotation={rotation}
            origin={`${cx}, ${cy}`}
          />
        )}
      </Svg>
      {children && <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
