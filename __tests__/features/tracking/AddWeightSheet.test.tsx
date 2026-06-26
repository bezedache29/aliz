import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Keyboard } from 'react-native'

import { AddWeightSheet } from '@/src/features/tracking/AddWeightSheet'

jest.mock('@/src/hooks/use-colors', () => ({
  useColors: () => ({
    background: '#fff',
    surface: '#fff',
    surfaceElevated: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#020617',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    primary: '#16a34a',
    primaryLight: '#22c55e',
    danger: '#dc2626',
    warning: '#d97706',
    info: '#3b82f6',
    tertiary: '#8b5cf6',
  }),
}))

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

// autoFocus déclenche des side-effects async — on le neutralise
jest.mock('@/src/components/input', () => {
  const React = require('react')
  const { View, TextInput, Text } = require('react-native')
  const { forwardRef } = React
  const Input = forwardRef(({ label, error, unit, ...props }: any, ref: any) =>
    React.createElement(
      View,
      null,
      label && React.createElement(Text, null, label),
      React.createElement(
        View,
        null,
        React.createElement(TextInput, { ref, ...props, autoFocus: false }),
        unit && React.createElement(Text, null, unit),
      ),
      error && React.createElement(Text, null, error),
    ),
  )
  Input.displayName = 'Input'
  return { Input }
})

beforeEach(() => {
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
  cleanup()
})

describe('AddWeightSheet', () => {
  it('affiche le champ de saisie et les boutons', async () => {
    const { getByPlaceholderText, getByText } = await render(<AddWeightSheet onSave={jest.fn()} />)
    expect(getByPlaceholderText('75.5')).toBeTruthy()
    expect(getByText('Enregistrer')).toBeTruthy()
    expect(getByText('Annuler')).toBeTruthy()
  })

  it('appelle onSave avec la valeur parsée quand le poids est valide', async () => {
    const onSave = jest.fn()
    const { getByPlaceholderText, getByText } = await render(<AddWeightSheet onSave={onSave} />)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('75.5'), '74.8')
    })
    await act(async () => {
      fireEvent.press(getByText('Enregistrer'))
    })
    expect(onSave).toHaveBeenCalledWith(74.8)
  })

  it('accepte une virgule comme séparateur décimal', async () => {
    const onSave = jest.fn()
    const { getByPlaceholderText, getByText } = await render(<AddWeightSheet onSave={onSave} />)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('75.5'), '74,8')
    })
    await act(async () => {
      fireEvent.press(getByText('Enregistrer'))
    })
    expect(onSave).toHaveBeenCalledWith(74.8)
  })

  it('affiche une erreur si le champ est vide', async () => {
    const onSave = jest.fn()
    const { getByText } = await render(<AddWeightSheet onSave={onSave} />)
    await act(async () => {
      fireEvent.press(getByText('Enregistrer'))
    })
    expect(getByText('Poids invalide')).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('affiche une erreur si le poids est négatif', async () => {
    const onSave = jest.fn()
    const { getByPlaceholderText, getByText } = await render(<AddWeightSheet onSave={onSave} />)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('75.5'), '-5')
      fireEvent.press(getByText('Enregistrer'))
    })
    expect(getByText('Poids invalide')).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('affiche une erreur si le poids dépasse 500', async () => {
    const onSave = jest.fn()
    const { getByPlaceholderText, getByText } = await render(<AddWeightSheet onSave={onSave} />)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('75.5'), '501')
      fireEvent.press(getByText('Enregistrer'))
    })
    expect(getByText('Poids invalide')).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("efface l'erreur quand l'utilisateur modifie la valeur", async () => {
    const onSave = jest.fn()
    const { getByPlaceholderText, getByText, queryByText } = await render(
      <AddWeightSheet onSave={onSave} />,
    )
    await act(async () => {
      fireEvent.press(getByText('Enregistrer'))
    })
    expect(getByText('Poids invalide')).toBeTruthy()
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('75.5'), '7')
    })
    expect(queryByText('Poids invalide')).toBeNull()
  })
})
