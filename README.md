# 斗魂锻体计算器

一个用于《英雄联盟》斗魂竞技场“斗魂锻体”玩法的网页计算器。当前仓库已完成前端工程初始化，业务功能将按 [PLAN.md](./PLAN.md) 逐步实现。

## 技术栈

- React 19 + TypeScript
- Vite 8
- pnpm 11
- Oxlint

## 环境要求

- Node.js 24 或更高版本
- pnpm 11 或更高版本

项目根目录提供了 `.nvmrc`。使用 nvm-windows 时可先执行 `nvm use 24`；未安装 pnpm 时可执行 `corepack enable`。

## 本地开发

```bash
pnpm install
pnpm dev
```

默认访问地址为 `http://localhost:5173`。

## 工程检查

```bash
pnpm lint
pnpm build
pnpm preview
```

`pnpm-lock.yaml` 应提交到版本库，以保证团队和部署环境使用一致的依赖版本。
