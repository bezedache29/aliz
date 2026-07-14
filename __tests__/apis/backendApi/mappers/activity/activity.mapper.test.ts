import type { StravaActivityDTO } from '@/src/apis/backendApi/dto/activity/activity.dto'
import { stravaActivityDTOtoStravaActivity } from '@/src/apis/backendApi/mappers/activity/activity.mapper'

const makeDTO = (overrides: Partial<StravaActivityDTO> = {}): StravaActivityDTO => ({
  id: 'a-1',
  name: 'Sortie VTT',
  type: 'MountainBikeRide',
  startedAt: '2026-07-01T08:00:00Z',
  distance: 15000.5,
  movingTime: 3600,
  elapsedTime: 3700,
  totalElevationGain: 420,
  calories: 870.2,
  ...overrides,
})

describe('stravaActivityDTOtoStravaActivity', () => {
  it('mappe tous les champs correctement', () => {
    const result = stravaActivityDTOtoStravaActivity(makeDTO())
    expect(result.id).toBe('a-1')
    expect(result.name).toBe('Sortie VTT')
    expect(result.type).toBe('MountainBikeRide')
    expect(result.startedAt).toBe('2026-07-01T08:00:00Z')
    expect(result.distance).toBe(15000.5)
    expect(result.movingTime).toBe(3600)
    expect(result.elapsedTime).toBe(3700)
    expect(result.totalElevationGain).toBe(420)
    expect(result.calories).toBe(870.2)
  })

  it('préserve les champs nullables à null', () => {
    const result = stravaActivityDTOtoStravaActivity(
      makeDTO({
        distance: null,
        movingTime: null,
        elapsedTime: null,
        totalElevationGain: null,
        calories: null,
      }),
    )
    expect(result.distance).toBeNull()
    expect(result.movingTime).toBeNull()
    expect(result.elapsedTime).toBeNull()
    expect(result.totalElevationGain).toBeNull()
    expect(result.calories).toBeNull()
  })
})
