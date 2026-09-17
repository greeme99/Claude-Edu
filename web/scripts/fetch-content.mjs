#!/usr/bin/env node
/**
 * 시트 → 정적 JSON  (F-08 콘텐츠 빌드 파이프라인)
 *
 *  - 런타임에는 절대 실행되지 않습니다. 빌드 시점 1회만 (C-02)
 *  - 자격증명을 쓰지 않습니다. 공개 CSV 엔드포인트만 사용 (C-04)
 *  - 조회 실패 시 마지막 성공 스냅샷으로 빌드를 계속합니다 (FR-20)
 *
 * 사용: node scripts/fetch-content.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseCSV, toObjects } from './lib/csv.mjs';

const ROOT     = path.resolve(import.meta.dirname, '..');
const CACHE    = path.join(ROOT, '.content-cache');
const SNAPSHOT = path.join(ROOT, 'content-snapshot');

const cfg = JSON.parse(await readFile(path.join(ROOT, 'content.config.json'), 'utf8'));
const TABS = Object.keys(cfg.tabs);

function url(tab) {
  // 탭 **이름**으로 조회합니다. gid를 수집·관리할 필요가 없습니다.
  return `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq`
       + `?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
}

async function fetchTab(tab) {
  let lastErr;
  for (let attempt = 0; attempt <= cfg.retries; attempt++) {
    try {
      const ac = AbortController ? new AbortController() : null;
      const t = setTimeout(() => ac?.abort(), cfg.timeoutMs);
      const res = await fetch(url(tab), { signal: ac?.signal, redirect: 'follow' });
      clearTimeout(t);

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `HTTP ${res.status} — 시트가 공개 공유되어 있지 않습니다.\n` +
          `   시트 → 우상단 [공유] → 일반 액세스 → "링크가 있는 모든 사용자" (뷰어)\n` +
          `   콘텐츠는 어차피 공개 웹에 게시되므로 이 설정이 전제입니다 (C-03).`
        );
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      // 공유 설정이 안 됐으면 CSV 대신 로그인 HTML이 돌아옵니다
      if (/^\s*</.test(text) || text.includes('<!DOCTYPE')) {
        throw new Error(
          'CSV 대신 HTML을 받았습니다. 시트 공유 설정을 확인하세요.\n' +
          '   시트 → 공유 → 일반 액세스 → "링크가 있는 모든 사용자" (뷰어)'
        );
      }
      return text;
    } catch (e) {
      lastErr = e;
      if (attempt < cfg.retries) await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw lastErr;
}

/** 필수 헤더 존재 검사 — V-01. 없으면 즉시 빌드 실패 (FR-18) */
function assertHeaders(tab, headers) {
  const need = cfg.tabs[tab].required;
  const missing = need.filter(h => !headers.includes(h));
  if (missing.length) {
    throw new Error(
      `[${tab}] 필수 열이 없습니다: ${missing.join(', ')}\n` +
      `   현재 헤더: ${headers.join(', ')}\n` +
      `   → 시트의 헤더명을 바꾸지 마세요. 빌드는 헤더명으로 열을 찾습니다.`
    );
  }
}

/** 탭별 정규화 — 문자열을 실제 타입으로 */
const NORMALIZE = {
  lessons: r => ({ ...r, seq: Number(r.seq) }),
  terms:   r => ({ ...r,
    refs:    splitList(r.refs),
    aliases: splitList(r.aliases) }),
  templates: r => ({ ...r, level: Number(r.level) }),
  resources: r => ({ ...r, level: Number(r.level) }),
  quiz:    r => ({ ...r,
    options: r.options ? r.options.split('|').map(s => s.trim()).filter(Boolean) : [],
    answer:  r.answer ? Number(r.answer) : null })
};
const splitList = v => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(SNAPSHOT, { recursive: true });

  const results = {};
  const warnings = [];
  let usedSnapshot = false;

  for (const tab of TABS) {
    try {
      const csv = await fetchTab(tab);
      const { headers, records } = toObjects(parseCSV(csv));
      assertHeaders(tab, headers);

      const rows = records
        .filter(r => r.id)                       // id 없는 행은 무시
        .map(NORMALIZE[tab] ?? (r => r));

      results[tab] = rows;
      console.log(`  ${tab.padEnd(10)} ${String(rows.length).padStart(3)}행  ✅`);
    } catch (e) {
      // 조회 실패 → 스냅샷 폴백 (FR-20)
      const snap = path.join(SNAPSHOT, `${tab}.json`);
      if (existsSync(snap)) {
        results[tab] = JSON.parse(await readFile(snap, 'utf8'));
        usedSnapshot = true;
        warnings.push(`[${tab}] 조회 실패 → 스냅샷 사용 (${results[tab].length}행). 원인: ${e.message}`);
        console.log(`  ${tab.padEnd(10)} ${String(results[tab].length).padStart(3)}행  ⚠️  스냅샷`);
      } else {
        console.error(`\n❌ [${tab}] 조회 실패, 스냅샷도 없습니다.\n   ${e.message}\n`);
        process.exit(1);
      }
    }
  }

  for (const [tab, rows] of Object.entries(results)) {
    await writeFile(path.join(CACHE, `${tab}.json`), JSON.stringify(rows, null, 2), 'utf8');
  }

  // 전 탭 성공일 때만 스냅샷 갱신 — 실패분이 섞이면 갱신하지 않습니다
  if (!usedSnapshot) {
    for (const [tab, rows] of Object.entries(results)) {
      await writeFile(path.join(SNAPSHOT, `${tab}.json`), JSON.stringify(rows, null, 2), 'utf8');
    }
    console.log('\n  스냅샷 갱신 완료');
  }

  if (warnings.length) {
    console.log('\n⚠️  경고');
    warnings.forEach(w => console.log('   ' + w));
  }
  console.log(`\n총 ${Object.values(results).reduce((a, r) => a + r.length, 0)}행 수집`);
}

console.log(`\n시트 조회 — ${cfg.sheetId.slice(0, 12)}…\n`);
await main();
