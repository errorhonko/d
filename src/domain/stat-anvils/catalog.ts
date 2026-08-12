import rawCatalog from '../../../data/curated/stat-anvils/26.15.json'
import {
  ANVIL_TIERS,
  STAT_KEYS,
  VALUE_UNITS,
  type AnvilEffect,
  type AnvilOption,
  type AnvilTier,
  type DataSource,
  type PercentRange,
  type ShardholderEligibility,
  type ShardholderRules,
  type StackingRule,
  type StatAnvilCatalog,
  type StatKey,
  type ValueUnit,
} from './model'

type JsonRecord = Record<string, unknown>

const DIRECT_STAT_BY_OPTION_ID: Readonly<Record<string, StatKey>> = {
  ability_haste: 'ability_haste',
  ability_power: 'ability_power',
  armor: 'armor',
  armor_penetration_percent: 'armor_penetration_percent',
  attack_damage: 'attack_damage',
  attack_speed: 'attack_speed',
  critical_strike_chance: 'critical_strike_chance',
  critical_strike_damage: 'critical_strike_damage',
  health: 'health',
  lethality: 'lethality',
  magic_penetration_flat: 'magic_penetration_flat',
  magic_penetration_percent: 'magic_penetration_percent',
  magic_resistance: 'magic_resistance',
  spirit: 'heal_and_shield_power',
  tenacity: 'tenacity',
}

const EXPECTED_OPTION_COUNTS: Readonly<Record<AnvilTier, number>> = {
  silver: 13,
  gold: 13,
  prismatic: 10,
}

function fail(path: string, message: string): never {
  throw new Error(`属性锻造器数据无效：${path} ${message}`)
}

function record(value: unknown, path: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail(path, '必须是对象')
  }

  return value as JsonRecord
}

function array(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) return fail(path, '必须是数组')
  return value
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') return fail(path, '必须是字符串')
  return value
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fail(path, '必须是有限数字')
  }

  return value
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') return fail(path, '必须是布尔值')
  return value
}

function strings(value: unknown, path: string): readonly string[] {
  return array(value, path).map((entry, index) =>
    string(entry, `${path}[${index}]`),
  )
}

function valueUnit(value: unknown, path: string): ValueUnit {
  const parsed = string(value, path)
  if (!(VALUE_UNITS as readonly string[]).includes(parsed)) {
    return fail(path, `包含未知单位 ${parsed}`)
  }

  return parsed as ValueUnit
}

function statKey(value: unknown, path: string): StatKey {
  const parsed = string(value, path)
  if (!(STAT_KEYS as readonly string[]).includes(parsed)) {
    return fail(path, `包含未知属性 ${parsed}`)
  }

  return parsed as StatKey
}

function stackingRule(value: unknown, path: string): StackingRule {
  if (value === undefined) return 'additive'

  const parsed = string(value, path)
  if (
    parsed !== 'group_b_additive' &&
    parsed !== 'multiplicative_with_other_percent_penetration_shards'
  ) {
    return fail(path, `包含未知叠加规则 ${parsed}`)
  }

  return parsed
}

function parseStatEffect(input: unknown, path: string): AnvilEffect {
  const effect = record(input, path)
  return {
    kind: 'stat',
    stat: statKey(effect.stat, `${path}.stat`),
    value: number(effect.value, `${path}.value`),
    unit: valueUnit(effect.unit, `${path}.unit`),
    stacking: stackingRule(effect.stacking, `${path}.stacking`),
  }
}

