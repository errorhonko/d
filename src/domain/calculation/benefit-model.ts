import type { AnvilOption, AnvilTier } from '../stat-anvils'
import type { RangedDamageProfile, FixedDefenseTarget, RangedDpsResult } from './dps-model'
import type {
  DefensiveSummary,
  RangedChampionCalculationInput,
  RangedChampionCalculationResult,
  RangedChampionSelection,
  StatBlock,
} from './model'

export interface MetricGain {
  readonly before: number
  readonly after: number
  readonly absolute: number
  /** 基准值为 0 时无法定义百分比收益，返回 null。 */
  readonly percent: number | null
}

export interface RangedAnvilBenefitInput {
  readonly champion: RangedChampionCalculationInput
  readonly target: FixedDefenseTarget
  readonly profile?: RangedDamageProfile
  readonly candidate: RangedChampionSelection
}

export interface RangedAnvilBenefitResult {
  readonly option: AnvilOption
  readonly effectivenessPercent: number
  readonly statDelta: StatBlock
  readonly totalDps: MetricGain
  readonly physicalDps: MetricGain
  readonly magicDps: MetricGain
  readonly trueDps: MetricGain
  readonly physicalEffectiveHealth: MetricGain
  readonly magicEffectiveHealth: MetricGain
  readonly gold: MetricGain
  readonly beforeCalculation: RangedChampionCalculationResult
  readonly afterCalculation: RangedChampionCalculationResult
  readonly beforeDps: RangedDpsResult
  readonly afterDps: RangedDpsResult
  readonly beforeDefense: DefensiveSummary
  readonly afterDefense: DefensiveSummary
}

export interface SingleStatAnvilTierOutcomes {
  readonly tier: AnvilTier
  readonly outcomes: readonly RangedAnvilBenefitResult[]
}

export interface SingleStatAnvilPurchaseResult {
  readonly price: number
  readonly allChoicesHaveSameTier: boolean
  /** 数据源未公布各品质概率，因此这里只列出随机品质确定后的条件结果。 */
  readonly tierProbabilities: null
  readonly tiers: readonly SingleStatAnvilTierOutcomes[]
}
