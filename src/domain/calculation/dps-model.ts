import type { StatBlock } from './model'

export interface FixedDefenseTarget {
  readonly armor: number
  readonly magicResistance: number
}

export interface RangedDamageProfile {
  /** 普攻的总 AD 比率，普通攻击默认为 1。 */
  readonly attackDamageRatio?: number
  /** 是否允许普攻的 AD 部分暴击。 */
  readonly basicAttackCanCrit?: boolean
  readonly physicalOnHitPerAttack?: number
  readonly magicOnHitPerAttack?: number
  readonly trueOnHitPerAttack?: number
  readonly additionalPhysicalDps?: number
  readonly additionalMagicDps?: number
  readonly additionalTrueDps?: number
}

export interface RangedDpsInput {
  readonly stats: StatBlock
  readonly target: FixedDefenseTarget
  readonly profile?: RangedDamageProfile
}

export interface DamageTypeDps {
  readonly raw: number
  readonly damageMultiplier: number
  readonly afterMitigation: number
}

export interface RangedDpsResult {
  readonly attacksPerSecond: number
  readonly expectedCritMultiplier: number
  readonly effectiveTargetArmor: number
  readonly effectiveTargetMagicResistance: number
  readonly physical: DamageTypeDps
  readonly magic: DamageTypeDps
  readonly true: DamageTypeDps
  readonly totalRawDps: number
  readonly totalDps: number
}
