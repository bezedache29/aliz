import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import JournalScreen from '@/src/screens/journal/JournalScreen'
import dayjs from '@/src/config/dayjs'
import { type StravaActivity } from '@/src/models/activity/strava-activity.model'
import type { PlannedMeal, PlannedRecipeSlot } from '@/src/models/planning/planning.model'
import { rejectedSuggestionsAtom } from '@/src/store/planningAtom'

let mockActivities: StravaActivity[] = []
let mockJournalMeals: PlannedMeal[] = []
let mockAiSlots: PlannedRecipeSlot[] = []
const mockCreateJournalEntry = jest.fn()
const mockRegenerateMutate = jest.fn()
const mockRouterPush = jest.fn()

jest.mock('@/src/apis/backendApi/hooks/activity/useActivities', () => ({
  useActivities: () => ({ data: mockActivities, isLoading: false, refetch: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/activity/useActivitySync', () => ({
  useActivitySync: () => ({ mutateAsync: jest.fn().mockResolvedValue(undefined) }),
}))

jest.mock('@/src/apis/backendApi/hooks/strava/useStravaStatus', () => ({
  useStravaStatus: () => ({
    data: { connected: false, athleteName: null, lastSyncedAt: null },
    isLoading: false,
  }),
}))

jest.mock('@/src/apis/backendApi/hooks/weight/useWeightHistory', () => ({
  useWeightHistory: () => ({ data: [], isLoading: false, refetch: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/stock/useStock', () => ({
  useStock: () => ({ data: [], isLoading: false }),
}))

jest.mock('@/src/apis/backendApi/hooks/stock/useUpdateStock', () => ({
  useUpdateStock: () => ({ mutate: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/stock/useCreateStock', () => ({
  useCreateStock: () => ({ mutate: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/stock/useDeleteStock', () => ({
  useDeleteStock: () => ({ mutate: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/journal/useJournalEntries', () => ({
  useJournalEntries: () => ({ data: mockJournalMeals, isLoading: false, refetch: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/journal/useCreateJournalEntry', () => ({
  useCreateJournalEntry: () => ({ mutate: mockCreateJournalEntry }),
}))

jest.mock('@/src/apis/backendApi/hooks/journal/useUpdateJournalEntry', () => ({
  useUpdateJournalEntry: () => ({ mutate: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/journal/useDeleteJournalEntry', () => ({
  useDeleteJournalEntry: () => ({ mutate: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/planning/usePlanningWeek', () => ({
  usePlanningWeek: () => ({ data: mockAiSlots, isLoading: false }),
}))

jest.mock('@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot', () => ({
  useRegenerateMealSlot: () => ({ mutate: mockRegenerateMutate }),
}))

jest.mock('@/src/features/journal/IngredientEditSheet', () => ({
  IngredientEditSheet: () => null,
}))

jest.mock('@/src/features/journal/RegeneratePromptSheet', () => ({
  RegeneratePromptSheet: () => null,
}))

jest.mock('@/src/features/journal/RecipeDetailSheet', () => ({
  RecipeDetailSheet: () => null,
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
}))

// AvatarButton dépend de useNavigation (contexte expo-router absent en test unitaire)
jest.mock('@/src/components/avatar-button', () => ({
  AvatarButton: () => null,
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const ForwardedBottomSheetModal = React.forwardRef((_props: any, _ref: any) => null)
  ForwardedBottomSheetModal.displayName = 'BottomSheetModal'
  return {
    BottomSheetModal: ForwardedBottomSheetModal,
    BottomSheetView: ({ children }: any) => children,
    BottomSheetBackdrop: () => null,
  }
})

jest.mock('@/src/features/planning/MealAddPickerSheet', () => ({
  MealAddPickerSheet: () => null,
}))

jest.mock('@/src/features/planning/MealItemEditSheet', () => ({
  MealItemEditSheet: () => null,
}))

const makeActivity = (overrides: Partial<StravaActivity> = {}): StravaActivity => ({
  id: 'act-1',
  name: 'Sortie VTT',
  type: 'MountainBikeRide',
  startedAt: new Date().toISOString(),
  distance: 15000.5,
  movingTime: 3600,
  elapsedTime: 3700,
  totalElevationGain: 420,
  calories: 870.2,
  ...overrides,
})

function renderWithStore(ui: React.ReactElement, store = createStore()) {
  return render(<Provider store={store}>{ui}</Provider>)
}

beforeEach(() => {
  mockActivities = []
  mockJournalMeals = []
  mockAiSlots = []
  mockCreateJournalEntry.mockClear()
  mockRegenerateMutate.mockClear()
  mockRouterPush.mockClear()
  // rejectedSuggestionsAtom est persisté en MMKV (mock partagé entre tests du fichier) :
  // on le vide explicitement pour éviter qu'un rejet d'un test précédent fuite sur les suivants.
  createStore().set(rejectedSuggestionsAtom, [])
})

afterEach(cleanup)

const aiSlot = (
  mealType: PlannedRecipeSlot['meal'],
  course: string,
  recipeName: string,
  date: string = dayjs().format('YYYY-MM-DD'),
): PlannedRecipeSlot => ({
  date,
  meal: mealType,
  status: 'done',
  courses: [
    {
      course: course as PlannedRecipeSlot['courses'][number]['course'],
      recipe: {
        id: 'r1',
        name: recipeName,
        kcal: 450,
        proteines: 40,
        glucides: 15,
        lipides: 20,
        ingredients: [],
      },
    },
  ],
})

describe('JournalScreen — carte Activités du jour', () => {
  it("affiche l'état vide quand il n'y a aucune activité", async () => {
    const { getByText } = await renderWithStore(<JournalScreen />)
    expect(getByText('Activités du jour')).toBeTruthy()
    expect(getByText("Aucune activité aujourd'hui.")).toBeTruthy()
  })

  it("affiche l'état vide pour une activité d'un autre jour", async () => {
    mockActivities = [makeActivity({ startedAt: '2020-01-01T08:00:00.000Z' })]
    const { getByText } = await renderWithStore(<JournalScreen />)
    expect(getByText("Aucune activité aujourd'hui.")).toBeTruthy()
  })

  it("affiche la carte et l'activité du jour", async () => {
    mockActivities = [makeActivity({ name: 'Sortie VTT' })]
    const { getByText } = await renderWithStore(<JournalScreen />)
    expect(getByText('Activités du jour')).toBeTruthy()
    expect(getByText('Sortie VTT')).toBeTruthy()
    expect(getByText('15.0 km')).toBeTruthy()
    expect(getByText('1h00')).toBeTruthy()
    expect(getByText('420 m D+')).toBeTruthy()
    expect(getByText('870 kcal')).toBeTruthy()
  })

  it('affiche uniquement les activités du jour parmi plusieurs', async () => {
    mockActivities = [
      makeActivity({ id: 'today', name: 'Sortie du jour' }),
      makeActivity({ id: 'yesterday', name: 'Sortie hier', startedAt: '2020-01-01T08:00:00.000Z' }),
    ]
    const { getByText, queryByText } = await renderWithStore(<JournalScreen />)
    expect(getByText('Sortie du jour')).toBeTruthy()
    expect(queryByText('Sortie hier')).toBeNull()
  })
})

describe('JournalScreen — suggestions IA', () => {
  const todayKey = dayjs().format('YYYY-MM-DD')

  it('affiche une suggestion IA en attente pour un repas sans entrée journal', async () => {
    mockAiSlots = [aiSlot('Déjeuner', 'Plat', 'Poulet rôti')]
    const { getByText, getByTestId } = await renderWithStore(<JournalScreen />)
    expect(getByText('Poulet rôti')).toBeTruthy()
    expect(getByTestId('suggestion-accept')).toBeTruthy()
  })

  it('masque la suggestion une fois acceptée dans le journal', async () => {
    mockAiSlots = [aiSlot('Déjeuner', 'Plat', 'Poulet rôti')]
    mockJournalMeals = [
      {
        id: 'j-1',
        name: 'Poulet rôti',
        meal: 'Déjeuner',
        course: 'Plat',
        source: 'ai_suggestion',
        kcal: 450,
        proteines: 40,
        glucides: 15,
        lipides: 20,
      },
    ]
    const { queryByTestId } = await renderWithStore(<JournalScreen />)
    expect(queryByTestId('suggestion-accept')).toBeNull()
  })

  it('accepter une suggestion crée une entrée journal source ai_suggestion', async () => {
    mockAiSlots = [aiSlot('Déjeuner', 'Plat', 'Poulet rôti')]
    const { getByTestId } = await renderWithStore(<JournalScreen />)
    fireEvent.press(getByTestId('suggestion-accept'))

    expect(mockCreateJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        dateKey: todayKey,
        meal: expect.objectContaining({
          name: 'Poulet rôti',
          meal: 'Déjeuner',
          course: 'Plat',
          source: 'ai_suggestion',
          suggestionStatus: 'accepted',
        }),
      }),
    )
  })

  it('régénérer une suggestion appelle useRegenerateMealSlot sans consigne', async () => {
    mockAiSlots = [aiSlot('Déjeuner', 'Plat', 'Poulet rôti')]
    const { getByTestId } = await renderWithStore(<JournalScreen />)
    await act(async () => {
      fireEvent.press(getByTestId('suggestion-regenerate'))
    })
    expect(mockRegenerateMutate).toHaveBeenCalledWith(
      { dateKey: todayKey, mealType: 'Déjeuner', prompt: undefined },
      expect.anything(),
    )
  })

  it('ne montre plus de suggestion pour un jour hors semaine courante', async () => {
    mockAiSlots = [aiSlot('Déjeuner', 'Plat', 'Poulet rôti', '2020-01-01')]
    const { queryByTestId } = await renderWithStore(<JournalScreen />)
    expect(queryByTestId('suggestion-accept')).toBeNull()
  })

  it('ne montre aucune suggestion pour le petit-déjeuner ou la collation', async () => {
    mockAiSlots = [aiSlot('Petit-déjeuner', '', 'Porridge'), aiSlot('Collation', '', 'Yaourt')]
    const { queryByText } = await renderWithStore(<JournalScreen />)
    expect(queryByText('Porridge')).toBeNull()
    expect(queryByText('Yaourt')).toBeNull()
  })

  it('rejeter une suggestion la fait disparaître', async () => {
    mockAiSlots = [aiSlot('Déjeuner', 'Plat', 'Poulet rôti')]
    const { getByTestId, queryByTestId } = await renderWithStore(<JournalScreen />)
    await act(async () => {
      fireEvent.press(getByTestId('suggestion-reject'))
    })
    expect(queryByTestId('suggestion-accept')).toBeNull()
  })

  it('permet de tapoter la carte de suggestion pour ouvrir le détail sans erreur', async () => {
    mockAiSlots = [aiSlot('Déjeuner', 'Plat', 'Poulet rôti')]
    const { getByTestId, getByText } = await renderWithStore(<JournalScreen />)
    fireEvent.press(getByTestId('suggestion-view-details'))
    expect(getByText('Poulet rôti')).toBeTruthy()
  })
})
