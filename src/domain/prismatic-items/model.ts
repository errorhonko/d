import type { InitialStatBlock } from '../calculation'

export interface PrismaticItem {
  readonly id: number
  readonly name: string
  readonly staticStats: InitialStatBlock
  readonly bonusAttackSpeedPercent: number
  readonly criticalStrikeChance: number
}

export interface PrismaticItemCatalog {
  readonly patch: string
  readonly dataDragonVersion: string
  readonly items: readonly PrismaticItem[]
  readonly itemsById: ReadonlyMap<number, PrismaticItem>
}
