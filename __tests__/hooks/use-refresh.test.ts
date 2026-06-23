import { act, renderHook } from '@testing-library/react-native'

import { useRefresh } from '@/src/hooks/use-refresh'

describe('useRefresh', () => {
  it('retourne refreshing à false initialement', async () => {
    const { result } = await renderHook(() => useRefresh())
    expect(result.current.refreshing).toBe(false)
  })

  it('appelle le callback onRefresh fourni', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = await renderHook(() => useRefresh(onRefresh))
    // capture avant act — result.current peut devenir null à l'intérieur en React 19 Strict Mode
    const { refresh } = result.current

    await act(async () => {
      await refresh()
    })

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('remet refreshing à false après un refresh réussi', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = await renderHook(() => useRefresh(onRefresh))
    const { refresh } = result.current

    await act(async () => {
      await refresh()
    })

    expect(result.current.refreshing).toBe(false)
  })

  it('remet refreshing à false même si onRefresh rejette', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('réseau indisponible'))
    const { result } = await renderHook(() => useRefresh(onRefresh))
    const { refresh } = result.current

    await act(async () => {
      try {
        await refresh()
      } catch {
        /* erreur attendue — finally du hook remet refreshing à false */
      }
    })

    expect(result.current.refreshing).toBe(false)
  })

  it('fonctionne sans callback onRefresh', async () => {
    const { result } = await renderHook(() => useRefresh())
    const { refresh } = result.current

    await act(async () => {
      await refresh()
    })

    expect(result.current.refreshing).toBe(false)
  })
})