function parseEffects(option: JsonRecord, id: string, path: string): AnvilEffect[] {
  if (option.components !== undefined) {
    return array(option.components, `${path}.components`).map((component, index) =>
      parseStatEffect(component, `${path}.components[${index}]`),
    )
  }

  if (id === 'fortune') {
    return [
      {
        kind: 'economy',
        currency: 'gold',
        trigger: 'immediate',
        value: number(option.immediateGold, `${path}.immediateGold`),
      },
      {
        kind: 'economy',
        currency: 'gold',
        trigger: 'each_new_round',
        value: number(option.goldEachNewRound, `${path}.goldEachNewRound`),
      },
    ]
  }

  if (id === 'care_package') {
    if (option.unit !== 'gold_per_round_already_lost') {
      return fail(`${path}.unit`, '关怀礼包必须按已失败回合数计算')
    }

    return [
      {
        kind: 'economy',
        currency: 'gold',
        trigger: 'per_round_already_lost',
        value: number(option.value, `${path}.value`),
      },
    ]
  }

  if (id === 'omnivamp') {
    if (option.unit !== 'percent') return fail(`${path}.unit`, '必须是 percent')
    return [
      {
        kind: 'conditional-stat',
        stat: 'omnivamp',
        values: {
          melee: number(option.meleeValue, `${path}.meleeValue`),
          ranged: number(option.rangedValue, `${path}.rangedValue`),
        },
        unit: 'percent',
        stacking: 'additive',
      },
    ]
  }

  const stat = DIRECT_STAT_BY_OPTION_ID[id]
  if (stat === undefined) return fail(`${path}.id`, `无法映射选项 ${id}`)

  return [
    {
      kind: 'stat',
      stat,
      value: number(option.value, `${path}.value`),
      unit: valueUnit(option.unit, `${path}.unit`),
      stacking: stackingRule(option.stacking, `${path}.stacking`),
    },
  ]
}

function parseOption(input: unknown, tier: AnvilTier, index: number): AnvilOption {
  const path = `tiers.${tier}[${index}]`
  const option = record(input, path)
  const id = string(option.id, `${path}.id`)

  return {
    id,
    name: string(option.name, `${path}.name`),
    tier,
    effects: parseEffects(option, id, path),
  }
}

function parseRange(value: unknown, path: string): PercentRange {
  const range = record(value, path)
  if (range.unit !== 'percent') return fail(`${path}.unit`, '必须是 percent')

  const minimum = number(range.minimum, `${path}.minimum`)
  const maximum = number(range.maximum, `${path}.maximum`)
  if (minimum > maximum) return fail(path, '最小值不能大于最大值')

  return { minimum, maximum, unit: 'percent' }
}

function parseEligibility(value: unknown, path: string): ShardholderEligibility {
  const eligibility = record(value, path)
  return {
    minimumStatAnvilsPurchased: number(
      eligibility.minimumStatAnvilsPurchased,
      `${path}.minimumStatAnvilsPurchased`,
    ),
    guaranteedAfterStatAnvilsPurchased: number(
      eligibility.guaranteedAfterStatAnvilsPurchased,
      `${path}.guaranteedAfterStatAnvilsPurchased`,
    ),
    fortuneCountsTowardPurchases: boolean(
      eligibility.fortuneCountsTowardPurchases,
      `${path}.fortuneCountsTowardPurchases`,
    ),
    shopItemPurchaseDisqualifies: boolean(
      eligibility.shopItemPurchaseDisqualifies,
      `${path}.shopItemPurchaseDisqualifies`,
    ),
    potionsDisqualify: boolean(
      eligibility.potionsDisqualify,
      `${path}.potionsDisqualify`,
    ),
    statAnvilsDisqualify: boolean(
      eligibility.statAnvilsDisqualify,
      `${path}.statAnvilsDisqualify`,
    ),
    freeRoundThreePrismaticItemDisqualifies: boolean(
      eligibility.freeRoundThreePrismaticItemDisqualifies,
      `${path}.freeRoundThreePrismaticItemDisqualifies`,
    ),
    undoRestoresEligibility: boolean(
      eligibility.undoRestoresEligibility,
      `${path}.undoRestoresEligibility`,
    ),
  }
}

function parseShardholder(value: unknown): ShardholderRules {
  const path = 'shardholder'
  const shardholder = record(value, path)
  const itemGranted = record(shardholder.itemGranted, `${path}.itemGranted`)

  return {
    name: string(shardholder.name, `${path}.name`),
    itemGranted: {
      id: number(itemGranted.id, `${path}.itemGranted.id`),
      name: string(itemGranted.name, `${path}.itemGranted.name`),
    },
    baseEffectivenessIncrease: parseRange(
      shardholder.baseEffectivenessIncrease,
      `${path}.baseEffectivenessIncrease`,
    ),
    prismaticUpgradeIncrease: parseRange(
      shardholder.prismaticUpgradeIncrease,
      `${path}.prismaticUpgradeIncrease`,
    ),
    eligibility: parseEligibility(shardholder.eligibility, `${path}.eligibility`),
    restrictions: strings(shardholder.restrictions, `${path}.restrictions`),
    notes: strings(shardholder.notes, `${path}.notes`),
  }
}

