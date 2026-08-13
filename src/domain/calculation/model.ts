import type {
  AnvilEffect,
  AnvilOption,
  StatKey,
} from '../stat-anvils'
import type { PrismaticItemDpsContext } from './dps-model'

export type StatBlock = Readonly<Record<StatKey, number>>

export type InitialStatBlock = Readonly<Partial<Record<StatKey, number>>>

export interface RangedChampionSelection {
  readonly option: AnvilOption
  /** 100 表示原始数值，120 表示受到 20% Shardholder 增幅。 */
  readonly effectivenessPercent?: number
  /** 供“关怀礼包”计算使用。 */
  readonly roundsAlreadyLost?: number
  /** 供“财富”计算后续每回合金币使用。 */
  readonly newRoundsAfterSelection?: number
}

export interface RangedChampionCalculationInput {
  /** 选择锻体前的英雄属性；百分比属性统一使用百分数，例如 25 表示 25%。 */
  readonly initialStats: InitialStatBlock
  /** 攻速成长所使用的英雄攻击速度比率；未提供时使用初始攻击速度。 */
  readonly attackSpeedRatio?: number
  readonly selections: readonly RangedChampionSelection[]
  readonly prismaticItemDps?: PrismaticItemDpsContext
  readonly statAmplificationPercent?: Readonly<Partial<Record<StatKey, number>>>
}

export interface AppliedEffect {
  readonly effect: AnvilEffect
  readonly scale: number
  readonly goldGained: number
}

export interface CalculationStep {
  readonly index: number
  readonly option: AnvilOption
  readonly effectivenessPercent: number
  readonly before: StatBlock
  readonly after: StatBlock
  readonly delta: StatBlock
  readonly goldGained: number
  readonly appliedEffects: readonly AppliedEffect[]
}

export interface ResistanceMitigation {
  readonly resistance: number
  /** 受到的伤害倍率；0.5 表示承受 50% 原始伤害。 */
  readonly damageMultiplier: number
  /** 减伤百分数；负抗性时为负数，表示伤害放大。 */
  readonly damageReductionPercent: number
  readonly damageTakenPer100Raw: number
}

export interface DefensiveSummary {
  readonly armor: ResistanceMitigation
  readonly magicResistance: ResistanceMitigation
  readonly physicalEffectiveHealth: number
  readonly magicEffectiveHealth: number
}

export interface RangedChampionCalculationResult {
  readonly attackType: 'ranged'
  readonly initialStats: StatBlock
  readonly finalStats: StatBlock
  readonly totalDelta: StatBlock
  readonly initialDefense: DefensiveSummary
  readonly finalDefense: DefensiveSummary
  readonly goldGained: number
  readonly steps: readonly CalculationStep[]
}
