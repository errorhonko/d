import fs from 'node:fs'

const filePath = 'C:/Users/admin/.gemini/antigravity/brain/ab6de628-2165-4c23-9dae-4e14e3c74baa/.system_generated/steps/392/content.md'
const content = fs.readFileSync(filePath, 'utf8')

// 正则匹配 Lua table 中的每个条目
const regex = /\["([^"]+)"\]\s*=\s*\{([\s\S]*?)\n\t\},/g
let match
const allAugments = []

while ((match = regex.exec(content)) !== null) {
  const name = match[1]
  const body = match[2]

  const descMatch = body.match(/\["description"\]\s*=\s*"([^"]+)"/)
  const tierMatch = body.match(/\["tier"\]\s*=\s*"([^"]+)"/)

  allAugments.push({
    name,
    tier: tierMatch ? tierMatch[1] : 'Unknown',
    description: descMatch ? descMatch[1] : '',
  })
}

console.log(`成功提取官方 Wiki 数据库中的 Augments 总数: ${allAugments.length}`)

// 保存为 JSON
fs.writeFileSync('data/sources/league-wiki/official-augments.json', JSON.stringify(allAugments, null, 2), 'utf8')

allAugments.forEach((a) => {
  const cleanDesc = a.description.replace(/\{\{[^}]+\}\}/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  console.log(`[${a.tier}] ${a.name}: ${cleanDesc}`)
})
