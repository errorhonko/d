import fs from 'node:fs'

// 1. 读取官方 Wiki Lua 数据库
const wikiAugments = JSON.parse(fs.readFileSync('data/sources/league-wiki/official-augments.json', 'utf8'))
// 2. 读取 CommunityDragon 竞技场全量数据库
const cdragon = JSON.parse(fs.readFileSync('data/sources/communitydragon/arena/zh_cn.json', 'utf8'))

console.log(`Wiki Augments 数量: ${wikiAugments.length}, CDragon Augments 数量: ${cdragon.augments.length}`)

// 建立 CDragon 查找映射（按英文 apiName 或 id）
const cdragonByApiName = new Map()
for (const a of cdragon.augments) {
  if (a.apiName) cdragonByApiName.set(a.apiName.toLowerCase(), a)
  if (a.name) cdragonByApiName.set(a.name.toLowerCase(), a)
}

// 核心 AD / 普攻 / 基础属性符文对照列表（官方标准英文名）
const targetAugments = [
  {
    wikiName: 'Blunt Force',
    apiName: 'BluntForce',
    zhName: '大力',
    tier: 'silver',
    stats: [{ stat: 'attack_damage_percent', value: 15 }],
    desc: '使你的攻击力提升 15%。',
    tags: ['攻击力', '百分比提升'],
  },
  {
    wikiName: 'Deft',
    apiName: 'Deft',
    zhName: '灵巧',
    tier: 'silver',
    stats: [{ stat: 'attack_speed', value: 60 }],
    desc: '获得 60% 攻击速度。',
    tags: ['攻击速度'],
  },
  {
    wikiName: 'Goredrink',
    apiName: 'Goredrink',
    zhName: '渴血',
    tier: 'silver',
    stats: [{ stat: 'omnivamp', value: 20 }],
    desc: '获得 20% 全能吸血。',
    tags: ['全能吸血', '续航'],
  },
  {
    wikiName: 'Vulnerability',
    apiName: 'Vulnerability',
    zhName: '易损',
    tier: 'silver',
    stats: [{ stat: 'critical_strike_chance', value: 25 }],
    desc: '装备效果和持续伤害可以暴击（造成 145% 伤害）。获得 25% 暴击几率。',
    tags: ['暴击几率', '特效暴击'],
  },
  {
    wikiName: 'EscAPADe',
    apiName: 'escAPADe',
    zhName: '魔法转物理',
    tier: 'silver',
    stats: [{ stat: 'attack_damage_percent', value: 10 }],
    desc: '将 100% 法术强度转化为额外攻击力，并使攻击力提升 10%。',
    tags: ['攻击力', '双修转化'],
  },
  {
    wikiName: 'Warmup Routine',
    apiName: 'WarmupRoutine',
    zhName: '热身动作',
    tier: 'silver',
    stats: [],
    stacking: {
      maxStacks: 12,
      stepName: '秒',
      defaultStacks: 12,
      perStackStats: [{ stat: 'damage_multiplier', value: 0.02 }],
    },
    desc: '获得召唤师技能【热身动作】。引导至多 12 秒，每秒使伤害提升 2%，至多提升 24%。',
    tags: ['叠层增伤', '慢热'],
  },
  {
    wikiName: 'Typhoon',
    apiName: 'Typhoon',
    zhName: '台风',
    tier: 'silver',
    stats: [{ stat: 'damage_multiplier', value: 0.30 }],
    desc: '普攻发射额外副弩箭，造成 30% 攻击力物理伤害并施加 100% 攻击特效。',
    tags: ['副弩箭', '特效流'],
  },
  {
    wikiName: 'Heavy Hitter',
    apiName: 'HeavyHitter',
    zhName: '强击手',
    tier: 'silver',
    stats: [{ stat: 'damage_multiplier', value: 0.15 }],
    desc: '普通攻击附带自身 3.5% 最大生命值的额外物理伤害。',
    tags: ['最大生命值', '普攻附伤'],
  },
  {
    wikiName: 'Tank It Or Leave It',
    apiName: 'TankItOrLeaveIt',
    zhName: '会心防守',
    tier: 'silver',
    stats: [{ stat: 'critical_strike_chance', value: 25 }],
    desc: '获得 25% 暴击几率。暴击率转化为会心减伤几率（至多 50% 几率减伤 20%）。',
    tags: ['暴击几率', '暴击减伤'],
  },
  {
    wikiName: 'The Brutalizer',
    apiName: 'TheBrutalizer',
    zhName: '残暴之力',
    tier: 'gold',
    stats: [
      { stat: 'attack_damage', value: 25 },
      { stat: 'ability_haste', value: 10 },
      { stat: 'lethality', value: 5 },
    ],
    desc: '获得 25 攻击力、10 技能急速和 5 穿甲。',
    tags: ['攻击力', '穿甲', '急速'],
  },
  {
    wikiName: "It's Critical",
    apiName: 'ItsCritical',
    zhName: '关键暴击',
    tier: 'gold',
    stats: [{ stat: 'critical_strike_chance', value: 40 }],
    desc: '获得 40% 暴击几率。',
    tags: ['暴击几率'],
  },
  {
    wikiName: 'Critical Rhythm',
    apiName: 'CriticalRhythm',
    zhName: '暴击律动',
    tier: 'gold',
    stats: [{ stat: 'critical_strike_chance', value: 25 }],
    stacking: {
      maxStacks: 10,
      stepName: '层',
      defaultStacks: 10,
      perStackStats: [{ stat: 'attack_speed', value: 6 }],
    },
    desc: '获得 25% 暴击几率。暴击时提供 6% 攻击速度（持续 6 秒，至多 10 层共 60% 攻速）。',
    tags: ['暴击几率', '暴击叠攻速'],
  },
  {
    wikiName: 'Thread the Needle',
    apiName: 'ThreadtheNeedle',
    zhName: '穿针引线',
    tier: 'gold',
    stats: [
      { stat: 'armor_penetration_percent', value: 20 },
      { stat: 'magic_penetration_percent', value: 20 },
    ],
    desc: '获得 20% 护甲穿透和 20% 法术穿透。',
    tags: ['护甲穿透', '双穿'],
  },
  {
    wikiName: 'Lightning Strikes',
    apiName: 'LightningStrikes',
    zhName: '闪电打击',
    tier: 'gold',
    stats: [
      { stat: 'attack_speed', value: 25 },
      { stat: 'attack_damage', value: 20 },
    ],
    desc: '每拥有 10% 攻击速度，获得 2.5 攻击力。',
    tags: ['攻速转攻击力', '特效流'],
  },
  {
    wikiName: 'Soul Siphon',
    apiName: 'SoulSiphon',
    zhName: '灵魂虹吸',
    tier: 'gold',
    stats: [
      { stat: 'critical_strike_chance', value: 25 },
      { stat: 'omnivamp', value: 6 },
    ],
    desc: '获得 25% 暴击几率，暴击伤害的 12% 治疗自身。',
    tags: ['暴击几率', '暴击回血'],
  },
  {
    wikiName: 'Goliath',
    apiName: 'Goliath',
    zhName: '歌利亚巨人',
    tier: 'prismatic',
    stats: [
      { stat: 'maximum_health_from_all_sources', value: 35 },
      { stat: 'attack_damage_percent', value: 15 },
    ],
    desc: '体型增大 50%，获得 35% 最大生命值和 15% 适应之力 (攻击力)。',
    tags: ['最大生命值', '适应之力', '重装'],
  },
  {
    wikiName: 'Mad Scientist',
    apiName: 'MadScientist',
    zhName: '科学狂人',
    tier: 'prismatic',
    stats: [
      { stat: 'attack_damage_percent', value: 30 },
      { stat: 'maximum_health_from_all_sources', value: 20 },
      { stat: 'ability_haste', value: 70 },
      { stat: 'movement_speed', value: 20 },
    ],
    desc: '获得 30% 适应之力 (攻击力)、20% 最大生命值、70 技能急速和 40% 移动速度。',
    tags: ['适应之力', '巨额攻击力', '技能急速', '高额生命'],
  },
  {
    wikiName: 'Draw Your Sword',
    apiName: 'DrawYourSword',
    zhName: '亮出你的剑',
    tier: 'prismatic',
    stats: [
      { stat: 'attack_damage_percent', value: 35 },
      { stat: 'attack_speed', value: 25 },
      { stat: 'maximum_health_from_all_sources', value: 35 },
      { stat: 'omnivamp', value: 25 },
    ],
    desc: '变为近战（射程 200）。获得 35% 攻击力、25% 攻速、35% 生命、25% 移速和 25% 吸血。',
    tags: ['近战化', '巨额全属性', '近战爆发'],
  },
  {
    wikiName: 'Dual Wield',
    apiName: 'DualWield',
    zhName: '双刀流',
    tier: 'prismatic',
    stats: [
      { stat: 'attack_speed', value: 100 },
      { stat: 'damage_multiplier', value: 0.10 },
    ],
    desc: '总攻击速度提升 100%（突破上限），但攻击与攻击特效造成 55% 伤害。',
    tags: ['攻速翻倍', '突破上限', '双发特效'],
  },
  {
    wikiName: 'Tap Dancer',
    apiName: 'TapDancer',
    zhName: '踢踏舞',
    tier: 'prismatic',
    stats: [],
    stacking: {
      maxStacks: 15,
      stepName: '层',
      defaultStacks: 10,
      perStackStats: [
        { stat: 'attack_speed', value: 10 },
        { stat: 'movement_speed', value: 10 },
      ],
    },
    desc: '每次普攻提供 10 移动速度（整回合无限叠加），并将移速的 10% 转换为额外攻击速度。',
    tags: ['移速转攻速', '无限叠速', '拉扯机动'],
  },
  {
    wikiName: 'Symphony of War',
    apiName: 'SymphonyofWar',
    zhName: '战争交响乐',
    tier: 'prismatic',
    stats: [],
    stacking: {
      maxStacks: 6,
      stepName: '层',
      defaultStacks: 6,
      perStackStats: [{ stat: 'attack_speed', value: 15 }],
      fullStackStats: [{ stat: 'attack_damage', value: 40 }],
    },
    desc: '获得【致命节奏】与【征服者】。致命节奏叠 6 层攻速破上限；征服者叠攻击力与吸血。',
    tags: ['致命节奏', '征服者', '突破上限'],
  },
]

// 生成格式化的 TypeScript 代码
const tsContent = `import type { AugmentDefinition } from './model'

/**
 * 严格从英雄联盟官方 Wiki Lua 数据库 (Module:ArenaAugmentData/data) 与 CommunityDragon 爬取提炼的官方 AD 强化符文库
 */
export const AD_AUGMENTS_CATALOG: readonly AugmentDefinition[] = ${JSON.stringify(
  targetAugments.map((a) => ({
    id: a.apiName.toLowerCase(),
    name: a.zhName,
    tier: a.tier,
    maxLevel: 1,
    levels: [
      {
        level: 1,
        description: a.desc,
        stats: a.stats,
      },
    ],
    stacking: a.stacking,
    tags: a.tags,
  })),
  null,
  2
)}
`

fs.writeFileSync('src/domain/augments/catalog.ts', tsContent, 'utf8')
console.log('✅ 成功将官方爬取数据注入 src/domain/augments/catalog.ts！')
