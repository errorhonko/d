import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const CD_ARENA_ZH_URL = 'https://raw.communitydragon.org/latest/cdragon/arena/zh_cn.json'
const TARGET_PATH = path.resolve('data/sources/communitydragon/arena/zh_cn.json')
const README_PATH = path.resolve('data/sources/communitydragon/arena/README.md')

async function updateArenaSnapshot() {
  console.log(`正在从 ${CD_ARENA_ZH_URL} 下载最新快照...`)
  const response = await fetch(CD_ARENA_ZH_URL)
  if (!response.ok) {
    throw new Error(`下载失败: HTTP ${response.status} ${response.statusText}`)
  }

  const rawText = await response.text()
  const data = JSON.parse(rawText)

  if (!Array.isArray(data.augments) || data.augments.length === 0) {
    throw new Error('下载的数据无效：缺少 augments 数组')
  }

  // 格式化并写入
  const formattedJson = JSON.stringify(data, null, 4)
  fs.writeFileSync(TARGET_PATH, formattedJson, 'utf8')

  const hash = crypto.createHash('sha256').update(formattedJson).digest('hex').toUpperCase()
  const dateStr = new Date().toISOString().slice(0, 10)

  const readmeContent = `# CommunityDragon Arena 数据快照

- 文件：\`zh_cn.json\`
- 来源：<https://raw.communitydragon.org/latest/cdragon/arena/zh_cn.json>
- 抓取时间：${dateStr}（Asia/Shanghai）
- 记录数：${data.augments.length} 个强化符文
- SHA-256：\`${hash}\`

这是未经修改的上游原始快照，用于追溯名称、描述、数值字段、内部 ID、稀有度和图标路径。业务代码不应直接依赖 \`latest\` 地址；正式使用的数据应从此快照转换并经过版本验证。

CommunityDragon 是社区维护的数据提取项目，并非 Riot Games 官方 API。使用资源时需要遵守 Riot Games 的相关政策并保留数据来源说明。
`

  fs.writeFileSync(README_PATH, readmeContent, 'utf8')
  console.log(`✅ 成功更新快照！强化符文总数: ${data.augments.length}, SHA-256: ${hash}`)
}

updateArenaSnapshot().catch((err) => {
  console.error('❌ 更新失败:', err)
  process.exit(1)
})
