import type { StatKey } from '../stat-anvils'

export type AugmentTier = 'silver' | 'gold' | 'prismatic'

export interface AugmentStatModifier {
  readonly stat: StatKey | 'attack_damage_percent' | 'damage_multiplier' | 'multiplicative_attack_speed'
  readonly value: number
}

export interface AugmentStackingConfig {
  readonly maxStacks: number
  readonly stepName: string
  readonly defaultStacks?: number
  /** 每层提供的属性 */
  readonly perStackStats?: readonly AugmentStatModifier[]
  /** 达到满层时的额外爆发效果 */
  readonly fullStackStats?: readonly AugmentStatModifier[]
}

export interface AugmentLevelConfig {
  readonly level: number
  readonly description: string
  readonly stats: readonly AugmentStatModifier[]
  /** 该等级专有的叠层配置（若存在则覆盖外层的 stacking） */
  readonly stacking?: AugmentStackingConfig
}

export interface AugmentDefinition {
  readonly id: string
  readonly name: string
  readonly tier: AugmentTier
  readonly maxLevel: number
  /** 各等级的数值与描述 (Level 1, Level 2, Level 3 等) */
  readonly levels: readonly AugmentLevelConfig[]
  /** 是否为战斗内叠层类符文 (如暴击律动、热身动作) */
  readonly stacking?: AugmentStackingConfig
  /** 标签 */
  readonly tags: readonly string[]
}

export interface AugmentStackOutcome {
  readonly level: number
  readonly stacks: number
  readonly dps: number
  readonly dpsAbsoluteGain: number
  readonly dpsPercentGain: number
  readonly statsDeltaSummary: string
}

export interface AugmentBenefitResult {
  readonly augment: AugmentDefinition
  readonly currentLevel: number
  readonly currentStacks: number
  readonly currentOutcome: AugmentStackOutcome
  /** 阶梯层数收益列表（例如 0层、半层、满层） */
  readonly stackLadder: readonly AugmentStackOutcome[]
}
