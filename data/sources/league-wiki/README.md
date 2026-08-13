# League Wiki 英雄战斗属性补充快照

`26.15/champion-combat-stats.json` 保存 26.15 版本的英雄攻击力成长和攻击速度收益系数。

数据来自 League of Legends Wiki 的结构化英雄数据，由开源项目 [`koimari/league-combat-calculator`](https://github.com/koimari/league-combat-calculator) 在 `data/champions.json` 中保存；本快照固定到提交 `e5917c4d7d94e6ac32fab5c7f120db4d00c3cfeb`，避免构建过程依赖在线 `latest` 数据。

使用这份补充数据是因为 Riot Data Dragon 16.15.1：

- 没有独立的攻击速度收益系数字段；
- 导出的所有英雄 `attackdamageperlevel` 均错误地为 `0`。

当前快照保留两个游戏机制上的合法零值：赛娜没有常规每级攻击力成长；烬的传统攻击速度收益系数为零。其他英雄的数据生成时必须能够按 key 一一匹配。

棱彩装备池不再使用 Wiki 分类快照：该分类在本版本只覆盖了部分装备。当前目录由 Riot Data Dragon 的 Arena 地图、可购买状态和棱彩价格元数据生成；本目录仅继续提供 Data Dragon 缺少的英雄战斗属性补充。
