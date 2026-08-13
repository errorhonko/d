import { describe, expect, it } from 'vitest'
import { championCatalog } from '../champions'
import { arenaChampionCalculationInput } from '../champions/calculation'
import { findPrismaticItem } from '../prismatic-items'
import { calculateRangedAnvilBenefit } from './benefit'
import { calculateRangedChampion, findStatAnvilOption } from './calculator'
import { calculateRangedDps } from './dps'

const ashe = championCatalog.championsByKey.get('Ashe')!
const target = { armor: 0, magicResistance: 0 } as const
const scenario = {
  durationSeconds: 10,
  targetMaxHealth: 3000,
  targetCurrentHealthPercent: 50,
  activeUses: 1,
  energizedProcs: 1,
} as const

function itemDps(itemId: number) {
  const champion = arenaChampionCalculationInput({
    champion: ashe,
    level: 18,
    prismaticItem: findPrismaticItem(itemId),
    statAnvils: [],
    combatScenario: scenario,
  })
  const calculation = calculateRangedChampion(champion)
  return {
    champion,
    calculation,
    dps: calculateRangedDps({
      stats: calculation.finalStats,
      target,
      prismaticItem: champion.prismaticItemDps,
    }),
  }
}

describe('射手棱彩装备 DPS 效果', () => {
  it('断筋者按暴击频率增加可叠加流血 DPS', () => {
    const { dps } = itemDps(443069)
    expect(dps.prismaticItemContribution.physicalRawDps).toBeGreaterThan(0)
    expect(dps.prismaticItemContribution.magicRawDps).toBe(0)
  })

  it('狂风之力按等级、额外攻击力和目标已损生命计算主动', () => {
    const { dps } = itemDps(446671)
    expect(dps.prismaticItemContribution.physicalRawDps).toBeCloseTo(53.6)
  })

  it('收割者的过路费换算适应之力、乘算攻速并累计最大生命真实伤害', () => {
    const { calculation, dps } = itemDps(443090)
    expect(calculation.finalStats.attack_damage).toBeCloseTo(142.5)
    expect(calculation.finalStats.attack_speed).toBeCloseTo(1.520467)
    expect(dps.prismaticItemContribution.trueDps).toBeGreaterThan(50)
  })

  it('神圣之剑换算适应之力并使用随机额外暴伤的期望值', () => {
    const { calculation, dps } = itemDps(443060)
    expect(calculation.finalStats.attack_damage).toBeCloseTo(184.5)
    expect(calculation.finalStats.critical_strike_chance).toBe(50)
    expect(dps.effectiveCriticalStrikeDamage).toBe(187.5)
  })

  it('爆鸣把一次盈能攻击折算为当前生命值魔法 DPS', () => {
    const { dps } = itemDps(443055)
    expect(dps.prismaticItemContribution.magicRawDps).toBe(19.5)
  })

  it('海克斯弹丸配枪合并周期和盈能触发次数', () => {
    const { dps } = itemDps(443081)
    expect(dps.prismaticItemContribution.physicalRawDps).toBe(20)
  })

  it('装备被动会进入下一次锻造的边际收益比较', () => {
    const { champion } = itemDps(443090)
    const benefit = calculateRangedAnvilBenefit({
      champion,
      target,
      candidate: { option: findStatAnvilOption('gold', 'attack_speed') },
    })

    expect(benefit.beforeDps.prismaticItemContribution.trueDps).toBeGreaterThan(0)
    expect(benefit.afterDps.prismaticItemContribution.trueDps).toBeGreaterThan(
      benefit.beforeDps.prismaticItemContribution.trueDps,
    )
  })
})
