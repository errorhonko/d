# 英雄初始属性数据

`26.15.json` 保存 26.15 版本的 173 位召唤师峡谷英雄及其简体中文名称、定位、1 级基础属性和每级成长字段。

## 字段口径

- `base`：1 级生命、资源、回复、攻击力、基础攻速、攻速收益系数、护甲、魔抗、移速、射程和暴击率。
- `growth`：Data Dragon 提供的每级成长字段；`attackSpeedPercent` 的单位是百分数。
- 英雄的实际等级属性采用非线性成长，不能简单地用 `base + growth × (level - 1)` 计算。
- 攻击力成长和攻速收益系数由固定提交的 League Wiki 加工快照补充，因为 Data Dragon 16.15.1 缺少攻速收益系数，并把所有英雄的攻击力成长错误导出为 0。
- 赛娜的攻击力成长为 0、烬的传统攻速收益系数为 0，均为合法的特殊英雄机制。

## 更新方式

Data Dragon 原始快照位于 `../../sources/riot-data-dragon/16.15.1/zh_CN/champion.json`，补充战斗属性位于 `../../sources/league-wiki/26.15/champion-combat-stats.json`。更新源文件及脚本中的版本元数据后运行：

```bash
pnpm data:champions:curate
```

生成脚本会排除以 `Jade_` 开头的模式单位，并按英雄数字 ID 排序，保证输出稳定。
