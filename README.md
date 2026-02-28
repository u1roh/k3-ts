# RPN Calculator PWA

RPN電卓の実験プロジェクトです。ドメイン層とプレゼンテーション層を分離し、以下の責務分担で進めます。

- Human-led: `packages/core`（ドメインモデル/ユースケース）
- Boundary: `packages/contracts`（公開型/Facade）
- AI-led: `apps/pwa`（UI/PWA/入力処理）

## Prerequisites

- Node.js 20 以上
- npm 10 以上

## Setup

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Architecture

依存方向は固定です。

`apps/pwa -> packages/contracts -> packages/core`

`packages/core` は DOM や localStorage に依存しません。
