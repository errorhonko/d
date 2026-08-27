import type { StatBlock } from './model'
import type { PrismaticItem } from '../prismatic-items'

export interface FixedDefenseTarget {
  readonly armor: number
  readonly magicResistance: number
}

export interface RangedCombatScenario {
  /** 用于把主动、周期触发和叠层总伤害折算成 DPS。 */
  readonly durationSeconds: number
  readonly targetMaxHealth: number
  /** 0 到 100；周期内按该平均生命比例近似。 */
  readonly targetCurrentHealthPercent: number
  readonly activeUses: number
  readonly energizedProcs: number
  readonly targetDistance: number
  readonly spellbladeProcs: number
  readonly dashProcs: number
  readonly weakpointProcs: number
  readonly resistanceShredStacks: number
  readonly uniqueBurnSources: number
  /** 0 到 100，目标停留在持续区域内的时间比例。 */
  readonly persistentAreaUptimePercent: number
}

export interface PrismaticItemDpsContext {
  readonly item: PrismaticItem
  readonly championLevel: number
  /** 不含装备与锻造的当前等级英雄基础攻击力。 */
  readonly baseAttackDamage: number
  readonly baseArmor: number
  readonly baseHealth: number
  readonly scenario?: Partial<RangedCombatScenario>
}

export interface RangedDamageProfile {
  /** 普攻的总 AD 比率，普通攻击默认为 1。 */
  readonly attackDamageRatio?: number
  /** 是否允许普攻的 AD 部分暴击。 */
  readonly basicAttackCanCrit?: boolean
  /** 攻击特效的总效能倍率；1.4 表示每次主攻击合计触发 140% 特效伤害。 */
  readonly onHitEffectiveness?: number
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
  readonly prismaticItem?: PrismaticItemDpsContext
}

export interface DamageTypeDps {
  readonly raw: number
  readonly damageMultiplier: number
  readonly afterMitigation: number
}

export interface RangedDpsResult {
  readonly attacksPerSecond: number
  readonly expectedCritMultiplier: number
  readonly effectiveCriticalStrikeDamage: number
  readonly effectiveTargetArmor: number
  readonly effectiveTargetMagicResistance: number
  readonly physical: DamageTypeDps
  readonly magic: DamageTypeDps
  readonly true: DamageTypeDps
  readonly totalRawDps: number
  readonly totalDps: number
  readonly prismaticItemContribution: Readonly<{
    physicalRawDps: number
    magicRawDps: number
    trueDps: number
    basicAttackDamageMultiplier: number
    armorReduction: number
    magicResistanceReduction: number
  }>
}
