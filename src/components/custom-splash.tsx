import * as ExpoSplash from 'expo-splash-screen'
import { Image, StyleSheet } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import { useColors } from '@/src/hooks/use-colors'

interface Props {
  onFinished: () => void
}

export function CustomSplash({ onFinished }: Props) {
  const c = useColors()

  const logoScale = useSharedValue(0.85)
  const logoOpacity = useSharedValue(0)
  const containerOpacity = useSharedValue(1)

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }))

  function startAnimation() {
    ExpoSplash.hideAsync()

    const easeOut = Easing.out(Easing.cubic)
    logoScale.value = withTiming(1, { duration: 500, easing: easeOut })
    logoOpacity.value = withTiming(1, { duration: 400, easing: easeOut }, (finished) => {
      if (!finished) return
      containerOpacity.value = withDelay(
        800,
        withTiming(0, { duration: 350 }, (done) => {
          if (done) runOnJS(onFinished)()
        }),
      )
    })
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: c.background }, containerStyle]}>
      <Animated.View style={logoStyle}>
        <Image
          source={require('@/assets/images/splash.png')}
          style={styles.logo}
          onLoad={startAnimation}
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
  },
})
