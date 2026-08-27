import fs from 'node:fs'

// 读取 CommunityDragon 官方数据库
const cdragon = JSON.parse(
  fs.readFileSync('data/sources/communitydragon/arena/zh_cn.json', 'utf8')
)

console.log(`CommunityDragon 总符文数: ${cdragon.augments.length}`)
console.log('====================================================')

// 输出每一个符文的全部 dataValues 与元信息
for (const aug of cdragon.augments) {
  const dvKeys = Object.keys(aug.dataValues || {})
  if (dvKeys.length === 0) continue

  console.log(`\n========================================`)
  console.log(`apiName: ${aug.apiName}`)
  console.log(`中文名: ${aug.name}`)
  console.log(`rarity: ${aug.rarity}`)
  console.log(`id: ${aug.id}`)
  console.log(`desc: ${aug.desc}`)
  console.log(`--- dataValues ---`)
  for (const key of dvKeys) {
    const vals = aug.dataValues[key]
    if (Array.isArray(vals)) {
      console.log(`  ${key}: [${vals.join(', ')}]`)
    } else {
      console.log(`  ${key}: ${JSON.stringify(vals)}`)
    }
  }
}
