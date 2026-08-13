import type {
  InitialStatBlock,
  RangedChampionCalculationInput,
  RangedChampionSelection,
} from '../calculation'
import type { ChampionInitialStats } from './model'

export interface ArenaChampionBuildInput {
  readonly champion: ChampionInitialStats
  readonly level: number
  /** 第二回合棱彩装备提供的静态属性；装备被动由伤害 profile 单独建模。 */
  readonly prismaticItemStats?: InitialStatBlock
  readonly statAnvils: readonly RangedChampionSelection[]
  /** 碎片之刃对全部属性锻体的最终效率，100 表示没有增幅。 */
  readonly shardbladeEffectivenessPercent?: number
}

function levelGrowth(growth: number, level: number): number {
  const levelsGained = level - 1
  return growth * levelsGained * (0.7025 + 0.0175 * levelsGained)
}

function addStatBlocks(
  base: InitialStatBlock,
  contribution: InitialStatBlock = {},
): InitialStatBlock {
  return Object.fromEntries(
    Array.from(new Set([...Object.keys(base), ...Object.keys(contribution)])).map(
      (key): [string, number] => [
        key,
        (base[key as keyof InitialStatBlock] ?? 0) +
          (contribution[key as keyof InitialStatBlock] ?? 0),
      ],
    ),
  )
}

/**
 * 将 Data Dragon 的 1 级英雄属性转换为锻体计算器的输入格式。
 *
 */
export function championInitialStatBlock(
  champion: ChampionInitialStats,
): InitialStatBlock {
  return {
    health: champion.base.health,
    attack_damage: champion.base.attackDamage,
    attack_speed: champion.base.attackSpeed,
    armor: champion.base.armor,
    magic_resistance: champion.base.magicResistance,
    movement_speed: champion.base.movementSpeed,
    critical_strike_chance: champion.base.criticalStrikeChance,
    critical_strike_damage: 175,
    size: 100,
  }
}

export function championCalculationBase(champion: ChampionInitialStats): {
  readonly initialStats: InitialStatBlock
  readonly attackSpeedRatio: number
} {
  return {
    initialStats: championInitialStatBlock(champion),
    attackSpeedRatio: champion.base.attackSpeedRatio,
  }
}

export function championStatsAtLevel(
  champion: ChampionInitialStats,
  level: number,
): InitialStatBlock {
  if (!Number.isInteger(level) || level < 1 || level > 18) {
    throw new Error('level 必须是 1 到 18 的整数')
  }

  const initial = championInitialStatBlock(champion)
  return {
    ...initial,
    health: champion.base.health + levelGrowth(champion.growth.health, level),
    attack_damage:
      champion.base.attackDamage + levelGrowth(champion.growth.attackDamage, level),
    attack_speed:
      champion.base.attackSpeed +
      champion.base.attackSpeedRatio *
        (levelGrowth(champion.growth.attackSpeedPercent, level) / 100),
    armor: champion.base.armor + levelGrowth(champion.growth.armor, level),
    magic_resistance:
      champion.base.magicResistance +
      levelGrowth(champion.growth.magicResistance, level),
  }
}

/**
 * 只组合斗魂锻体模式的稳定属性来源：英雄等级属性、第二回合棱彩装备、
 * 已选属性锻造器，以及最终获得的碎片之刃增幅。
 */
export function arenaChampionCalculationInput(
  input: ArenaChampionBuildInput,
): RangedChampionCalculationInput {
  const effectiveness = input.shardbladeEffectivenessPercent ?? 100
  if (!Number.isFinite(effectiveness) || effectiveness < 100) {
    throw new Error('shardbladeEffectivenessPercent 必须是大于等于 100 的有限数字')
  }

  return {
    initialStats: addStatBlocks(
      championStatsAtLevel(input.champion, input.level),
      input.prismaticItemStats,
    ),
    attackSpeedRatio: input.champion.base.attackSpeedRatio,
    selections: input.statAnvils.map((selection) => ({
      ...selection,
      effectivenessPercent:
        (selection.effectivenessPercent ?? 100) * (effectiveness / 100),
    })),
  }
}