function parseSources(value: unknown): readonly DataSource[] {
  return array(value, 'sources').map((sourceValue, index) => {
    const path = `sources[${index}]`
    const source = record(sourceValue, path)
    const pageLastEdited = source.pageLastEdited

    return {
      type: string(source.type, `${path}.type`),
      url: string(source.url, `${path}.url`),
      ...(pageLastEdited === undefined
        ? {}
        : { pageLastEdited: string(pageLastEdited, `${path}.pageLastEdited`) }),
      supports: strings(source.supports, `${path}.supports`),
    }
  })
}

export function parseStatAnvilCatalog(input: unknown): StatAnvilCatalog {
  const root = record(input, 'root')
  if (root.schemaVersion !== 1) return fail('schemaVersion', '当前只支持版本 1')
  if (root.gameMode !== 'Arena') return fail('gameMode', '当前只支持 Arena')

  const rawTiers = record(root.tiers, 'tiers')
  const parseTier = (tier: AnvilTier): readonly AnvilOption[] => {
    const rawOptions = array(rawTiers[tier], `tiers.${tier}`)
    if (rawOptions.length !== EXPECTED_OPTION_COUNTS[tier]) {
      fail(
        `tiers.${tier}`,
        `应有 ${EXPECTED_OPTION_COUNTS[tier]} 项，实际为 ${rawOptions.length} 项`,
      )
    }

    const options = rawOptions.map((option, index) =>
      parseOption(option, tier, index),
    )
    if (new Set(options.map(({ id }) => id)).size !== options.length) {
      fail(`tiers.${tier}`, '同一等级内存在重复选项 ID')
    }

    return options
  }
  const optionsByTier: Readonly<
    Record<AnvilTier, readonly AnvilOption[]>
  > = {
    silver: parseTier('silver'),
    gold: parseTier('gold'),
    prismatic: parseTier('prismatic'),
  }

  const optionsById = new Map<string, AnvilOption[]>()
  for (const tier of ANVIL_TIERS) {
    for (const option of optionsByTier[tier]) {
      const entries = optionsById.get(option.id) ?? []
      entries.push(option)
      optionsById.set(option.id, entries)
    }
  }

  const item = record(root.item, 'item')
  const selectionRules = record(root.selectionRules, 'selectionRules')

  return {
    schemaVersion: 1,
    gameMode: 'Arena',
    patch: string(root.patch, 'patch'),
    locale: string(root.locale, 'locale'),
    verifiedAt: string(root.verifiedAt, 'verifiedAt'),
    item: {
      id: number(item.id, 'item.id'),
      name: string(item.name, 'item.name'),
      englishName: string(item.englishName, 'item.englishName'),
      price: number(item.price, 'item.price'),
    },
    selectionRules: {
      allChoicesHaveSameTier: boolean(
        selectionRules.allChoicesHaveSameTier,
        'selectionRules.allChoicesHaveSameTier',
      ),
      prismaticGuaranteedRounds: array(
        selectionRules.prismaticGuaranteedRounds,
        'selectionRules.prismaticGuaranteedRounds',
      ).map((round, index) =>
        number(round, `selectionRules.prismaticGuaranteedRounds[${index}]`),
      ),
      prismaticCanReroll: boolean(
        selectionRules.prismaticCanReroll,
        'selectionRules.prismaticCanReroll',
      ),
    },
    optionsByTier,
    optionsById,
    shardholder: parseShardholder(root.shardholder),
    sources: parseSources(root.sources),
    caveats: strings(root.caveats, 'caveats'),
  }
}

export const statAnvilCatalog = parseStatAnvilCatalog(rawCatalog)
