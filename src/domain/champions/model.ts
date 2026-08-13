export interface ChampionBaseStats {
  readonly health: number
  readonly resource: number
  readonly healthRegen: number
  readonly resourceRegen: number
  readonly attackDamage: number
  readonly attackSpeed: number
  readonly attackSpeedRatio: number
  readonly armor: number
  readonly magicResistance: number
  readonly movementSpeed: number
  readonly attackRange: number
  readonly criticalStrikeChance: number
}

export interface ChampionGrowthStats {
  readonly health: number
  readonly resource: number
  readonly healthRegen: number
  readonly resourceRegen: number
  readonly attackDamage: number
  readonly attackSpeedPercent: number
  readonly armor: number
  readonly magicResistance: number
  readonly criticalStrikeChance: number
}

export interface ChampionInitialStats {
  readonly id: number
  readonly key: string
  readonly name: string
  readonly title: string
  readonly tags: readonly string[]
  readonly base: ChampionBaseStats
  readonly growth: ChampionGrowthStats
}

export interface ChampionCatalog {
  readonly patch: string
  readonly dataDragonVersion: string
  readonly locale: string
  readonly updatedAt: string
  readonly champions: readonly ChampionInitialStats[]
  readonly championsByKey: ReadonlyMap<string, ChampionInitialStats>
  readonly championsById: ReadonlyMap<number, ChampionInitialStats>
}
