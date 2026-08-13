import { describe, expect, it } from 'vitest'
import { simulateSingleStatAnvilPurchase } from '../calculation'
import { championCalculationBase } from './calculation'
import { championCatalog } from './catalog'

describe('单次购买属性锻造器', () => {
  it('在合理的中后期射手属性下覆盖单次购买的全部 36 种结果', () => {
    const ashe = championCatalog.championsByKey.get('Ashe')!
    const purchase = simulateSingleStatAnvilPurchase({
      champion: {
        ...championCalculationBase(ashe),
        initialStats: {
          health: 2500,
          attack_damage: 250,
          ability_power: 100,
          attack_speed: 1.5,
          critical_strike_chance: 75,
          critical_strike_damage: 175,
          ability_haste: 30,
          armor: 100,
          magic_resistance: 70,
          movement_speed: 325,
          size: 100,
        },
        selections: [],
      },
      profile: {
        magicOnHitPerAttack: 50,
        additionalMagicDps: 100,
      },
      target: { armor: 150, magicResistance: 100 },
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
    expect(outcome('silver', 'attack_damage').totalDps.percent).toBeCloseTo(4.368932)
    expect(outcome('gold', 'attack_speed').statDelta.attack_speed).toBeCloseTo(0.2303)
    expect(outcome('gold', 'health').statDelta.health).toBe(375)
    expect(outcome('gold', 'armor').statDelta.armor).toBe(45)
    expect(outcome('gold', 'magic_resistance').statDelta.magic_resistance).toBe(45)
    expect(outcome('prismatic', 'armor_penetration_percent').statDelta.armor_penetration_percent).toBe(17.5)
    expect(outcome('prismatic', 'fortune').gold.absolute).toBe(2000)
    expect(outcome('prismatic', 'care_package').gold.absolute).toBe(1000)

    for (const { outcomes } of purchase.tiers) {
      for (const result of outcomes) {
        expect(Number.isFinite(result.totalDps.absolute), result.option.name).toBe(true)
        expect(Number.isFinite(result.physicalEffectiveHealth.absolute), result.option.name).toBe(true)
        expect(Number.isFinite(result.magicEffectiveHealth.absolute), result.option.name).toBe(true)
        expect(Number.isFinite(result.gold.absolute), result.option.name).toBe(true)
      }
    }
  })
})
