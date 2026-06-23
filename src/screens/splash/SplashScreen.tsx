import { useEffect, useRef } from 'react'
import { Dimensions } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import tw from 'twrnc'

import { useColorScheme } from '@/src/hooks/use-color-scheme'

const { width: SCREEN_W } = Dimensions.get('window')
const LOGO_W = SCREEN_W * 1.5
const LOGO_H = LOGO_W * (752 / 1380)
const LOGO_SHIFT_UP = 40
const LOGO_OFFSET_X = -8

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
    transform: [
      { scale: logoScale.value },
      { translateY: -LOGO_SHIFT_UP },
      { translateX: LOGO_OFFSET_X },
    ],
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    backgroundColor: colorScheme === 'dark' ? '#0C1E30' : '#EEF6FD',
  }))

  return (
    // onLayout garantit que hideAsync() n'est appelé qu'une fois la vue réellement peinte
    <Animated.View
      onLayout={onReady}
      style={[
        tw`absolute inset-0 items-center justify-center overflow-hidden`,
        { zIndex: 999 },
        containerStyle,
      ]}
    >
      <Animated.Image
        source={require('@/assets/splash.png')}
        style={[{ width: LOGO_W, height: LOGO_H, alignSelf: 'center' }, logoStyle]}
        resizeMode="stretch"
      />
    </Animated.View>
  )
}
