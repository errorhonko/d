import rawTargets from '../../../data/curated/arena-resistances/kr-26.15-100/category-round-targets.json'
import { statAnvilCatalog, type AnvilTier } from '../stat-anvils'
import { compareRangedAnvilBenefits } from './benefit'
import type {
  RangedAnvilBenefitResult,
} from './benefit-model'
import type { FixedDefenseTarget, RangedDamageProfile } from './dps-model'
import type {
  RangedChampionCalculationInput,
  RangedChampionSelection,
} from './model'

export const ARENA_CHAMPION_CATEGORIES = [
  'Assassin',
  'Fighter',
  'Mage',
  'Marksman',
  'Support',
  'Tank',
] as const

export type ArenaChampionCategory = (typeof ARENA_CHAMPION_CATEGORIES)[number]
export type ArenaTargetStatistic = 'mean' | 'median' | 'p25' | 'p75'
export type ArenaTargetConfidence = 'high' | 'medium' | 'low'

interface ResistanceStatistics {
  readonly mean: number
  readonly p25: number
  readonly median: number
  readonly p75: number
  readonly min: number
  readonly max: number
}

interface RawArenaCategoryRoundTarget {
  readonly category: string
  readonly categoryZh: string
  readonly round: number
  readonly confidence: string
  readonly observations: number
  readonly matches: number
  readonly armor: ResistanceStatistics
  readonly magicResistance: ResistanceStatistics
}

export interface ArenaCategoryRoundTarget {
  readonly category: ArenaChampionCategory
  readonly categoryZh: string
  readonly round: number
  readonly statistic: ArenaTargetStatistic
  readonly confidence: ArenaTargetConfidence
  readonly observations: number
  readonly matches: number
  readonly armor: number
  readonly magicResistance: number
  readonly distribution: {
    readonly armor: ResistanceStatistics
    readonly magicResistance: ResistanceStatistics
  }
}

export interface CategoryRoundAnvilBenefitInput {
  readonly champion: RangedChampionCalculationInput
  /** 目标英雄的 Riot 主类别。 */
  readonly targetCategory: ArenaChampionCategory
  readonly round: number
  readonly tier: AnvilTier
  /** 默认使用中位数；P25/P75 可用于乐观/保守场景。 */
  readonly statistic?: ArenaTargetStatistic
  readonly profile?: RangedDamageProfile
  readonly effectivenessPercent?: number
  readonly roundsAlreadyLost?: number
  readonly newRoundsAfterSelection?: number
}

export interface CategoryRoundAnvilBenefitResult {
  readonly target: ArenaCategoryRoundTarget
  readonly fixedDefenseTarget: FixedDefenseTarget
  readonly tier: AnvilTier
  readonly benefits: readonly RangedAnvilBenefitResult[]
}

const targetRows = rawTargets.rows as readonly RawArenaCategoryRoundTarget[]

function isCategory(value: string): value is ArenaChampionCategory {
  return (ARENA_CHAMPION_CATEGORIES as readonly string[]).includes(value)
}

function isConfidence(value: string): value is ArenaTargetConfidence {
  return value === 'high' || value === 'medium' || value === 'low'
}

export function resolveArenaCategoryRoundTarget(
  category: ArenaChampionCategory,
  round: number,
  statistic: ArenaTargetStatistic = 'median',
): ArenaCategoryRoundTarget {
  if (!Number.isInteger(round) || round < 1) {
    throw new Error('round 必须是正整数')
  }

  const row = targetRows.find(
    (candidate) => candidate.category === category && candidate.round === round,
  )
  if (row === undefined) {
    throw new Error(`没有 ${category} 第 ${round} 回合的双抗样本`)
  }
  if (!isCategory(row.category) || !isConfidence(row.confidence)) {
    throw new Error('英雄大类双抗数据包含未知枚举值')
  }

  return {
    category: row.category,
    categoryZh: row.categoryZh,
    round: row.round,
    statistic,
    confidence: row.confidence,
    observations: row.observations,
    matches: row.matches,
    armor: row.armor[statistic],
    magicResistance: row.magicResistance[statistic],
    distribution: {
      armor: row.armor,
      magicResistance: row.magicResistance,
    },
  }
}

export function calculateCategoryRoundAnvilBenefits(
  input: CategoryRoundAnvilBenefitInput,
): CategoryRoundAnvilBenefitResult {
  const target = resolveArenaCategoryRoundTarget(
    input.targetCategory,
    input.round,
    input.statistic,
  )
  const fixedDefenseTarget: FixedDefenseTarget = {
    armor: target.armor,
    magicResistance: target.magicResistance,
  }
  const candidates: RangedChampionSelection[] =
    statAnvilCatalog.optionsByTier[input.tier].map((option) => ({
      option,
      ...(input.effectivenessPercent === undefined
        ? {}
        : { effectivenessPercent: input.effectivenessPercent }),
      ...(input.roundsAlreadyLost === undefined
        ? {}
        : { roundsAlreadyLost: input.roundsAlreadyLost }),
      ...(input.newRoundsAfterSelection === undefined
        ? {}
        : { newRoundsAfterSelection: input.newRoundsAfterSelection }),
    }))

  const benefits = compareRangedAnvilBenefits({
    champion: input.champion,
    target: fixedDefenseTarget,
    ...(input.profile === undefined ? {} : { profile: input.profile }),
    candidates,
  })

  return { target, fixedDefenseTarget, tier: input.tier, benefits }
}
