import { act, renderHook } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useRegenerateMealSlot } from '@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot'

// Flush all pending microtasks
async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

beforeAll(() => {
  notifyManager.setScheduler(queueMicrotask)
})

beforeEach(() => {
  jest.useFakeTimers({ legacyFakeTimers: false })
})

afterEach(() => {
  jest.useRealTimers()
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useRegenerateMealSlot (mock mode)', () => {
  it('returns a slot with status done after mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync({
      dateKey: '2026-06-24',
      mealType: 'Déjeuner',
    })

    await act(async () => {
      await jest.runAllTimersAsync()
    })

    const slot = await mutatePromise
    expect(slot.status).toBe('done')
    expect(slot.meal).toBe('Déjeuner')
  })

  it('accepts an optional prompt', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync({
      dateKey: '2026-06-24',
      mealType: 'Dîner',
      prompt: 'sans viande',
    })

    await act(async () => {
      await jest.runAllTimersAsync()
    })

    const slot = await mutatePromise
    expect(slot.meal).toBe('Dîner')
    expect(slot.status).toBe('done')
  })
})
