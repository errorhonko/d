export const ANVIL_TIERS = ['silver', 'gold', 'prismatic'] as const

export type AnvilTier = (typeof ANVIL_TIERS)[number]

export const STAT_KEYS = [
  'ability_haste',
  'ability_power',
  'armor',
  'armor_penetration_percent',
  'attack_damage',
  'attack_speed',
  'critical_strike_chance',
  'critical_strike_damage',
  'heal_and_shield_power',
  'health',
  'lethality',
  'magic_penetration_flat',
  'magic_penetration_percent',
  'magic_resistance',
  'maximum_health_from_all_sources',
  'movement_speed',
  'omnivamp',
  'size',
  'tenacity',
] as const

export type StatKey = (typeof STAT_KEYS)[number]

export const VALUE_UNITS = [
  'additional_percent',
  'bonus_flat',
  'bonus_percent',
  'bonus_percentage_points',
  'flat',
  'heal_and_shield_power_percent',
  'percent',
  'percentage_points',
] as const

export type ValueUnit = (typeof VALUE_UNITS)[number]

export type StackingRule =
  | 'additive'
  | 'group_b_additive'
  | 'multiplicative_with_other_percent_penetration_shards'

export interface StatEffect {
  readonly kind: 'stat'
  readonly stat: StatKey
  readonly value: number
  readonly unit: ValueUnit
  readonly stacking: StackingRule
}

export interface ConditionalStatEffect {
  readonly kind: 'conditional-stat'
  readonly stat: 'omnivamp'
  readonly values: Readonly<Record<'melee' | 'ranged', number>>
  readonly unit: 'percent'
  readonly stacking: 'additive'
}

export type EconomyTrigger =
  | 'immediate'
  | 'each_new_round'
  | 'per_round_already_lost'

export interface EconomyEffect {
  readonly kind: 'economy'
  readonly currency: 'gold'
  readonly trigger: EconomyTrigger
  readonly value: number
}

export type AnvilEffect =
  | StatEffect
  | ConditionalStatEffect
  | EconomyEffect

export interface AnvilOption {
  readonly id: string
  readonly name: string
  readonly tier: AnvilTier
  readonly effects: readonly AnvilEffect[]
}

export interface ItemReference {
  readonly id: number
  readonly name: string
}

export interface StatAnvilItem extends ItemReference {
  readonly englishName: string
  readonly price: number
}

export interface SelectionRules {
  readonly allChoicesHaveSameTier: boolean
  readonly prismaticGuaranteedRounds: readonly number[]
  readonly prismaticCanReroll: boolean
}

export interface PercentRange {
  readonly minimum: number
  readonly maximum: number
  readonly unit: 'percent'
}

export interface ShardholderEligibility {
  readonly minimumStatAnvilsPurchased: number
  readonly guaranteedAfterStatAnvilsPurchased: number
  readonly fortuneCountsTowardPurchases: boolean
  readonly shopItemPurchaseDisqualifies: boolean
  readonly potionsDisqualify: boolean
  readonly statAnvilsDisqualify: boolean
  readonly freeRoundThreePrismaticItemDisqualifies: boolean
  readonly undoRestoresEligibility: boolean
}

export interface ShardholderRules {
  readonly name: string
  readonly itemGranted: ItemReference
  readonly baseEffectivenessIncrease: PercentRange
  readonly prismaticUpgradeIncrease: PercentRange
  readonly eligibility: ShardholderEligibility
  readonly restrictions: readonly string[]
  readonly notes: readonly string[]
}

export interface DataSource {
  readonly type: string
  readonly url: string
  readonly pageLastEdited?: string
  readonly supports: readonly string[]
}

export interface StatAnvilCatalog {
  readonly schemaVersion: 1
  readonly gameMode: 'Arena'
  readonly patch: string
  readonly locale: string
  readonly verifiedAt: string
  readonly item: StatAnvilItem
  readonly selectionRules: SelectionRules
  readonly optionsByTier: Readonly<Record<AnvilTier, readonly AnvilOption[]>>
  readonly optionsById: ReadonlyMap<string, readonly AnvilOption[]>
  readonly shardholder: ShardholderRules
  readonly sources: readonly DataSource[]
  readonly caveats: readonly string[]
}
