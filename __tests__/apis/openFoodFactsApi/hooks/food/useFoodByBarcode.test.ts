import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useFoodByBarcode } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodByBarcode'

import { offClient } from '@/src/apis/openFoodFactsApi/client'

// Mocking offClient pour éviter les appels réseau réels
jest.mock('@/src/apis/openFoodFactsApi/client', () => ({
  offClient: {
    get: jest.fn(),
  },
}))
const mockedGet = offClient.get as jest.Mock

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockProductDTO = {
  code: '3017620422003',
  product_name: 'Nutella',
  brands: 'Ferrero',
  nutriments: {
    'energy-kcal_100g': 539,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    fat_100g: 30.9,
  },
}

describe('useFoodByBarcode', () => {
  afterEach(() => jest.clearAllMocks())

  it('est désactivé si le barcode est null', async () => {
    const { result } = await renderHook(() => useFoodByBarcode(null), {
      wrapper: makeWrapper(),
    })
    // La query ne doit pas se déclencher
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('retourne un FoodProduct mappé en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { status: 1, product: mockProductDTO },
    })

    const { result } = await renderHook(() => useFoodByBarcode('3017620422003'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toMatchObject({
      id: '3017620422003',
      barcode: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      source: 'openfoodfacts',
      per100g: {
        kcal: 539,
        proteines: 6.3,
        glucides: 57.5,
        lipides: 30.9,
      },
    })
  })

  it('retourne null si le produit est introuvable (status !== 1)', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { status: 0, product: undefined },
    })

    const { result } = await renderHook(() => useFoodByBarcode('0000000000000'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('retourne null si product_name est absent', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { status: 1, product: { ...mockProductDTO, product_name: '' } },
    })

    const { result } = await renderHook(() => useFoodByBarcode('3017620422003'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('retourne null si les kcal sont à 0 ou négatifs', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        status: 1,
        product: {
          ...mockProductDTO,
          nutriments: { 'energy-kcal_100g': 0 },
        },
      },
    })

    const { result } = await renderHook(() => useFoodByBarcode('3017620422003'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it("passe en état error en cas d'échec réseau", async () => {
    // retry: 1 dans le hook → 2 tentatives au total avant de passer en erreur
    mockedGet.mockRejectedValueOnce(new Error('Network error'))
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = await renderHook(() => useFoodByBarcode('3017620422003'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})
