// サイトマップ(public/sitemap.xml)と、robots.txt の Sitemap 行を生成する。
//
// 使い方（Codespaces で、ビルド・デプロイの前に実行）:
//   SITE_URL=https://（正式なURL） pnpm --filter @workspace/game-guide-wiki generate:sitemap
//   （API の URL を変える場合は API_BASE_URL=https://…/api も指定）
//
// - 掲載するのは、公開APIから実際に取得できた公開データの詳細ページと、実在する静的ページだけ。
// - 管理画面・ログイン・マイページ・設定、サンプルデータで表示中のページ（/events, /rankings, /strategy）は掲載しない。
// - どれか1つでもAPIの取得に失敗したら、何も書き込まずに異常終了する（不完全なサイトマップを出さない）。
// - lastmod は、APIが返した updatedAt が正しい日時のときだけ出力する（推測した日付は出さない）。
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const siteUrl = String(process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
if (!/^https?:\/\/[^\s/]+/.test(siteUrl)) {
  console.error("エラー: SITE_URL を指定してください（例: SITE_URL=https://example.com）。正式なURLが決まるまでは実行しないでください。");
  process.exit(1);
}

const apiBase = String(process.env.API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "https://opbr-kouryaku-api.onrender.com/api").replace(/\/+$/, "");
const outDir = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : fileURLToPath(new URL("../public/", import.meta.url));

// 静的ページ（実在し、検索結果に載せてよいもの）
const STATIC_PATHS = ["/", "/characters", "/medals", "/challenge-battles", "/event-missions", "/support", "/about", "/contact", "/privacy", "/disclaimer"];

// 公開APIと詳細URL
const SOURCES = [
  { api: "/characters", detail: "/characters" },
  { api: "/medals", detail: "/medals" },
  { api: "/medal-tags", detail: "/medal-tags" },
  { api: "/challenge-battles", detail: "/challenge-battles" },
  { api: "/event-missions", detail: "/event-missions" },
];

async function fetchJson(url) {
  let lastError;
  // Renderの無料プランは起動に時間がかかるため、長めのタイムアウトと再試行を行う
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90_000), headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`  取得に失敗（${attempt}/3回目）: ${url} - ${error instanceof Error ? error.message : error}`);
    }
  }
  throw lastError;
}

const escapeXml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function validLastmod(value) {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

async function main() {
  const entries = STATIC_PATHS.map((p) => ({ loc: `${siteUrl}${p === "/" ? "/" : p}`, lastmod: null }));
  const counts = {};

  for (const source of SOURCES) {
    console.log(`取得中: ${apiBase}${source.api}`);
    const list = await fetchJson(`${apiBase}${source.api}`);
    if (!Array.isArray(list)) throw new Error(`${source.api} の応答が配列ではありません`);

    let count = 0;
    for (const item of list) {
      if (!item || typeof item.id !== "string" || !item.id) continue;
      entries.push({ loc: `${siteUrl}${source.detail}/${encodeURIComponent(item.id)}`, lastmod: validLastmod(item.updatedAt) });
      count += 1;
    }
    counts[source.detail] = count;
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => `  <url>\n    <loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}\n  </url>`)
      .join("\n") +
    "\n</urlset>\n";

  // robots.txt: 既存の Sitemap 行（コメント含む）を取り除き、正式なURLの行を追記
  const robotsPath = path.join(outDir, "robots.txt");
  let robots = "";
  try {
    robots = await readFile(robotsPath, "utf-8");
  } catch {
    robots = "User-agent: *\nAllow: /\n";
  }
  robots = robots
    .split("\n")
    .filter((line) => !/^#?\s*Sitemap:/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
  robots += `\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

  // すべて取得できた場合にだけ書き込む
  await writeFile(path.join(outDir, "sitemap.xml"), xml, "utf-8");
  await writeFile(robotsPath, robots, "utf-8");

  console.log(`\n完了: ${entries.length} URL（静的 ${STATIC_PATHS.length} 件、詳細 ${JSON.stringify(counts)}）`);
  console.log(`出力: ${path.join(outDir, "sitemap.xml")}`);
}

main().catch((error) => {
  console.error("\nサイトマップを生成できませんでした。ファイルは変更していません。");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
