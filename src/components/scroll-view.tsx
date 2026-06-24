import { forwardRef } from 'react'
import { ScrollView as RNScrollView, type ScrollViewProps } from 'react-native'

export const ScrollView = forwardRef<RNScrollView, ScrollViewProps>(
  (
    { showsVerticalScrollIndicator = false, showsHorizontalScrollIndicator = false, ...props },
    ref,
  ) => (
    <RNScrollView
      ref={ref}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      {...props}
    />
  ),
)

ScrollView.displayName = 'ScrollView'
