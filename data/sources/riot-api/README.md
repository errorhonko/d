# Riot API 斗魂样本

该目录保存通过 Riot Match-V5 采集并压缩后的研究样本。默认采集韩服最近 14 天、队列
`1750`、地图 `30` 的 100 场当前 3x6 斗魂比赛。旧版 2v2 斗魂使用 `1700`。

## 使用方法

1. 将 `.env.example` 复制为 `.env.local`。
2. 在 `.env.local` 中填写 `RIOT_API_KEY=RGAPI-...`。
3. 运行 `pnpm data:arena:kr`。

脚本从韩服单排王者玩家作为初始种子，再通过斗魂比赛参赛者扩展样本。原始 Match 和
Timeline 响应以 gzip 形式缓存在 `.cache/riot-api/kr/`，不会进入 Git。可复核的比赛摘要和
逐分钟属性帧输出到 `data/sources/riot-api/kr/arena-100/`。

如需跳过王者列表扫描，可在本地环境中设置逗号分隔的
`RIOT_SEED_RIOT_IDS=游戏名#标签,游戏名#标签`，脚本会先将公开 Riot ID 解析为 PUUID。

逐分钟属性帧还不是“逐回合均值”：下一步需要根据 Timeline 事件或阶段时间识别各战斗
回合的起点，再对 `armor` 和 `magicResistance` 计算中位数及分位数。
