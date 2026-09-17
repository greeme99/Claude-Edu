#!/usr/bin/env node
/**
 * 부트스트랩 — gas/setup_sheet.gs 의 시딩 배열에서 스냅샷 JSON을 생성합니다.
 *
 * 시트를 채운 것과 **같은 소스**에서 뽑으므로 초기 스냅샷으로 정확합니다.
 * 최초 1회만 실행하면 되고, 이후에는 fetch-content 가 성공할 때마다 스냅샷을 갱신합니다.
 *
 * 사용: node scripts/bootstrap-snapshot.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const GS   = path.resolve(ROOT, '..', 'gas', 'setup_sheet.gs');
const OUT  = path.join(ROOT, 'content-snapshot');

const HEADERS = {
  lessons:   ['id','track','seq','title','slug','status','updated_at','note'],
  terms:     ['id','ko','en','category','definition','refs','aliases','status'],
  templates: ['id','category','title','level','body','usage','expected','source','status'],
  resources: ['id','category','title','url','level','lang','note','checked_at'],
  quiz:      ['id','lesson_id','type','question','options','answer','hint']
};
const VARS = { lessons:'LESSONS', terms:'TERMS', templates:'TEMPLATES', resources:'RESOURCES', quiz:'QUIZ' };

const NORMALIZE = {
  lessons:   r => ({ ...r, seq: Number(r.seq) }),
  terms:     r => ({ ...r, refs: split(r.refs), aliases: split(r.aliases) }),
  templates: r => ({ ...r, level: Number(r.level) }),
  resources: r => ({ ...r, level: Number(r.level) }),
  quiz:      r => ({ ...r,
    options: r.options ? String(r.options).split('|').map(s => s.trim()).filter(Boolean) : [],
    answer:  r.answer !== '' && r.answer != null ? Number(r.answer) : null })
};
const split = v => (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

const src = await readFile(GS, 'utf8');
await mkdir(OUT, { recursive: true });

let total = 0;
for (const [tab, varName] of Object.entries(VARS)) {
  const m = src.match(new RegExp(`var ${varName} = \\[([\\s\\S]*?)\\n\\];`));
  if (!m) { console.error(`❌ ${varName} 를 찾을 수 없습니다`); process.exit(1); }

  const arrays = eval(`[${m[1]}]`);
  const headers = HEADERS[tab];
  const norm = NORMALIZE[tab];

  const rows = arrays.map((arr, i) => {
    const o = { __row: i + 2 };
    headers.forEach((h, j) => { o[h] = arr[j] ?? ''; });
    return norm(o);
  });

  await writeFile(path.join(OUT, `${tab}.json`), JSON.stringify(rows, null, 2), 'utf8');
  console.log(`  ${tab.padEnd(10)} ${String(rows.length).padStart(3)}행`);
  total += rows.length;
}
console.log(`\n✅ 스냅샷 생성 완료 — 총 ${total}행`);
