import { describe, expect, it } from 'vitest'
import { findPrismaticItem, prismaticItemCatalog } from './catalog'

describe('prismaticItemCatalog', () => {
  it('只加载 26.15 核验过的棱彩装备', () => {
    expect(prismaticItemCatalog.items).toHaveLength(21)
    expect(findPrismaticItem(447103).name).toBe('血术师之盔')
    expect(findPrismaticItem(443054).name).toBe('暗钢利爪')
    expect(findPrismaticItem(226630).name).toBe('渴血战斧')
  })

  it('拒绝把连续 ID 范围中的普通装备当作棱彩装备', () => {
    expect(prismaticItemCatalog.itemsById.has(447111)).toBe(false)
    expect(() => findPrismaticItem(447111)).toThrow('找不到棱彩装备')
  })
})
