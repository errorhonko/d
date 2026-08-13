import { describe, expect, it } from 'vitest'
import { championCatalog } from './catalog'

describe('championCatalog', () => {
  it('loads every unique champion from patch 26.15', () => {
    expect(championCatalog.patch).toBe('26.15')
    expect(championCatalog.dataDragonVersion).toBe('16.15.1')
    expect(championCatalog.champions).toHaveLength(173)
    expect(championCatalog.championsById.size).toBe(173)
    expect(championCatalog.championsByKey.size).toBe(173)
  })

  it('preserves localized names and initial stats', () => {
    const ashe = championCatalog.championsByKey.get('Ashe')

    expect(ashe).toMatchObject({
      id: 22,
      name: '寒冰射手',
      base: {
        health: 610,
        attackDamage: 59,
        attackSpeed: 0.658,
        armor: 26,
        magicResistance: 30,
      },
      growth: {
        health: 101,
        attackSpeedPercent: 3,
      },
    })
  })

  it('does not expose Jade mode units as champions', () => {
    expect(
      championCatalog.champions.some((champion) => champion.key.startsWith('Jade_')),
    ).toBe(false)
  })
})
