import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import { AiRecipeGenerator } from '@/src/features/recipes/AiRecipeGenerator'
import { useCreateRecipe } from '@/src/apis/backendApi/hooks/recipes/useCreateRecipe'
import { useGenerateRecipe } from '@/src/apis/backendApi/hooks/recipes/useGenerateRecipe'

jest.mock('@/src/apis/backendApi/hooks/recipes/useGenerateRecipe', () => ({
  useGenerateRecipe: jest.fn(),
}))
jest.mock('@/src/apis/backendApi/hooks/recipes/useCreateRecipe', () => ({
  useCreateRecipe: jest.fn(),
}))

const mockedUseGenerateRecipe = useGenerateRecipe as jest.Mock
const mockedUseCreateRecipe = useCreateRecipe as jest.Mock

const generatedRecipe = {
  name: 'Curry de légumes',
  category: 'Plat principal' as const,
  ingredients: [
    {
      food: {
        id: 'ai-1',
        name: 'Lait de coco',
        source: 'manual' as const,
        per100g: { kcal: 230, proteines: 2.3, glucides: 6, lipides: 24 },
      },
      quantityG: 200,
    },
  ],
  steps: ['Faire revenir les légumes', 'Ajouter le lait de coco'],
  isFavorite: false,
}

function mockGenerate(mutate: jest.Mock, isPending = false) {
  mockedUseGenerateRecipe.mockReturnValue({ mutate, isPending })
}

function mockCreate(mutate: jest.Mock, isPending = false) {
  mockedUseCreateRecipe.mockReturnValue({ mutate, isPending })
}

// Chaque interaction déclenche un setState — on l'enveloppe dans act() pour que
// React flush avant l'interaction suivante (RNTL v14 / React 19)
async function changeText(getByTestId: (id: string) => any, testId: string, text: string) {
  await act(async () => {
    fireEvent.changeText(getByTestId(testId), text)
  })
}

async function press(getByTestId: (id: string) => any, testId: string) {
  await act(async () => {
    fireEvent.press(getByTestId(testId))
  })
}

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})

describe('AiRecipeGenerator', () => {
  it('le bouton Générer est actif même sans prompt saisi', async () => {
    mockGenerate(jest.fn())
    mockCreate(jest.fn())
    const { getByTestId } = await render(<AiRecipeGenerator />)
    expect(getByTestId('generate-button').props.accessibilityState?.disabled).toBeFalsy()
  })

  it('appelle generateRecipe avec un prompt vide quand aucun prompt n’est saisi', async () => {
    const generate = jest.fn()
    mockGenerate(generate)
    mockCreate(jest.fn())
    const { getByTestId } = await render(<AiRecipeGenerator />)

    await press(getByTestId, 'generate-button')

    expect(generate).toHaveBeenCalledWith(
      { prompt: '', useStock: false },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('appelle generateRecipe avec le prompt et useStock au press de Générer', async () => {
    const generate = jest.fn()
    mockGenerate(generate)
    mockCreate(jest.fn())
    const { getByTestId } = await render(<AiRecipeGenerator />)

    await changeText(getByTestId, 'ai-prompt-input', 'Un curry sans viande')
    await press(getByTestId, 'use-stock-toggle')
    await press(getByTestId, 'generate-button')

    expect(generate).toHaveBeenCalledWith(
      { prompt: 'Un curry sans viande', useStock: true },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('affiche un aperçu de la recette générée après succès', async () => {
    mockGenerate(jest.fn((_params, { onSuccess }) => onSuccess(generatedRecipe)))
    mockCreate(jest.fn())
    const { getByTestId, getByText } = await render(<AiRecipeGenerator />)

    await changeText(getByTestId, 'ai-prompt-input', 'Un curry sans viande')
    await press(getByTestId, 'generate-button')

    expect(getByText('Curry de légumes')).toBeTruthy()
    expect(getByTestId('regenerate-button')).toBeTruthy()
    expect(getByTestId('save-recipe-button')).toBeTruthy()
  })

  it("affiche une bannière d'erreur quand la génération échoue", async () => {
    mockGenerate(jest.fn((_params, { onError }) => onError({ isAxiosError: false })))
    mockCreate(jest.fn())
    const { getByTestId, getByText } = await render(<AiRecipeGenerator />)

    await changeText(getByTestId, 'ai-prompt-input', 'Un curry sans viande')
    await press(getByTestId, 'generate-button')

    expect(getByTestId('ai-error-banner')).toBeTruthy()
    expect(getByText('Impossible de générer une recette. Réessaie.')).toBeTruthy()
  })

  it("affiche le message de validation renvoyé par l'API quand l'enregistrement échoue", async () => {
    mockGenerate(jest.fn((_params, { onSuccess }) => onSuccess(generatedRecipe)))
    const create = jest.fn((_recipe, { onError }) =>
      onError({
        isAxiosError: true,
        response: {
          data: {
            message: 'The given data was invalid.',
            errors: { seasons: ['The seasons field is required.'] },
          },
        },
      }),
    )
    mockCreate(create)

    const { getByTestId, getByText } = await render(<AiRecipeGenerator />)

    await changeText(getByTestId, 'ai-prompt-input', 'Un curry sans viande')
    await press(getByTestId, 'generate-button')
    await press(getByTestId, 'save-recipe-button')

    expect(getByTestId('ai-error-banner')).toBeTruthy()
    expect(getByText('The given data was invalid. (The seasons field is required.)')).toBeTruthy()
  })

  it('enregistre la recette prévisualisée au press de Enregistrer et transmet la recette créée', async () => {
    const createdRecipe = { ...generatedRecipe, id: 'r-99' }
    mockGenerate(jest.fn((_params, { onSuccess }) => onSuccess(generatedRecipe)))
    const create = jest.fn((_recipe, { onSuccess }) => onSuccess(createdRecipe))
    mockCreate(create)
    const onSaved = jest.fn()

    const { getByTestId } = await render(<AiRecipeGenerator onSaved={onSaved} />)

    await changeText(getByTestId, 'ai-prompt-input', 'Un curry sans viande')
    await press(getByTestId, 'generate-button')
    await press(getByTestId, 'save-recipe-button')

    expect(create).toHaveBeenCalledWith(
      generatedRecipe,
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
    expect(onSaved).toHaveBeenCalledWith(createdRecipe)
  })

  it('affiche un libellé de sauvegarde personnalisé', async () => {
    mockGenerate(jest.fn((_params, { onSuccess }) => onSuccess(generatedRecipe)))
    mockCreate(jest.fn())
    const { getByTestId, getByText } = await render(
      <AiRecipeGenerator saveLabel="Ajouter au repas" />,
    )

    await changeText(getByTestId, 'ai-prompt-input', 'Un curry sans viande')
    await press(getByTestId, 'generate-button')

    expect(getByText('Ajouter au repas')).toBeTruthy()
  })
})
