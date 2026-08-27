import { describe, expect, it } from 'vitest'
import {
  filterMarksmanPrismaticItemProfiles,
  findMarksmanPrismaticItemProfile,
  marksmanPrismaticItemModel,
} from './marksman'

describe('射手棱彩装备模型', () => {
  it('按韩服射手样本保留频率排序并保留样本口径', () => {
    expect(marksmanPrismaticItemModel.patch).toBe('26.15')
    expect(marksmanPrismaticItemModel.participants).toBe(334)
    expect(marksmanPrismaticItemModel.recognizedParticipants).toBe(321)
    expect(marksmanPrismaticItemModel.profiles).toHaveLength(40)
    expect(marksmanPrismaticItemModel.profiles[0]).toMatchObject({
      item: { id: 443069, name: '断筋者' },
      selectionRank: 1,
      selectionProbability: 0.14724818,
    })
  })

  it('为射手界面提供可筛选的装备标签和模型覆盖状态', () => {
    const hamstringer = findMarksmanPrismaticItemProfile(443069)
    expect(hamstringer.tags).toEqual(
      expect.arrayContaining([
        'attack_damage',
        'attack_speed',
        'critical_strike',
        'damage_effect',
      ]),
    )
    expect(hamstringer.modelCoverage).toBe('damage_and_stats')

    const modeledCritItems = filterMarksmanPrismaticItemProfiles({
      tags: ['critical_strike'],
      damageModeledOnly: true,
    })
    expect(modeledCritItems.map((profile) => profile.item.name)).toEqual(
      expect.arrayContaining(['断筋者', '狂风之力', '神圣之剑']),
    )
  })

  it('统计已建模伤害效果覆盖的射手样本比例', () => {
    expect(
      marksmanPrismaticItemModel.damageModeledSelectionProbability,
    ).toBeCloseTo(0.64579438)
  })

  it('对没有出现在射手样本里的装备给出明确错误', () => {
    expect(() => findMarksmanPrismaticItemProfile(447104)).toThrow(
      '射手样本中找不到棱彩装备',
    )
  })
})
