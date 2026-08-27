import fs from 'node:fs'

// 读取 CommunityDragon 官方数据库
const cdragon = JSON.parse(
  fs.readFileSync('data/sources/communitydragon/arena/zh_cn.json', 'utf8')
)

// 我们关心的 AD / 普攻模型相关符文 apiName 列表
const adApiNames = [
  'BluntForce',
  'Deft',
  'GoHGoredrink',    // 渴血可能叫这个
  'Goredrink',
  'Vulnerability',
  'escAPADe',
  'EscAPADe',
  'WarmupRoutine',
  'Typhoon',
  'HeavyHitter',
  'TankItOrLeaveIt',
  'TheBrutalizer',
  'ItsCritical',
  'CriticalRhythm',
  'ThreadtheNeedle',
  'ThreadTheNeedle',
  'LightningStrikes',
  'SoulSiphon',
  'AimForTheHead',
  'Goliath',
  'MadScientist',
  'DrawYourSword',
  'DualWield',
  'TapDancer',
  'SymphonyOfWar',
  'SymphonyofWar',
  'MasterOfDuality',
  'MasterofDuality',
  'Vengeance',
  'CriticalHealing',
  'JeweledGauntlet',
  'Dematerialize',
  'Cerberus',
  'DemonsDance',
  'ComboMaster',
]

const lowerSet = new Set(adApiNames.map(n => n.toLowerCase()))

const output = []

for (const aug of cdragon.augments) {
  if (lowerSet.has(aug.apiName.toLowerCase())) {
    output.push(aug)
  }
}

// 同时找关键词匹配的
const keywordAugments = cdragon.augments.filter(aug => {
  const name = (aug.name || '').toLowerCase()
  const api = (aug.apiName || '').toLowerCase()
  return (
    name.includes('暴击') || name.includes('攻击力') || name.includes('攻速') ||
    name.includes('穿甲') || name.includes('穿透') || name.includes('吸血') ||
    name.includes('灵巧') || name.includes('大力') || name.includes('残暴') ||
    name.includes('双刀') || name.includes('律动') || name.includes('闪电') ||
    name.includes('歌利亚') || name.includes('科学狂人') || name.includes('踢踏') ||
    name.includes('交响') || name.includes('台风') || name.includes('易损') ||
    name.includes('亮出') || name.includes('虹吸') || name.includes('穿针') ||
    name.includes('强击') || name.includes('热身') || name.includes('渴血') ||
    name.includes('会心') || name.includes('关键') ||
    api.includes('blunt') || api.includes('brutalizer') || api.includes('deft') ||
    api.includes('dualwield') || api.includes('goliath') || api.includes('typhoon') ||
    api.includes('critical') || api.includes('lightning') || api.includes('thread') ||
    api.includes('escapade') || api.includes('siphon') || api.includes('sword') ||
    api.includes('tapdancer') || api.includes('symphony') || api.includes('goredrink') ||
    api.includes('heavyhitter') || api.includes('vulnerability') || api.includes('warmup')
  )
})

// 合并去重
const allMap = new Map()
for (const a of [...output, ...keywordAugments]) {
  allMap.set(a.apiName, a)
}

const rarityMap = { 0: '白银(Silver)', 1: '金色(Gold)', 2: '棱彩(Prismatic)', 4: '特殊' }

console.log(`\n=== 从 CommunityDragon 官方数据库中提取的 AD 相关符文（共 ${allMap.size} 个）===\n`)

for (const [apiName, aug] of allMap) {
  console.log(`========================================`)
  console.log(`apiName: ${apiName}`)
  console.log(`中文名: ${aug.name}`)
  console.log(`品阶: ${rarityMap[aug.rarity] || aug.rarity}`)
  console.log(`id: ${aug.id}`)
  console.log(`desc: ${aug.desc}`)
  console.log(`tooltip: ${aug.tooltip || '(无)'}`)
  const dvKeys = Object.keys(aug.dataValues || {})
  if (dvKeys.length > 0) {
    console.log(`--- dataValues (官方精确数值) ---`)
    for (const key of dvKeys) {
      const vals = aug.dataValues[key]
      if (Array.isArray(vals)) {
        console.log(`  ${key}: [${vals.join(', ')}]`)
      } else {
        console.log(`  ${key}: ${JSON.stringify(vals)}`)
      }
    }
  } else {
    console.log(`--- dataValues: (空) ---`)
  }
  console.log('')
}
