import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'
import { ToastAndroid } from 'react-native'

import { WeeklyPlanningCheck } from '@/src/features/planning/WeeklyPlanningCheck'
import dayjs from '@/src/config/dayjs'
import {
  AI_SUGGESTION_MEAL_TYPES,
  type MealType,
  type PlannedRecipeSlot,
} from '@/src/models/planning/planning.model'
import { openWeeklyGenerateSheetAtom } from '@/src/store/planningAtom'

let mockSlots: PlannedRecipeSlot[] = []
const mockMutateAsync = jest.fn().mockResolvedValue(undefined)

jest.mock('@/src/apis/backendApi/hooks/planning/usePlanningWeek', () => ({
  usePlanningWeek: () => ({ data: mockSlots, isLoading: false }),
}))

jest.mock('@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot', () => ({
  useRegenerateMealSlot: () => ({ mutateAsync: mockMutateAsync }),
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

// Recalcule la même plage aujourd'hui → dimanche que le composant, pour rester
// robuste quel que soit le jour d'exécution des tests.
function datesUntilSunday(): string[] {
  const sunday = dayjs().startOf('isoWeek').add(6, 'day')
  const dates: string[] = []
  let cursor = dayjs().startOf('day')
  while (!cursor.isAfter(sunday, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return dates
}

function fullSlot(date: string, meal: MealType): PlannedRecipeSlot {
  return {
    date,
    meal,
    status: 'done',
    courses: [
      {
        course: '',
        recipe: {
          id: 'r1',
          name: 'Recette',
          kcal: 1,
          proteines: 1,
          glucides: 1,
          lipides: 1,
          ingredients: [],
        },
      },
    ],
  }
}

afterEach(() => {
  cleanup()
  mockMutateAsync.mockClear()
})

describe('WeeklyPlanningCheck', () => {
  it('affiche le texte au pluriel quand plusieurs repas manquent', async () => {
    mockSlots = []
    const { getByText } = await render(<WeeklyPlanningCheck />)
    expect(getByText(/plusieurs repas/)).toBeTruthy()
  })

  it("génère chaque créneau manquant d'aujourd'hui à dimanche au clic sur Générer", async () => {
    mockSlots = []
    const dates = datesUntilSunday()
    const { getByTestId } = await render(<WeeklyPlanningCheck />)

    await act(async () => {
      fireEvent.press(getByTestId('generate-week-button'))
    })

    expect(mockMutateAsync).toHaveBeenCalledTimes(dates.length * AI_SUGGESTION_MEAL_TYPES.length)
    expect(mockMutateAsync).toHaveBeenCalledWith({
      dateKey: dates[0],
      mealType: 'Déjeuner',
    })
    expect(mockMutateAsync).toHaveBeenCalledWith({
      dateKey: dates[dates.length - 1],
      mealType: 'Dîner',
    })
  })

  it('ne génère jamais de suggestion pour le petit-déjeuner ou la collation', async () => {
    mockSlots = []
    const { getByTestId } = await render(<WeeklyPlanningCheck />)

    await act(async () => {
      fireEvent.press(getByTestId('generate-week-button'))
    })

    expect(mockMutateAsync).not.toHaveBeenCalledWith(
      expect.objectContaining({ mealType: 'Petit-déjeuner' }),
    )
    expect(mockMutateAsync).not.toHaveBeenCalledWith(
      expect.objectContaining({ mealType: 'Collation' }),
    )
  })

  it('ne génère rien si la semaine restante est déjà complète', async () => {
    const dates = datesUntilSunday()
    mockSlots = dates.flatMap((date) =>
      AI_SUGGESTION_MEAL_TYPES.map((meal) => fullSlot(date, meal)),
    )
    const { getByTestId } = await render(<WeeklyPlanningCheck />)

    await act(async () => {
      fireEvent.press(getByTestId('generate-week-button'))
    })

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('le bouton "Plus tard" ne déclenche aucune génération', async () => {
    mockSlots = []
    const { getByTestId } = await render(<WeeklyPlanningCheck />)

    fireEvent.press(getByTestId('dismiss-week-button'))

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  describe('réouverture manuelle via openWeeklyGenerateSheetAtom', () => {
    it('affiche un toast si la semaine est déjà complète', async () => {
      const showSpy = jest.spyOn(ToastAndroid, 'show')
      const dates = datesUntilSunday()
      mockSlots = dates.flatMap((date) =>
        AI_SUGGESTION_MEAL_TYPES.map((meal) => fullSlot(date, meal)),
      )
      const store = createStore()

      await act(async () => {
        await render(
          <Provider store={store}>
            <WeeklyPlanningCheck />
          </Provider>,
        )
      })
      await act(async () => {
        store.set(openWeeklyGenerateSheetAtom, (prev) => prev + 1)
      })

      expect(showSpy).toHaveBeenCalledWith(
        'Tous les repas de la semaine sont déjà générés',
        ToastAndroid.SHORT,
      )
      showSpy.mockRestore()
    })

    it("ne montre pas de toast s'il manque des créneaux", async () => {
      const showSpy = jest.spyOn(ToastAndroid, 'show')
      mockSlots = []
      const store = createStore()

      await act(async () => {
        await render(
          <Provider store={store}>
            <WeeklyPlanningCheck />
          </Provider>,
        )
      })
      await act(async () => {
        store.set(openWeeklyGenerateSheetAtom, (prev) => prev + 1)
      })

      expect(showSpy).not.toHaveBeenCalled()
      showSpy.mockRestore()
    })
  })
})
