import rawCatalog from '../../../data/curated/prismatic-items/26.15.json'
import type { PrismaticItem, PrismaticItemCatalog } from './model'

const items = rawCatalog.items as readonly PrismaticItem[]
const itemsById = new Map(items.map((item) => [item.id, item]))

if (rawCatalog.schemaVersion !== 1 || items.length !== itemsById.size) {
  throw new Error('棱彩装备数据无效：schema、数量或 ID 不一致')
}

export const prismaticItemCatalog: PrismaticItemCatalog = {
  patch: rawCatalog.patch,
  dataDragonVersion: rawCatalog.dataDragonVersion,
  items,
  itemsById,
}

export function findPrismaticItem(id: number): PrismaticItem {
  const item = itemsById.get(id)
  if (item === undefined) throw new Error(`找不到棱彩装备：${id}`)
  return item
}
