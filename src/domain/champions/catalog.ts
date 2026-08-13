import rawCatalog from '../../../data/curated/champions/26.15.json'
import type { ChampionCatalog, ChampionInitialStats } from './model'

const champions: readonly ChampionInitialStats[] = rawCatalog.champions
const championsByKey = new Map(champions.map((champion) => [champion.key, champion]))
const championsById = new Map(champions.map((champion) => [champion.id, champion]))

if (
  rawCatalog.schemaVersion !== 1 ||
  rawCatalog.championCount !== champions.length ||
  championsByKey.size !== champions.length ||
  championsById.size !== champions.length
) {
  throw new Error('英雄初始属性数据无效：数量、ID 或 key 不一致')
}

export const championCatalog: ChampionCatalog = {
  patch: rawCatalog.patch,
  dataDragonVersion: rawCatalog.dataDragonVersion,
  locale: rawCatalog.locale,
  updatedAt: rawCatalog.updatedAt,
  champions,
  championsByKey,
  championsById,
}
