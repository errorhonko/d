import { describe, expect, it } from 'vitest'
import { statAnvilCatalog } from '../stat-anvils'
import { compareAllRangedAnvilBenefits } from '../calculation'
import { championCalculationBase } from './calculation'
import { championCatalog } from './catalog'

describe('全属性锻造器收益示例', () => {
  it('用寒冰射手一次模拟全部 36 种属性锻造器', () => {
    const ashe = championCatalog.championsByKey.get('Ashe')!
    const benefits = compareAllRangedAnvilBenefits({
      champion: {
        ...championCalculationBase(ashe),
        selections: [],
      },
      target: { armor: 100, magicResistance: 100 },
      roundsAlreadyLost: 2,
      newRoundsAfterSelection: 3,
    })

    expect(benefits).toHaveLength(36)
    expect(new Set(benefits.map(({ option }) => `${option.tier}:${option.id}`)).size).toBe(36)

    const byOption = (tier: 'silver' | 'gold' | 'prismatic', id: string) =>
      benefits.find((benefit) => benefit.option.tier === tier && benefit.option.id === id)!

    expect(byOption('silver', 'attack_damage').totalDps.percent).toBeCloseTo(25.4237288)
    expect(byOption('gold', 'attack_speed').totalDps.percent).toBeCloseTo(35)
    expect(byOption('gold', 'health').physicalEffectiveHealth.percent).toBeCloseTo(61.4754098)
    expect(byOption('gold', 'armor').physicalEffectiveHealth.percent).toBeCloseTo(35.7142857)
    expect(byOption('gold', 'magic_resistance').magicEffectiveHealth.percent).toBeCloseTo(34.6153846)
    expect(byOption('prismatic', 'armor_penetration_percent').totalDps.percent).toBeCloseTo(9.5890411)
    expect(byOption('prismatic', 'fortune').gold.absolute).toBe(2000)
    expect(byOption('prismatic', 'care_package').gold.absolute).toBe(1000)

    for (const benefit of benefits) {
      expect(Number.isFinite(benefit.totalDps.absolute), benefit.option.name).toBe(true)
      expect(Number.isFinite(benefit.physicalEffectiveHealth.absolute), benefit.option.name).toBe(true)
      expect(Number.isFinite(benefit.magicEffectiveHealth.absolute), benefit.option.name).toBe(true)
      expect(Number.isFinite(benefit.gold.absolute), benefit.option.name).toBe(true)
    }

    expect(
      benefits.filter(({ option }) => option.tier === 'silver'),
    ).toHaveLength(statAnvilCatalog.optionsByTier.silver.length)
  })
})
