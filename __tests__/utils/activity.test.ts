import {
  formatActivityCalories,
  formatActivityDistance,
  formatActivityDuration,
  formatActivityElevation,
  getActivityTypeInfo,
} from '@/src/utils/activity'

describe('formatActivityDistance', () => {
  it('convertit les mètres en km avec une décimale', () => {
    expect(formatActivityDistance(15000.5)).toBe('15.0 km')
  })

  it('retourne null si la distance est null', () => {
    expect(formatActivityDistance(null)).toBeNull()
  })
})

describe('formatActivityDuration', () => {
  it('formate en minutes sous 1h', () => {
    expect(formatActivityDuration(1800)).toBe('30 min')
  })

  it('formate en heures et minutes au-delà de 1h', () => {
    expect(formatActivityDuration(3900)).toBe('1h05')
  })

  it('retourne null si la durée est null', () => {
    expect(formatActivityDuration(null)).toBeNull()
  })
})

describe('formatActivityElevation', () => {
  it('arrondit le dénivelé et ajoute le suffixe D+', () => {
    expect(formatActivityElevation(419.6)).toBe('420 m D+')
  })

  it('retourne null si le dénivelé est null', () => {
    expect(formatActivityElevation(null)).toBeNull()
  })
})

describe('formatActivityCalories', () => {
  it('arrondit les calories et ajoute le suffixe kcal', () => {
    expect(formatActivityCalories(870.2)).toBe('870 kcal')
  })

  it('retourne null si les calories sont nulles', () => {
    expect(formatActivityCalories(null)).toBeNull()
  })
})

describe('getActivityTypeInfo', () => {
  it('retourne le label français pour un type connu', () => {
    expect(getActivityTypeInfo('MountainBikeRide').label).toBe('VTT')
    expect(getActivityTypeInfo('Run').label).toBe('Course à pied')
  })

  it('retourne le type brut comme label pour un type inconnu', () => {
    expect(getActivityTypeInfo('Kayaking').label).toBe('Kayaking')
  })
})
