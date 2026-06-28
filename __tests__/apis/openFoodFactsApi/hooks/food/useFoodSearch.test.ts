import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useFoodSearch } from '@/src/apis/openFoodFactsApi/hooks/food/useFoodSearch'
import { offClient } from '@/src/apis/openFoodFactsApi/client'

jest.mock('@/src/apis/openFoodFactsApi/client', () => ({
  offClient: { get: jest.fn() },
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

describe('useFoodSearch', () => {
  afterEach(() => jest.clearAllMocks())

  it('est désactivé si la query fait moins de 2 caractères', async () => {
    const { result } = await renderHook(() => useFoodSearch('a'), {
      wrapper: makeWrapper(),
    })
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('est désactivé si enabled est false', async () => {
    const { result } = await renderHook(() => useFoodSearch('nutella', false), {
      wrapper: makeWrapper(),
    })
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('retourne une liste de FoodProduct mappés en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { products: [mockProductDTO] },
    })

    const { result } = await renderHook(() => useFoodSearch('nutella'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0]).toMatchObject({
      id: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      source: 'openfoodfacts',
      per100g: { kcal: 539, proteines: 6.3, glucides: 57.5, lipides: 30.9 },
    })
  })

  it('filtre les produits sans nom', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        products: [mockProductDTO, { ...mockProductDTO, code: 'xxx', product_name: '' }],
      },
    })

    const { result } = await renderHook(() => useFoodSearch('nutella'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it('filtre les produits avec kcal à 0', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        products: [
          mockProductDTO,
          {
            ...mockProductDTO,
            code: 'yyy',
            product_name: 'Eau plate',
            nutriments: { 'energy-kcal_100g': 0 },
          },
        ],
      },
    })

    const { result } = await renderHook(() => useFoodSearch('nutella'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it('retourne un tableau vide si products est absent', async () => {
    mockedGet.mockResolvedValueOnce({ data: {} })

    const { result } = await renderHook(() => useFoodSearch('nutella'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it("passe en état error en cas d'échec réseau", async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = await renderHook(() => useFoodSearch('nutella'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
