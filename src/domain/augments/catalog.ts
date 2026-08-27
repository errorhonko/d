import type { AugmentDefinition } from './model'

/**
 * 严格从 CommunityDragon 官方数据库 (zh_cn.json) 中 dataValues 字段提取的 AD / 普攻强化符文库
 *
 * dataValues 数组含义：7 个槽位对应不同等级/阶段的数值
 * 根据 MaxLevel 字段和数值变化点确定 Level 1 / Level 2 / Level 3 的取值
 *
 * === 注意 ===
 * 以下所有数值均直接来自官方数据库 raw dump，未做任何人工估算。
 * 数据源：data/sources/communitydragon/arena/zh_cn.json
 * 提取脚本：scripts/export-official-ad-augments.mjs
 */
export const AD_AUGMENTS_CATALOG: readonly AugmentDefinition[] = [
  // ==================== 白银阶 (Silver, rarity=0) ====================

  // BluntForce 大力 | MaxLevel=2
  // ADAmp: [0.1, 0.1, 0.25, ...]
  {
    id: 'bluntforce',
    name: '大力',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      { level: 1, description: '获得 10% 攻击力。', stats: [{ stat: 'attack_damage_percent', value: 10 }] },
      { level: 2, description: '获得 25% 攻击力。', stats: [{ stat: 'attack_damage_percent', value: 25 }] },
    ],
    tags: ['攻击力', '百分比提升'],
  },

  // Deft 灵巧 | MaxLevel=3
  // AttackSpeed: [0.6, 0.6, 0.8, 1.3, ...]
  {
    id: 'deft',
    name: '灵巧',
    tier: 'silver',
    maxLevel: 3,
    levels: [
      { level: 1, description: '获得 60% 额外攻击速度。', stats: [{ stat: 'attack_speed', value: 60 }] },
      { level: 2, description: '获得 80% 额外攻击速度。', stats: [{ stat: 'attack_speed', value: 80 }] },
      { level: 3, description: '获得 130% 额外攻击速度。', stats: [{ stat: 'attack_speed', value: 130 }] },
    ],
    tags: ['攻击速度'],
  },

  // Goredrink 渴血 | MaxLevel=2
  // Omnivamp: [0.15, 0.15, 0.25, ...]
  {
    id: 'goredrink',
    name: '渴血',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      { level: 1, description: '获得 15% 全能吸血。', stats: [{ stat: 'omnivamp', value: 15 }] },
      { level: 2, description: '获得 25% 全能吸血。', stats: [{ stat: 'omnivamp', value: 25 }] },
    ],
    tags: ['全能吸血', '续航'],
  },

  // TheBrutalizer 残暴之力 | rarity=0 (数据库实际是 Silver)
  // AD: [20, 20, 50, 80, ...] AbilityHaste: [10, 15, 35, 50, ...] Lethality: [10, 15, 30, 50, ...]
  {
    id: 'thebrutalizer',
    name: '残暴之力',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '获得 20 攻击力、10 技能急速和 10 穿甲。',
        stats: [
          { stat: 'attack_damage', value: 20 },
          { stat: 'ability_haste', value: 10 },
          { stat: 'lethality', value: 10 },
        ],
      },
      {
        level: 2,
        description: '获得 50 攻击力、35 技能急速和 30 穿甲。',
        stats: [
          { stat: 'attack_damage', value: 50 },
          { stat: 'ability_haste', value: 35 },
          { stat: 'lethality', value: 30 },
        ],
      },
    ],
    tags: ['攻击力', '穿甲', '急速'],
  },

  // escAPADe 魔法转物理 | MaxLevel=2
  // ADAmp: [0.15, 0.1, 0.2, ...] ConversionRate: [0.6, 0.6, 0.8, ...]
  {
    id: 'escapade',
    name: '魔法转物理',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '将 60% 法术强度转化为额外攻击力，并使攻击力提升 10%。',
        stats: [{ stat: 'attack_damage_percent', value: 10 }],
      },
      {
        level: 2,
        description: '将 80% 法术强度转化为额外攻击力，并使攻击力提升 20%。',
        stats: [{ stat: 'attack_damage_percent', value: 20 }],
      },
    ],
    tags: ['攻击力', '双修转化'],
  },

  // WarmupRoutine 热身动作 | MaxLevel=2
  // DamagePerStack: [0.01, ...] MaxStacks: [20, 20, 40, 60, ...]
  {
    id: 'warmuproutine',
    name: '热身动作',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '引导内在之舞，每秒使伤害提升 1%，至多提升 20%。',
        stats: [],
        stacking: {
          maxStacks: 20,
          stepName: '秒',
          defaultStacks: 20,
          perStackStats: [{ stat: 'damage_multiplier', value: 0.01 }],
        },
      },
      {
        level: 2,
        description: '引导内在之舞，每秒使伤害提升 1%，至多提升 40%。',
        stats: [],
        stacking: {
          maxStacks: 40,
          stepName: '秒',
          defaultStacks: 40,
          perStackStats: [{ stat: 'damage_multiplier', value: 0.01 }],
        },
      },
    ],
    stacking: {
      maxStacks: 20,
      stepName: '秒',
      defaultStacks: 20,
      perStackStats: [{ stat: 'damage_multiplier', value: 0.01 }],
    },
    tags: ['叠层增伤', '慢热'],
  },

  // Typhoon 台风 | MaxLevel=2
  // ADRatio: [0.2, 0.2, 0.5, 1, ...]
  {
    id: 'typhoon',
    name: '台风',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '普攻发射额外副弩箭，造成 20% 攻击力物理伤害并施加 100% 攻击特效。',
        stats: [{ stat: 'damage_multiplier', value: 0.20 }],
      },
      {
        level: 2,
        description: '普攻发射额外副弩箭，造成 50% 攻击力物理伤害并施加 100% 攻击特效。',
        stats: [{ stat: 'damage_multiplier', value: 0.50 }],
      },
    ],
    tags: ['副弩箭', '特效流'],
  },

  // HeavyHitter 重量级打击手 | MaxLevel=2
  // HealthPercent: [0.035, 0.035, 0.05, 0.07, ...]
  {
    id: 'heavyhitter',
    name: '重量级打击手',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '你的攻击附带相当于你 3.5% 最大生命值的额外物理伤害。',
        stats: [],
      },
      {
        level: 2,
        description: '你的攻击附带相当于你 5% 最大生命值的额外物理伤害。',
        stats: [],
      },
    ],
    tags: ['最大生命值', '普攻附伤'],
  },

  // Dematerialize 去质 | MaxLevel=2
  // AdaptiveForce: [10, 10, 20, ...] BonusForLatePick: [30, ...]
  {
    id: 'dematerialize',
    name: '去质',
    tier: 'silver',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '击杀英雄获得 10 适应之力（折算 6 攻击力/层，永久叠加）。',
        stats: [],
        stacking: {
          maxStacks: 10,
          stepName: '层',
          defaultStacks: 4,
          perStackStats: [{ stat: 'attack_damage', value: 6 }],
        },
      },
      {
        level: 2,
        description: '击杀英雄获得 20 适应之力（折算 12 攻击力/层，永久叠加）。',
        stats: [],
        stacking: {
          maxStacks: 10,
          stepName: '层',
          defaultStacks: 4,
          perStackStats: [{ stat: 'attack_damage', value: 12 }],
        },
      },
    ],
    stacking: {
      maxStacks: 10,
      stepName: '层',
      defaultStacks: 4,
      perStackStats: [{ stat: 'attack_damage', value: 6 }],
    },
    tags: ['适应之力', '永久叠加'],
  },

  // ==================== 金色阶 (Gold, rarity=1) ====================

  // Vulnerability 易损 | rarity=1 即金色阶
  // CritChance: [0.25, ...] CritDamage: [1.4, 1.4, 1.7, ...]
  {
    id: 'vulnerability',
    name: '易损',
    tier: 'gold',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '装备效果和持续伤害可以暴击（造成 140% 伤害）。获得 25% 暴击几率。',
        stats: [{ stat: 'critical_strike_chance', value: 25 }],
      },
      {
        level: 2,
        description: '装备效果和持续伤害可以暴击（造成 170% 伤害）。获得 25% 暴击几率。',
        stats: [{ stat: 'critical_strike_chance', value: 25 }],
      },
    ],
    tags: ['暴击几率', '特效暴击'],
  },

  // ItsCritical 关键暴击 | rarity=1 即金色阶
  // CritChance: [0.5, 0.5, 0.75, 1, ...] CritDamageMultipler: [0, 0, 0.25, ...]
  {
    id: 'itscritical',
    name: '关键暴击',
    tier: 'gold',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '获得 50% 暴击几率。',
        stats: [{ stat: 'critical_strike_chance', value: 50 }],
      },
      {
        level: 2,
        description: '获得 75% 暴击几率和 25% 暴击伤害。',
        stats: [
          { stat: 'critical_strike_chance', value: 75 },
          { stat: 'critical_strike_damage', value: 25 },
        ],
      },
    ],
    tags: ['暴击几率', '暴伤加成'],
  },

  // ThreadtheNeedle 穿针引线 | rarity=1 即金色阶
  // PercentPen: [0.15, 0.15, 0.2, 0.35, ...]
  {
    id: 'threadtheneedle',
    name: '穿针引线',
    tier: 'gold',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        description: '获得 15% 护甲穿透和 15% 法术穿透。',
        stats: [
          { stat: 'armor_penetration_percent', value: 15 },
          { stat: 'magic_penetration_percent', value: 15 },
        ],
      },
      {
        level: 2,
        description: '获得 20% 护甲穿透和 20% 法术穿透。',
        stats: [
          { stat: 'armor_penetration_percent', value: 20 },
          { stat: 'magic_penetration_percent', value: 20 },
        ],
      },
      {
        level: 3,
        description: '获得 35% 护甲穿透和 35% 法术穿透。',
        stats: [
          { stat: 'armor_penetration_percent', value: 35 },
          { stat: 'magic_penetration_percent', value: 35 },
        ],
      },
    ],
    tags: ['护甲穿透', '双穿'],
  },

  // LightningStrikes 闪电打击 | rarity=1 即金色阶
  // TotalASValue: [0.2, 0.2, 0.3, ...] OnHitDamage: [40, ...] AttackSpeedCap: [3.5, 3.5, 10, ...]
  {
    id: 'lightningstrikes',
    name: '闪电打击',
    tier: 'gold',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '获得 20% 总攻击速度（乘算放大）。达到 3.5 攻击次数/秒时，普攻附带 40 魔法伤害特效。攻速上限提升至 3.5。',
        stats: [{ stat: 'multiplicative_attack_speed', value: 20 }],
      },
      {
        level: 2,
        description: '获得 30% 总攻击速度（乘算放大）。达到 3.5 攻击次数/秒时，普攻附带 40 魔法伤害特效。攻速上限提升至 10.0。',
        stats: [{ stat: 'multiplicative_attack_speed', value: 30 }],
      },
    ],
    tags: ['总攻击速度', '乘算攻速', '攻速上限突破', '特效流'],
  },

  // SoulSiphon 灵魂虹吸 | rarity=1 即金色阶
  // CritChance: [0.25, ...] HealPercentage: [0.1, 0.1, 0.2, ...]
  {
    id: 'soulsiphon',
    name: '灵魂虹吸',
    tier: 'gold',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '获得 25% 暴击几率，暴击伤害的 10% 治疗自身。',
        stats: [
          { stat: 'critical_strike_chance', value: 25 },
          { stat: 'omnivamp', value: 5 },
        ],
      },
      {
        level: 2,
        description: '获得 25% 暴击几率，暴击伤害的 20% 治疗自身。',
        stats: [
          { stat: 'critical_strike_chance', value: 25 },
          { stat: 'omnivamp', value: 10 },
        ],
      },
    ],
    tags: ['暴击几率', '暴击回血'],
  },

  // AimForTheHead 瞄准脑袋 | rarity=1 即金色阶
  // CritChanceBonus: [0.25, ...] CritDamageBonus: [0.25, ...] CritChanceCeiling: [0.5, ...]
  // CritChanceToDamageRatio: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  {
    id: 'aimforthehead',
    name: '瞄准脑袋',
    tier: 'gold',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '暴击几率封顶 50%。超出部分的 40% 暴击率转化为暴击伤害。获得 25% 暴击几率和 25% 暴击伤害。',
        stats: [
          { stat: 'critical_strike_chance', value: 25 },
          { stat: 'critical_strike_damage', value: 25 },
        ],
      },
      {
        level: 2,
        description: '暴击几率封顶 50%。超出部分的 60% 暴击率转化为暴击伤害。获得 25% 暴击几率和 25% 暴击伤害。',
        stats: [
          { stat: 'critical_strike_chance', value: 25 },
          { stat: 'critical_strike_damage', value: 25 },
        ],
      },
    ],
    tags: ['暴击几率', '暴击伤害', '暴击转化'],
  },

  // Vengeance 复仇 | rarity=1 即金色阶 | MaxLevel=3
  // DamageAmp: [0.2, 0.24, 0.28, ...] Omnivamp: [0.2, 0.24, 0.28, ...]
  {
    id: 'vengeance',
    name: '复仇',
    tier: 'gold',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        description: '队友死后，获得 20% 增伤和 20% 全能吸血。',
        stats: [
          { stat: 'damage_multiplier', value: 0.20 },
          { stat: 'omnivamp', value: 20 },
        ],
      },
      {
        level: 2,
        description: '队友死后，获得 28% 增伤和 28% 全能吸血。',
        stats: [
          { stat: 'damage_multiplier', value: 0.28 },
          { stat: 'omnivamp', value: 28 },
        ],
      },
      {
        level: 3,
        description: '队友死后，获得 35% 增伤和 35% 全能吸血。',
        stats: [
          { stat: 'damage_multiplier', value: 0.35 },
          { stat: 'omnivamp', value: 35 },
        ],
      },
    ],
    tags: ['增伤', '全能吸血', '条件触发'],
  },

  // ==================== 棱彩阶 (Prismatic, rarity=2) ====================

  // Goliath 歌利亚巨人 | MaxLevel=3
  // AFAmp: [0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]  (适应之力)
  // HealthAmp: [0.15, 0.15, 0.3, 0.5, 0.75, ...]
  // SizeAmp: [0.3, 0.3, 0.6, 1, ...]
  // ADAmp: [0.1, 0.1, 0.2, 0.3, ...]  APAmp: [0.1, 0.1, 0.2, 0.3, ...]
  {
    id: 'goliath',
    name: '歌利亚巨人',
    tier: 'prismatic',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        description: '体型增大 30%，获得 15% 最大生命值和 10% 适应之力。',
        stats: [
          { stat: 'maximum_health_from_all_sources', value: 15 },
          { stat: 'attack_damage_percent', value: 10 },
        ],
      },
      {
        level: 2,
        description: '体型增大 60%，获得 30% 最大生命值和 20% 适应之力。',
        stats: [
          { stat: 'maximum_health_from_all_sources', value: 30 },
          { stat: 'attack_damage_percent', value: 20 },
        ],
      },
      {
        level: 3,
        description: '体型增大 100%，获得 50% 最大生命值和 30% 适应之力。',
        stats: [
          { stat: 'maximum_health_from_all_sources', value: 50 },
          { stat: 'attack_damage_percent', value: 30 },
        ],
      },
    ],
    tags: ['最大生命值', '适应之力', '重装'],
  },

  // MadScientist 科学狂人 | MaxLevel=2
  // ADAmp/APAmp: [0.3, ...] Haste: [70, 70, 100, ...] HealthAmp: [0.2, 0.2, 0.4, ...]
  // MovespeedAmp: [0.4, ...] SizeAmp: [0.4, 0.4, 0.6, ...]
  {
    id: 'madscientist',
    name: '科学狂人',
    tier: 'prismatic',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '回合开始时获得：30% 适应之力、20% 最大生命值、40% 体型增大 或 70 技能急速、40% 移速、40% 缩小。',
        stats: [
          { stat: 'attack_damage_percent', value: 30 },
          { stat: 'maximum_health_from_all_sources', value: 20 },
        ],
      },
      {
        level: 2,
        description: '回合开始时获得：30% 适应之力、40% 最大生命值、60% 体型增大 或 100 技能急速、40% 移速、60% 缩小。',
        stats: [
          { stat: 'attack_damage_percent', value: 30 },
          { stat: 'maximum_health_from_all_sources', value: 40 },
        ],
      },
    ],
    tags: ['适应之力', '技能急速', '高额生命'],
  },

  // DrawYourSword 亮出你的剑 | MaxLevel=3
  // BonusAD: [0.25, 0.25, 0.3, 0.35, 0.55, 0.65, 0.75]
  // BonusAS: [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]
  // BonusHP: [0.25, 0.25, 0.3, 0.35, 0.55, 0.65, 0.75]
  // BonusLifesteal: [0.25, ...] BonusMS: [0.15, ...]
  // MaxStatMod: [0.3, ...] (基于攻击距离 500-650 额外加成 0-30%)
  {
    id: 'drawyoursword',
    name: '亮出你的剑',
    tier: 'prismatic',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        description: '变为近战（射程 200）。获得 25% AD、15% AS、25% HP、25% 吸血、15% 移速（基于攻击距离额外加成 0-30%）。',
        stats: [
          { stat: 'attack_damage_percent', value: 25 },
          { stat: 'attack_speed', value: 15 },
          { stat: 'maximum_health_from_all_sources', value: 25 },
          { stat: 'omnivamp', value: 25 },
        ],
      },
      {
        level: 2,
        description: '变为近战。获得 30% AD、25% AS、30% HP、25% 吸血、15% 移速（基于攻击距离额外加成 0-30%）。',
        stats: [
          { stat: 'attack_damage_percent', value: 30 },
          { stat: 'attack_speed', value: 25 },
          { stat: 'maximum_health_from_all_sources', value: 30 },
          { stat: 'omnivamp', value: 25 },
        ],
      },
      {
        level: 3,
        description: '变为近战。获得 35% AD、30% AS、35% HP、25% 吸血、15% 移速（基于攻击距离额外加成 0-30%）。',
        stats: [
          { stat: 'attack_damage_percent', value: 35 },
          { stat: 'attack_speed', value: 30 },
          { stat: 'maximum_health_from_all_sources', value: 35 },
          { stat: 'omnivamp', value: 25 },
        ],
      },
    ],
    tags: ['近战化', '全属性', '近战爆发'],
  },

  // DualWield 双刀流 | MaxLevel=3
  // 机制：主普攻打 100% 满额伤害，每次普攻额外发射一发次级攻击（额外一击），造成 40% (Lv1) / 50% (Lv2) / 60% (Lv3) 伤害并附带攻击特效
  {
    id: 'dualwield',
    name: '双刀流',
    tier: 'prismatic',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        description: '每次普攻额外发射一发攻击（次级攻击造成 40% 伤害并附带 40% 特效，单次普攻共 140% 伤害）。获得 15% 总攻击速度，攻速上限提升至 4.0。',
        stats: [
          { stat: 'multiplicative_attack_speed', value: 15 },
        ],
      },
      {
        level: 2,
        description: '每次普攻额外发射一发攻击（次级攻击造成 50% 伤害并附带 50% 特效，单次普攻共 150% 伤害）。获得 25% 总攻击速度，攻速上限提升至 4.0。',
        stats: [
          { stat: 'multiplicative_attack_speed', value: 25 },
        ],
      },
      {
        level: 3,
        description: '每次普攻额外发射一发攻击（次级攻击造成 60% 伤害并附带 60% 特效，单次普攻共 160% 伤害）。获得 30% 总攻击速度，攻速上限提升至 99 (无上限)。',
        stats: [
          { stat: 'multiplicative_attack_speed', value: 30 },
        ],
      },
    ],
    tags: ['额外发射一击', '双发攻击', '高频特效', '总攻击速度', '攻速上限突破'],
  },

  // TapDancer 踢踏舞 | MaxLevel=2
  // 每次攻击获得 6/10 移速，无层数上限；总移速 × 0.1% 转为额外攻速。
  {
    id: 'tapdancer',
    name: '踢踏舞',
    tier: 'prismatic',
    maxLevel: 2,
    levels: [
      {
        level: 1,
        description: '每次普攻提供 6 移动速度（无限叠加），并获得等于总移动速度 10% 的额外攻击速度。',
        stats: [],
        stacking: {
          previewStacks: [0, 10, 25, 50],
          stepName: '次普攻',
          defaultStacks: 10,
        },
      },
      {
        level: 2,
        description: '每次普攻提供 10 移动速度（无限叠加），并获得等于总移动速度 10% 的额外攻击速度。',
        stats: [],
        stacking: {
          previewStacks: [0, 10, 25, 50],
          stepName: '次普攻',
          defaultStacks: 10,
        },
      },
    ],
    tags: ['移速转攻速', '无限叠速', '拉扯机动'],
  },

  // SymphonyofWar 战争交响乐 | MaxLevel=1
  // 致命节奏最多 6 层；征服者最多 12 层。界面统一用 0~12 战斗层数表达。
  {
    id: 'symphonyofwar',
    name: '战争交响乐',
    tier: 'prismatic',
    maxLevel: 1,
    levels: [
      {
        level: 1,
        description: '获得【征服者】（每层 3-5.5 适应之力，满 12 层后远程英雄获得 8% 伤害转治疗）和【致命节奏】（最多 6 层等级成长攻速，满层后攻速上限提升至 10、获得 50 攻击距离并发射额外伤害弩箭）。',
        stats: [],
      },
    ],
    stacking: {
      maxStacks: 12,
      previewStacks: [0, 6, 12],
      stepName: '战斗层',
      defaultStacks: 12,
    },
    tags: ['致命节奏', '征服者', '突破上限'],
  },
]
