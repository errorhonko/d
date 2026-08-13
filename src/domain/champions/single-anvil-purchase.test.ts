import { describe, expect, it } from 'vitest'
import {
  calculateRangedChampion,
  findStatAnvilOption,
  resolveArenaCategoryRoundTarget,
  simulateSingleStatAnvilPurchase,
} from '../calculation'
import { findPrismaticItem } from '../prismatic-items'
import { prismaticItemCatalog } from '../prismatic-items'
import { statAnvilCatalog } from '../stat-anvils'
import { arenaChampionCalculationInput } from './calculation'
import { championCatalog } from './catalog'

describe('单次购买属性锻造器', () => {
  it('仅用模式内合法来源构造局面并覆盖单次购买的全部 36 种结果', () => {
    const ashe = championCatalog.championsByKey.get('Ashe')!
    const arenaInput = arenaChampionCalculationInput({
      champion: ashe,
      level: 18,
      prismaticItem: findPrismaticItem(447103),
      statAnvils: [
        { option: findStatAnvilOption('gold', 'attack_damage') },
        { option: findStatAnvilOption('gold', 'attack_speed') },
        { option: findStatAnvilOption('gold', 'health') },
        { option: findStatAnvilOption('silver', 'armor') },
        { option: findStatAnvilOption('silver', 'magic_resistance') },
      ],
    })
    const current = calculateRangedChampion(arenaInput)
    const targetSample = resolveArenaCategoryRoundTarget('Marksman', 10)
    const purchase = simulateSingleStatAnvilPurchase({
      champion: arenaInput,
      target: {
        armor: targetSample.armor,
        magicResistance: targetSample.magicResistance,
      },
      roundsAlreadyLost: 2,
      newRoundsAfterSelection: 3,
    })

    expect(current.finalStats).toMatchObject({
      health: 2702,
      ability_power: 0,
      attack_damage: 223.5,
      armor: 119.2,
      magic_resistance: 67.1,
    })
    expect(current.finalStats.attack_speed).toBeCloseTo(1.22388)
    expect(targetSample.observations).toBeGreaterThan(0)

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
    expect(outcome('silver', 'attack_damage').totalDps.percent).toBeCloseTo(6.711409)
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

  it('用固定种子的随机等级、已有锻体数量和棱彩装备回归 100 个局面', () => {
    let state = 0x2615
    const random = () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
      return state / 0x1_0000_0000
    }
    const pick = <T>(values: readonly T[]): T =>
      values[Math.floor(random() * values.length)]!
    const rangedChampions = championCatalog.champions.filter((champion) =>
      champion.tags.includes('Marksman'),
    )
    const allAnvils = Object.values(statAnvilCatalog.optionsByTier).flat()
    const cases: Array<{
      champion: string
      level: number
      existingAnvils: number
      item: number
    }> = []

    for (let index = 0; index < 100; index += 1) {
      const champion = pick(rangedChampions)
      const level = 3 + Math.floor(random() * 16)
      const existingAnvils = Math.floor(random() * 13)
      const item = pick(prismaticItemCatalog.items)
      const statAnvils = Array.from({ length: existingAnvils }, () => ({
        option: pick(allAnvils),
        roundsAlreadyLost: Math.floor(random() * 5),
        newRoundsAfterSelection: Math.floor(random() * 8),
      }))
      const arenaInput = arenaChampionCalculationInput({
        champion,
        level,
        prismaticItem: item,
        statAnvils,
      })
      const before = calculateRangedChampion(arenaInput)
      const target = resolveArenaCategoryRoundTarget(
        pick(['Marksman', 'Fighter', 'Mage', 'Assassin', 'Tank', 'Support'] as const),
        3 + Math.floor(random() * 10),
      )
      const purchase = simulateSingleStatAnvilPurchase({
        champion: arenaInput,
        target: {
          armor: target.armor,
          magicResistance: target.magicResistance,
        },
        roundsAlreadyLost: Math.floor(random() * 5),
        newRoundsAfterSelection: Math.floor(random() * 8),
      })

      cases.push({ champion: champion.key, level, existingAnvils, item: item.id })
      expect(before.steps, `case ${index}`).toHaveLength(existingAnvils)
      expect(purchase.tiers.flatMap(({ outcomes }) => outcomes), `case ${index}`).toHaveLength(36)
      expect(before.finalStats.health, `case ${index}`).toBeGreaterThan(0)
      for (const result of purchase.tiers.flatMap(({ outcomes }) => outcomes)) {
        expect(Number.isFinite(result.totalDps.after), `case ${index} ${result.option.name}`).toBe(true)
        expect(Number.isFinite(result.physicalEffectiveHealth.after), `case ${index} ${result.option.name}`).toBe(true)
        expect(Number.isFinite(result.magicEffectiveHealth.after), `case ${index} ${result.option.name}`).toBe(true)
      }
    }

    expect(new Set(cases.map(({ level }) => level)).size).toBeGreaterThanOrEqual(12)
    expect(new Set(cases.map(({ existingAnvils }) => existingAnvils)).size).toBe(13)
    expect(new Set(cases.map(({ item }) => item)).size).toBeGreaterThanOrEqual(20)
    expect(new Set(cases.map(({ champion }) => champion)).size).toBeGreaterThanOrEqual(20)
  })
})
