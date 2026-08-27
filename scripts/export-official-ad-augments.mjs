import fs from 'node:fs'

const cdragon = JSON.parse(
  fs.readFileSync('data/sources/communitydragon/arena/zh_cn.json', 'utf8')
)

// 精确匹配我们关心的 AD 符文
const targets = [
  'WarmupRoutine', 'BluntForce', 'Deft', 'Vulnerability',
  'Typhoon', 'HeavyHitter', 'TankItOrLeaveIt',
  'TheBrutalizer', 'ItsCritical', 'ThreadtheNeedle',
  'LightningStrikes', 'SoulSiphon', 'AimForTheHead',
  'CriticalHealing', 'Vengeance',
  'Goliath', 'MadScientist', 'DrawYourSword', 'DualWield',
  'TapDancer', 'SymphonyOfWar', 'MasterOfDuality',
  'JeweledGauntlet', 'Cerberus',
]

const lowerSet = new Set(targets.map(t => t.toLowerCase()))

// 也搜索所有没匹配到的、含有 AD 相关字段的符文
const adRelatedKeys = ['AD', 'ADAmp', 'BonusAD', 'AttackSpeed', 'AS', 'BonusAS',
  'CritChance', 'CritDamage', 'Lethality', 'ArmorPen', 'Lifesteal', 'Omnivamp',
  'HealthPercent', 'BonusHP', 'AdaptiveForce', 'AFAmp']

const result = []

for (const aug of cdragon.augments) {
  const api = aug.apiName.toLowerCase()
  const dvKeys = Object.keys(aug.dataValues || {})

  // 是否是我们目标列表中的
  const isTarget = lowerSet.has(api)
  // 是否含有 AD 相关 dataValue 字段
  const hasAdKey = dvKeys.some(k => adRelatedKeys.some(ak => k.toLowerCase().includes(ak.toLowerCase())))

  if (isTarget || hasAdKey) {
    result.push(aug)
  }
}

// 直接输出为 JSON 存档
const output = result.map(aug => ({
  apiName: aug.apiName,
  name: aug.name,
  rarity: aug.rarity,
  id: aug.id,
  desc: aug.desc,
  tooltip: aug.tooltip,
  dataValues: aug.dataValues,
}))

fs.writeFileSync(
  'data/sources/communitydragon/arena/ad-augments-official-dump.json',
  JSON.stringify(output, null, 2),
  'utf8'
)

console.log(`✅ 导出了 ${output.length} 个 AD 相关符文的完整官方 dataValues 到 ad-augments-official-dump.json`)

// 同时打印精简摘要
const rarityMap = { 0: 'Silver', 1: 'Gold', 2: 'Prismatic', 4: 'GoH' }
for (const a of output) {
  console.log(`\n[${rarityMap[a.rarity] || a.rarity}] ${a.apiName} (${a.name}) MaxLevel=${(a.dataValues.MaxLevel||[])[0] || '?'}`)
  for (const [k, v] of Object.entries(a.dataValues)) {
    if (k === 'MaxLevel') continue
    if (Array.isArray(v)) {
      // 只打印有意义的值（去重简化）
      const unique = [...new Set(v.map(x => Math.round(x * 10000) / 10000))]
      console.log(`  ${k}: ${JSON.stringify(unique)} (raw 7-slot: [${v.map(x => Math.round(x*10000)/10000).join(', ')}])`)
    } else {
      console.log(`  ${k}: ${JSON.stringify(v)}`)
    }
  }
}
