import type { InitialStatBlock } from '../calculation'
import type { ArenaChampionCategory } from '../calculation'

export interface PrismaticItem {
  readonly id: number
  readonly name: string
  readonly staticStats: InitialStatBlock
  readonly bonusAttackSpeedPercent: number
  readonly criticalStrikeChance: number
  /** 适应之力；射手模型按每点 0.6 额外攻击力换算。 */
  readonly adaptiveForce?: number
  /** 乘算全部攻击速度来源，例如 15 表示最终攻速乘 1.15。 */
  readonly multiplicativeAttackSpeedPercent?: number
  readonly movementSpeedPercent?: number
  readonly lethality?: number
  readonly armorAmplificationPercent?: number
  readonly magicResistanceAmplificationPercent?: number
  readonly coreStatAmplification?: Readonly<{
    basePercent: number
    percentPerRoundWin?: number
    percentPerRoundLoss?: number
    percentPerDragonSoul?: number
  }>
  readonly attackDamagePerSovereignTakedown?: number
  readonly modeling?: Readonly<{
    status: 'modeled' | 'static_only' | 'requires_configuration'
    note?: string
  }>
  readonly dpsEffects?: readonly PrismaticDpsEffect[]
}

export type PrismaticDpsEffect =
  | Readonly<{
      kind: 'hamstringer_bleed'
      level1Damage: number
      level18Damage: number
      triggeringDamageRatio: number
    }>
  | Readonly<{
      kind: 'galeforce_active'
      level1Damage: number
      level9Damage: number
      damagePerLevelAfter9: number
      bonusAttackDamageRatio: number
      maximumMissingHealthAmp: number
      maximumAmpAtTargetHealthPercent: number
    }>
  | Readonly<{
      kind: 'reapers_toll'
      rangedMaxHealthRatio: number
      ratioIncreasePerHit: number
    }>
  | Readonly<{
      kind: 'sword_of_the_divine'
      critChanceToMaximumBonusCritDamage: number
      benefitingCritChanceCap: number
    }>
  | Readonly<{
      kind: 'fulmination'
      targetCurrentHealthRatio: number
    }>
  | Readonly<{
      kind: 'hexbolt_companion'
      cooldownSeconds: number
      level1Damage: number
      level18Damage: number
    }>
  | Readonly<{
      kind: 'distance_attack_amp'
      minimumDistance: number
      maximumDistance: number
      maximumDamageAmp: number
    }>
  | Readonly<{
      kind: 'spellblade'
      baseAttackDamageRatio: number
      rangedTargetMaxHealthRatio: number
    }>
  | Readonly<{
      kind: 'true_on_hit_armor_scaling'
      level1Damage: number
      level18Damage: number
      bonusArmorRatio: number
    }>
  | Readonly<{
      kind: 'magic_on_hit_bonus_health_scaling'
      baseDamage: number
      bonusHealthRatio: number
    }>
  | Readonly<{
      kind: 'lightning_rod'
      cooldownSeconds: number
      level1Damage: number
      level18Damage: number
      abilityPowerRatio: number
      bonusAttackDamageRatio: number
    }>
  | Readonly<{
      kind: 'prowlers_claw'
      targetMaxHealthRatio: number
      ratioPerBonusAttackDamage: number
    }>
  | Readonly<{
      kind: 'flat_resistance_shred'
      amountPerStack: number
      maximumStacks: number
    }>
  | Readonly<{
      kind: 'runecarver'
      level1Damage: number
      level18Damage: number
      bonusAttackDamageRatio: number
      abilityPowerRatio: number
      bonusHealthRatio: number
    }>
  | Readonly<{
      kind: 'weakpoint'
      baseTargetMaxHealthRatio: number
      ratioPerAttackDamage: number
      ratioPerAbilityPower: number
    }>
  | Readonly<{
      kind: 'goredrinker_active'
      baseAttackDamageRatio: number
    }>
  | Readonly<{
      kind: 'pyromancers_cloak'
      cooldownSeconds: number
      level1BurnDamage: number
      level18BurnDamage: number
      baseAreaDamagePerSecond: number
      areaDamagePerAdditionalBurnSource: number
    }>
  | Readonly<{
      kind: 'everfrost_active'
      baseDamage: number
      abilityPowerRatio: number
    }>
  | Readonly<{
      kind: 'black_hole_active'
      level1DamagePerSecond: number
      level18DamagePerSecond: number
      maximumHealthRatioPerSecond: number
      baseDurationSeconds: number
      durationPerBonusHealth: number
    }>
  | Readonly<{
      kind: 'reality_fracture'
      cooldownSeconds: number
      grubCount: number
      grubBaseDamage: number
      bonusAttackDamageRatio: number
      abilityPowerRatio: number
    }>

export interface PrismaticItemCatalog {
  readonly patch: string
  readonly dataDragonVersion: string
  readonly items: readonly PrismaticItem[]
  readonly itemsById: ReadonlyMap<number, PrismaticItem>
}

export interface PrismaticItemSelectionProbability {
  readonly item: PrismaticItem
  readonly weightedSelections: number
  readonly probability: number
}

export interface PrismaticItemSelectionDistribution {
  readonly category: ArenaChampionCategory
  readonly participants: number
  readonly recognizedParticipants: number
  readonly excludedWithoutPrismaticItem: number
  readonly playersWithMultiplePrismaticItems: number
  readonly items: readonly PrismaticItemSelectionProbability[]
}

export interface SampledPrismaticItem {
  readonly item: PrismaticItem
  readonly probability: number
  readonly distribution: PrismaticItemSelectionDistribution
}

export type MarksmanPrismaticItemTag =
  | 'attack_damage'
  | 'attack_speed'
  | 'critical_strike'
  | 'ability_power'
  | 'penetration'
  | 'mobility'
  | 'durability'
  | 'damage_effect'
  | 'scaling'

export interface MarksmanPrismaticItemProfile {
  readonly item: PrismaticItem
  readonly selectionRank: number
  readonly weightedSelections: number
  readonly selectionProbability: number
  readonly tags: readonly MarksmanPrismaticItemTag[]
  readonly modelCoverage: 'damage_and_stats' | 'stats_only'
}

export interface MarksmanPrismaticItemModel {
  readonly patch: string
  readonly participants: number
  readonly recognizedParticipants: number
  readonly profiles: readonly MarksmanPrismaticItemProfile[]
  readonly profilesById: ReadonlyMap<number, MarksmanPrismaticItemProfile>
  readonly damageModeledSelectionProbability: number
}

export interface MarksmanPrismaticItemFilter {
  readonly tags?: readonly MarksmanPrismaticItemTag[]
  readonly damageModeledOnly?: boolean
}
