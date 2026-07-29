import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import { RegeneratePromptSheet } from '@/src/features/journal/RegeneratePromptSheet'

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BottomSheetModal: (() => {
      const C = React.forwardRef(({ children }: any, _ref: any) =>
        React.createElement(View, { testID: 'bottom-sheet-modal' }, children),
      )
      C.displayName = 'BottomSheetModal'
      return C
    })(),
    BottomSheetView: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetBackdrop: () => null,
  }
})

afterEach(cleanup)

describe('RegeneratePromptSheet', () => {
  it('appelle onConfirm avec le texte saisi', async () => {
    const onConfirm = jest.fn()
    const { getByTestId } = await render(<RegeneratePromptSheet onConfirm={onConfirm} />)

    await act(async () => {
      fireEvent.changeText(getByTestId('regenerate-prompt-input'), 'sans lactose')
    })
    await act(async () => {
      fireEvent.press(getByTestId('regenerate-prompt-confirm'))
    })

    expect(onConfirm).toHaveBeenCalledWith('sans lactose')
  })

  it('appelle onConfirm avec une chaîne vide si aucune consigne saisie', async () => {
    const onConfirm = jest.fn()
    const { getByTestId } = await render(<RegeneratePromptSheet onConfirm={onConfirm} />)

    await act(async () => {
      fireEvent.press(getByTestId('regenerate-prompt-confirm'))
    })

    expect(onConfirm).toHaveBeenCalledWith('')
  })

  it('retire les espaces superflus de la consigne', async () => {
    const onConfirm = jest.fn()
    const { getByTestId } = await render(<RegeneratePromptSheet onConfirm={onConfirm} />)

    await act(async () => {
      fireEvent.changeText(getByTestId('regenerate-prompt-input'), '  plus léger  ')
    })
    await act(async () => {
      fireEvent.press(getByTestId('regenerate-prompt-confirm'))
    })

    expect(onConfirm).toHaveBeenCalledWith('plus léger')
  })
})
