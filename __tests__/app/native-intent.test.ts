import { redirectSystemPath } from '@/app/+native-intent'

describe('redirectSystemPath', () => {
  it('redirige le callback OAuth Strava vers la racine', () => {
    expect(redirectSystemPath({ path: 'aliz://strava-callback?connected=1', initial: true })).toBe(
      '/',
    )
  })

  it('redirige aussi une erreur de callback Strava vers la racine', () => {
    expect(redirectSystemPath({ path: 'aliz://strava-callback?error=1', initial: false })).toBe('/')
  })

  it('laisse passer les autres chemins inchangés', () => {
    expect(redirectSystemPath({ path: '/food-search', initial: true })).toBe('/food-search')
  })
})
