import { describe, expect, it } from 'vitest'
import {
  calculateRangedChampion,
  calculateRangedDps,
  findStatAnvilOption,
} from '../calculation'
import { championInitialStatBlock } from './calculation'
import { championCatalog } from './catalog'

const representativeSelections = [
  { option: findStatAnvilOption('gold', 'attack_damage') },
  { option: findStatAnvilOption('gold', 'attack_speed') },
  { option: findStatAnvilOption('gold', 'health') },
  { option: findStatAnvilOption('silver', 'armor') },
  { option: findStatAnvilOption('silver', 'magic_resistance') },
]

describe('英雄初始属性与计算模型集成', () => {
  it('使用寒冰射手真实初始属性得到可复核的锻体与 DPS 结果', () => {
    const ashe = championCatalog.championsByKey.get('Ashe')
    expect(ashe).toBeDefined()

    const result = calculateRangedChampion({
      initialStats: championInitialStatBlock(ashe!),
      selections: representativeSelections,
    })
    const dps = calculateRangedDps({
      stats: result.finalStats,
      target: { armor: 100, magicResistance: 100 },
    })

    expect(result.initialStats).toMatchObject({
      health: 610,
      attack_damage: 59,
      attack_speed: 0.658,
      armor: 26,
      magic_resistance: 30,
      movement_speed: 325,
      critical_strike_damage: 175,
    })
    expect(result.finalStats).toMatchObject({
      health: 985,
      attack_damage: 94,
      armor: 41,
      magic_resistance: 45,
    })
    expect(result.finalStats.attack_speed).toBeCloseTo(0.8883)
    expect(result.finalDefense.physicalEffectiveHealth).toBeCloseTo(1388.85)
    expect(dps.totalRawDps).toBeCloseTo(83.5002)
    expect(dps.totalDps).toBeCloseTo(41.7501)
  })

  it('全部英雄初始属性都能通过锻体、防御和 DPS 计算', () => {
    for (const champion of championCatalog.champions) {
      const result = calculateRangedChampion({
        initialStats: championInitialStatBlock(champion),
        selections: representativeSelections,
      })
      const dps = calculateRangedDps({
        stats: result.finalStats,
        target: { armor: 100, magicResistance: 100 },
      })

      expect(result.steps, champion.key).toHaveLength(5)
      expect(result.finalStats.health, champion.key).toBeGreaterThan(0)
      expect(result.finalDefense.physicalEffectiveHealth, champion.key).toBeGreaterThan(0)
      expect(result.finalDefense.magicEffectiveHealth, champion.key).toBeGreaterThan(0)
      expect(Number.isFinite(dps.totalDps), champion.key).toBe(true)
      expect(dps.totalDps, champion.key).toBeGreaterThanOrEqual(0)
    }
  })
})
