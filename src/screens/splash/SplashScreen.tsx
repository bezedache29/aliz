import { useEffect, useRef } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { useColorScheme } from '@/src/hooks/use-color-scheme'

const { height: SCREEN_H } = Dimensions.get('window')
const LOGO_H = SCREEN_H * 0.6
const LOGO_W = LOGO_H * (677 / 369)
const LOGO_SHIFT_UP = 0

interface Props {
  onReady: () => void
  onFinish: () => void
}

export default function SplashScreen({ onReady, onFinish }: Props) {
  const colorScheme = useColorScheme()
  const onFinishRef = useRef(onFinish)
  const logoOpacity = useSharedValue(0)
  const logoScale = useSharedValue(0.88)
  const containerOpacity = useSharedValue(1)

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700 })
    logoScale.value = withTiming(1, { duration: 700 })
    containerOpacity.value = withDelay(
      2000,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onFinishRef.current)()
      }),
    )
  }, [containerOpacity, logoOpacity, logoScale])

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: -LOGO_SHIFT_UP }],
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    backgroundColor: colorScheme === 'dark' ? '#0C1E30' : '#EEF6FD',
  }))

  return (
    // onLayout garantit que hideAsync() n'est appelé qu'une fois la vue réellement peinte
    <Animated.View
      onLayout={onReady}
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
    >
      <Animated.Image
        source={require('@/assets/logo.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="stretch"
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 999,
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },
})
