import { fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import dayjs from '@/src/config/dayjs'
import { WeekStrip } from '@/src/features/planning/WeekStrip'
import { selectedDateAtom } from '@/src/store/planningAtom'

// Fixe une date de référence : lundi 23 juin 2026
const FIXED_DATE = dayjs('2026-06-23')

describe('WeekStrip', () => {
  it('affiche les 7 labels de jours', async () => {
    const store = createStore()
    store.set(selectedDateAtom, FIXED_DATE)
    const { getByText } = await render(
      <Provider store={store}>
        <WeekStrip />
      </Provider>,
    )
    expect(getByText('Lu')).toBeTruthy()
    expect(getByText('Ma')).toBeTruthy()
    expect(getByText('Me')).toBeTruthy()
    expect(getByText('Je')).toBeTruthy()
    expect(getByText('Ve')).toBeTruthy()
    expect(getByText('Sa')).toBeTruthy()
    expect(getByText('Di')).toBeTruthy()
  })

  it('affiche les numéros de la semaine courante', async () => {
    const store = createStore()
    store.set(selectedDateAtom, FIXED_DATE)
    const { getByText } = await render(
      <Provider store={store}>
        <WeekStrip />
      </Provider>,
    )
    // 23 juin 2026 est un mardi → semaine ISO : Lu 22 – Di 28 juin
    expect(getByText('22')).toBeTruthy()
    expect(getByText('28')).toBeTruthy()
  })

  it('navigue à la semaine suivante au press de next-week', async () => {
    const store = createStore()
    store.set(selectedDateAtom, FIXED_DATE)
    const { getByTestId } = await render(
      <Provider store={store}>
        <WeekStrip />
      </Provider>,
    )
    fireEvent.press(getByTestId('next-week'))
    // La date sélectionnée doit avancer d'une semaine
    const newDate = store.get(selectedDateAtom)
    expect(newDate.format('YYYY-MM-DD')).toBe('2026-06-30')
  })

  it('navigue à la semaine précédente au press de prev-week', async () => {
    const store = createStore()
    store.set(selectedDateAtom, FIXED_DATE)
    const { getByTestId } = await render(
      <Provider store={store}>
        <WeekStrip />
      </Provider>,
    )
    fireEvent.press(getByTestId('prev-week'))
    const newDate = store.get(selectedDateAtom)
    expect(newDate.format('YYYY-MM-DD')).toBe('2026-06-16')
  })

  it('met à jour la date sélectionnée au press sur un jour', async () => {
    const store = createStore()
    store.set(selectedDateAtom, FIXED_DATE)
    const { getByText } = await render(
      <Provider store={store}>
        <WeekStrip />
      </Provider>,
    )
    fireEvent.press(getByText('25'))
    const selected = store.get(selectedDateAtom)
    expect(selected.format('YYYY-MM-DD')).toBe('2026-06-25')
  })
})
