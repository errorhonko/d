# 属性锻造器数据

`26.15.json` 是供计算器直接读取的 26.15 版本斗魂竞技场属性锻造器数据。

## 内容

- 属性锻造器物品 ID、价格与选择规则
- 13 个白银、13 个黄金、10 个棱彩属性碎片的具体数值
- Shardholder / Shardblade 的增幅范围、出现条件与限制
- 每项数据的单位、叠加方式和来源

## 数据口径

- 物品 ID、价格、当前名称与字段来自 CommunityDragon 客户端导出。
- 具体数值来自当前 LoL Wiki 的 `Stat Bonus (Arena)` 页面。
- “白银属性不再随机、改为固定数值”的机制由 Riot 26.9 官方版本说明交叉验证。
- Wiki 页面在 2026-08-09 更新，本文件在 2026-08-11 核验。

原始 CommunityDragon 竞技场资料保存在 `../../sources/communitydragon/arena/zh_cn.json`，未经改写，可用于追溯。
