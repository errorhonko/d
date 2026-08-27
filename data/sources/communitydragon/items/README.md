# CommunityDragon 16.15 棱彩装备参数快照

`16.15-prismatic-items.json` 从以下固定版本客户端数据提取：

- 来源：`https://raw.communitydragon.org/16.15/game/items.cdtb.bin.json`
- 对应游戏版本：26.15
- 提取范围：Data Dragon 核验后的 48 件竞技场棱彩装备
- 保留字段：客户端数值字段、tooltip 参数和计算公式结构
- 原始文件 SHA-256：`5AF19B4C0A5A4DD3F3998ADAC7925C071F10AB5F050E5A63521F5F227A5F6FB4`
- 最小化快照 SHA-256：`C649240D548217AC0C80EF0C0C4576C2C4AEDD88D9A64E17D86F5B0F1EF6BDA3`

该最小化快照用于补足 Data Dragon 中被裁成 0 或完全缺失的技能急速、适应之力、穿透、乘算攻速、主动和被动公式。重新提取时运行：

```bash
node scripts/extract-prismatic-item-source.mjs <items.cdtb.bin.json 路径>
```
