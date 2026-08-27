import fs from 'node:fs'

const rawLuaPath = 'C:/Users/admin/.gemini/antigravity/brain/ab6de628-2165-4c23-9dae-4e14e3c74baa/.system_generated/steps/392/content.md'
const content = fs.readFileSync(rawLuaPath, 'utf8')

// 正则提取 Lua 表中每个条目的 raw description
const regex = /\["([^"]+)"\]\s*=\s*\{([\s\S]*?)\n\t\},/g
let match
const result = {}

while ((match = regex.exec(content)) !== null) {
  const name = match[1]
  const body = match[2]
  const descMatch = body.match(/\["description"\]\s*=\s*"([^"]+)"/)
  const tierMatch = body.match(/\["tier"\]\s*=\s*"([^"]+)"/)
  result[name] = {
    tier: tierMatch ? tierMatch[1] : '',
    rawDesc: descMatch ? descMatch[1] : '',
  }
}

const adAugmentsList = [
  'Blunt Force',
  'Deft',
  'Goredrink',
  'Vulnerability',
  'EscAPADe',
  'Warmup Routine',
  'Typhoon',
  'The Brutalizer',
  'It\'s Critical',
  'Critical Rhythm',
  'Thread the Needle',
  'Lightning Strikes',
  'Soul Siphon',
  'Aim for the Head',
  'Goliath',
  'Mad Scientist',
  'Draw Your Sword',
  'Dual Wield',
  'Tap Dancer',
  'Symphony of War',
  'Master of Duality',
  'Heavy Hitter',
  'Tank It Or Leave It',
]

console.log('=== 官方 Wiki Lua 数据库中的精确 AD 强化符文及其原始公式 ===')
for (const name of adAugmentsList) {
  const data = result[name]
  if (data) {
    console.log(`\n----------------------------------------\n[${data.tier}] ${name}`)
    console.log('Raw:', data.rawDesc)
  } else {
    console.log(`\n[Not Found in wiki table]: ${name}`)
  }
}
