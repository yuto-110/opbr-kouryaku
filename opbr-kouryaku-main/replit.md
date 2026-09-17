# 覇道データベース

ゲーム攻略WikiのUIプロトタイプ。キャラクター・メダル・攻略記事・サポート編成をダミーデータで閲覧できます。

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/game-guide-wiki/src/data/mockData.ts` — キャラクター、メダル、記事のダミーデータ
- `artifacts/game-guide-wiki/src/components/guide-shell.tsx` — 共通レイアウトと再利用UI
- `artifacts/game-guide-wiki/src/pages/` — 画面ごとのページコンポーネント

## Architecture decisions

- データは画面コンポーネントから分離し、将来のAPI取得へ差し替えやすい形にしている。
- 詳細画面はルートパラメータからデータを切り替える再利用コンポーネントとして実装している。
- 画像は著作権保護のため幾何学プレースホルダーを使用している。

## Product

レスポンシブなゲーム攻略データベースUI。検索・絞り込み・詳細閲覧・サポート編成のダミー生成・マイページ表示に対応。

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
