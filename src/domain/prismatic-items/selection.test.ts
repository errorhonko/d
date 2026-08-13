import { describe, expect, it } from 'vitest'
import {
  getPrismaticItemSelectionDistribution,
  sampleMarksmanPrismaticItem,
  samplePrismaticItemForCategory,
} from './selection'

describe('棱彩装备经验抽取概率', () => {
  it('加载韩服 100 场射手玩家归一化分布', () => {
    const distribution = getPrismaticItemSelectionDistribution('Marksman')

    expect(distribution.participants).toBe(334)
    expect(distribution.recognizedParticipants).toBe(321)
    expect(distribution.excludedWithoutPrismaticItem).toBe(13)
    expect(distribution.playersWithMultiplePrismaticItems).toBe(167)
    expect(distribution.items[0]).toMatchObject({
      item: { id: 443069, name: '断筋者' },
      probability: 0.14724818,
    })
    expect(
      distribution.items.reduce((sum, entry) => sum + entry.probability, 0),
    ).toBeCloseTo(1)
  })

  it('允许注入随机数，生成可复现的射手示例装备', () => {
    expect(sampleMarksmanPrismaticItem(() => 0).item.name).toBe('断筋者')
    expect(sampleMarksmanPrismaticItem(() => 0.15).item.name).toBe('狂风之力')
    expect(samplePrismaticItemForCategory('Marksman', () => 0.999999).item.id).toBeTypeOf('number')
  })

  it('拒绝越界随机数', () => {
    expect(() => sampleMarksmanPrismaticItem(() => 1)).toThrow('[0, 1)')
  })
})
