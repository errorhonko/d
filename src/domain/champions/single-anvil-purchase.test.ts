import { describe, expect, it } from 'vitest'
import { simulateSingleStatAnvilPurchase } from '../calculation'
import { championCalculationBase } from './calculation'
import { championCatalog } from './catalog'

describe('单次购买属性锻造器', () => {
  it('按随机品质展示寒冰可获得的每种属性收益', () => {
    const ashe = championCatalog.championsByKey.get('Ashe')!
    const purchase = simulateSingleStatAnvilPurchase({
      champion: { ...championCalculationBase(ashe), selections: [] },
      target: { armor: 100, magicResistance: 100 },
      roundsAlreadyLost: 2,
      newRoundsAfterSelection: 3,
    })

    expect(purchase.price).toBe(750)
    expect(purchase.allChoicesHaveSameTier).toBe(true)
    expect(purchase.tierProbabilities).toBeNull()
    expect(purchase.tiers.map(({ tier, outcomes }) => [tier, outcomes.length])).toEqual([
      ['silver', 13],
      ['gold', 13],
      ['prismatic', 10],
    ])

    const outcome = (tier: 'silver' | 'gold' | 'prismatic', id: string) =>
      purchase.tiers
        .find((group) => group.tier === tier)!
        .outcomes.find((benefit) => benefit.option.id === id)!

    expect(outcome('silver', 'attack_damage').statDelta.attack_damage).toBe(15)
    expect(outcome('silver', 'attack_damage').totalDps.percent).toBeCloseTo(25.4237288)
    expect(outcome('gold', 'attack_speed').statDelta.attack_speed).toBeCloseTo(0.2303)
    expect(outcome('gold', 'attack_speed').totalDps.percent).toBeCloseTo(35)
    expect(outcome('gold', 'health').physicalEffectiveHealth.percent).toBeCloseTo(61.4754098)
    expect(outcome('gold', 'armor').physicalEffectiveHealth.percent).toBeCloseTo(35.7142857)
    expect(outcome('gold', 'magic_resistance').magicEffectiveHealth.percent).toBeCloseTo(34.6153846)
    expect(outcome('prismatic', 'armor_penetration_percent').totalDps.percent).toBeCloseTo(9.5890411)
    expect(outcome('prismatic', 'fortune').gold.absolute).toBe(2000)
    expect(outcome('prismatic', 'care_package').gold.absolute).toBe(1000)
  })
})
