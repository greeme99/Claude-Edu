#!/usr/bin/env node
/**
 * 빌드 검증 게이트  (F-10)
 *
 * 이 프로젝트에서 가장 중요한 안전장치입니다.
 * fail 등급이 하나라도 걸리면 빌드를 중단하고, 운영 사이트는 직전 성공 버전을 유지합니다.
 *
 * 원칙
 *  - R-10-1  첫 오류에서 멈추지 않고 위반 항목을 **전부** 나열한 뒤 종료
 *  - R-10-2  오류 메시지에 탭명·행 번호·열명·기대값 포함
 *  - R-10-3  CI와 로컬에서 동일하게 동작
 *
 * 사용: node scripts/validate-content.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT    = path.resolve(import.meta.dirname, '..');
const CACHE   = path.join(ROOT, '.content-cache');
const CONTENT = path.join(ROOT, 'content');

const cfg = JSON.parse(await readFile(path.join(ROOT, 'content.config.json'), 'utf8'));

const fails = [], warns = [], infos = [];
const fail = (id, msg) => fails.push({ id, msg });
const warn = (id, msg) => warns.push({ id, msg });
const info = (id, msg) => infos.push({ id, msg });

/* ── 데이터 로드 ── */
const D = {};
for (const tab of Object.keys(cfg.tabs)) {
  const p = path.join(CACHE, `${tab}.json`);
  if (!existsSync(p)) { fail('V-00', `.content-cache/${tab}.json 이 없습니다. 먼저 fetch-content 를 실행하세요.`); continue; }
  D[tab] = JSON.parse(await readFile(p, 'utf8'));
}
if (fails.length) { report(); process.exit(1); }

const lessonIds = new Set(D.lessons.map(l => l.id));
const termIds   = new Set(D.terms.map(t => t.id));

/* ── V-02 필수 열 값 ── */
for (const [tab, spec] of Object.entries(cfg.tabs)) {
  for (const r of D[tab]) {
    for (const col of spec.required) {
      const v = r[col];
      const empty = v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));
      // draft 차시는 updated_at 이 비어 있어도 정상
      if (empty && !(tab === 'lessons' && col === 'updated_at' && r.status === 'draft')) {
        fail('V-02', `${tab} ${r.__row ?? '?'}행 [${r.id}] · ${col} 이 비어 있습니다`);
      }
    }
  }
}

/* ── V-03 enum ── */
for (const [key, allowed] of Object.entries(cfg.enums)) {
  const [tab, col] = key.split('.');
  if (!D[tab]) continue;
  for (const r of D[tab]) {
    const v = String(r[col] ?? '');
    if (v === '') continue;
    if (!allowed.includes(v)) {
      fail('V-03', `${tab} ${r.__row ?? '?'}행 [${r.id}] · ${col}="${v}" — 허용값: ${allowed.join(', ')}`);
    }
  }
}

/* ── V-04 id 유일성 ── */
for (const [tab, rows] of Object.entries(D)) {
  const seen = new Map();
  for (const r of rows) {
    if (seen.has(r.id)) fail('V-04', `${tab} · id "${r.id}" 중복 (${seen.get(r.id)}행, ${r.__row}행)`);
    else seen.set(r.id, r.__row);
  }
}

/* ── V-07 terms.refs → lessons.id ── */
for (const t of D.terms) {
  for (const ref of t.refs ?? []) {
    if (!lessonIds.has(ref)) fail('V-07', `terms ${t.__row}행 [${t.id}] · refs "${ref}" — 존재하지 않는 차시 ID`);
  }
}

/* ── V-08 quiz.lesson_id → lessons.id ── */
for (const q of D.quiz) {
  if (!lessonIds.has(q.lesson_id)) fail('V-08', `quiz ${q.__row}행 [${q.id}] · lesson_id "${q.lesson_id}" — 존재하지 않는 차시 ID`);
}

/* ── 객관식 정답 범위 ── */
for (const q of D.quiz) {
  if (q.type !== 'choice') continue;
  const n = (q.options ?? []).length;
  if (n < 2) fail('V-03', `quiz ${q.__row}행 [${q.id}] · choice 인데 선택지가 ${n}개입니다`);
  else if (!(q.answer >= 1 && q.answer <= n)) fail('V-03', `quiz ${q.__row}행 [${q.id}] · answer=${q.answer} — 1~${n} 범위를 벗어남`);
}

/* ── slug 중복 · 형식 ── */
const slugs = new Map();
for (const l of D.lessons) {
  if (!/^[a-z0-9-]+$/.test(l.slug)) fail('V-02', `lessons ${l.__row}행 [${l.id}] · slug "${l.slug}" — 영문 소문자·숫자·하이픈만 허용`);
  if (slugs.has(l.slug)) fail('V-04', `lessons · slug "${l.slug}" 중복 (${slugs.get(l.slug)}행, ${l.__row}행)`);
  else slugs.set(l.slug, l.__row);
}

/* ── MDX 검사 (V-05 · V-06 · V-09 · V-10 · V-11) ── */
let mdxCount = 0;
if (existsSync(CONTENT)) {
  for (const track of ['theory', 'practice']) {
    const dir = path.join(CONTENT, track);
    if (!existsSync(dir)) continue;
    for (const file of (await readdir(dir)).filter(f => f.endsWith('.mdx'))) {
      mdxCount++;
      const rel = `content/${track}/${file}`;
      const src = await readFile(path.join(dir, file), 'utf8');

      // V-10 프론트매터 필수 필드
      const fm = src.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) { fail('V-10', `${rel} · 프론트매터가 없습니다`); continue; }
      const meta = Object.fromEntries(
        fm[1].split('\n').filter(l => l.includes(':'))
             .map(l => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim().replace(/^["']|["']$/g, '')]));
      // 소유권 분리: 시트가 id·track·seq·title·slug·status·updated_at 을,
      // MDX 가 summary·goals·keyQuestion 을 가집니다. 중복 필드를 두지 않습니다.
      for (const k of ['id', 'summary']) {
        if (!meta[k]) fail('V-10', `${rel} · 프론트매터 "${k}" 누락`);
      }
      if (meta.id && !lessonIds.has(meta.id)) fail('V-10', `${rel} · id "${meta.id}" 가 lessons 탭에 없습니다`);
      if (!/^goals:/m.test(fm[1])) warn('V-11', `${rel} · goals 가 없습니다 — 학습 목표 블록이 렌더되지 않습니다`);

      // 시트에 있는 필드를 MDX 가 중복 선언하면 불일치 위험 (경고)
      for (const dup of ['title', 'slug', 'seq', 'track', 'status']) {
        if (meta[dup]) warn('V-11', `${rel} · 프론트매터 "${dup}" 은 시트가 소유합니다. MDX 에서 제거하세요`);
      }
      // MDX 는 있는데 시트에 대응 차시가 draft 이면 페이지가 생성되지 않습니다
      const sheetLesson = D.lessons.find(l => l.id === meta.id);
      if (sheetLesson && sheetLesson.status !== 'published') {
        warn('V-11', `${rel} · 본문이 있지만 시트 status="${sheetLesson.status}" 라 페이지가 생성되지 않습니다`);
      }

      // V-05 LessonLink
      for (const m of src.matchAll(/<LessonLink\s+id=["']([^"']+)["']/g)) {
        if (!lessonIds.has(m[1])) fail('V-05', `${rel} · <LessonLink id="${m[1]}"> — 존재하지 않는 차시 ID`);
      }
      // V-06 KeyTerms
      for (const m of src.matchAll(/<KeyTerms\s+ids=\{?\[([^\]]+)\]/g)) {
        for (const raw of m[1].split(',')) {
          const id = raw.trim().replace(/^["']|["']$/g, '');
          if (id && !termIds.has(id)) fail('V-06', `${rel} · <KeyTerms> "${id}" — 존재하지 않는 용어 ID`);
        }
      }
      // V-09 내부 링크
      for (const m of src.matchAll(/\]\((\/(?:theory|practice)\/[a-z0-9-]+)\)/g)) {
        const slug = m[1].split('/').pop();
        if (!slugs.has(slug)) fail('V-09', `${rel} · 내부 링크 ${m[1]} — 존재하지 않는 경로`);
      }
    }
  }
}

/* ── V-12 seq 중복 (warn) ── */
for (const track of ['theory', 'practice']) {
  const seen = new Map();
  for (const l of D.lessons.filter(x => x.track === track)) {
    if (seen.has(l.seq)) warn('V-12', `lessons · ${track} seq ${l.seq} 중복 (${seen.get(l.seq)}행, ${l.__row}행)`);
    else seen.set(l.seq, l.__row);
  }
}

/* ── V-13 · V-14 resources (warn) ── */
const staleMs = cfg.staleResourceDays * 86400000;
for (const r of D.resources) {
  if (!r.url) warn('V-13', `resources ${r.__row}행 [${r.id}] · url 이 비어 있습니다`);
  if (r.checked_at) {
    const age = Date.now() - new Date(r.checked_at).getTime();
    if (age > staleMs) warn('V-14', `resources ${r.__row}행 [${r.id}] · checked_at ${r.checked_at} — ${cfg.staleResourceDays}일 초과, 링크 확인 필요`);
  }
}

/* ── V-15 미참조 (info) ── */
const usedLessons = new Set(D.terms.flatMap(t => t.refs ?? []));
const unrefLessons = D.lessons.filter(l => !usedLessons.has(l.id));
if (unrefLessons.length) info('V-15', `어떤 용어도 참조하지 않는 차시 ${unrefLessons.length}개: ${unrefLessons.map(l => l.id).join(', ')}`);

/* ── 리포트 ── */
function report() {
  const line = '─'.repeat(64);
  if (fails.length) {
    console.error(`\n❌ 빌드 중단 — 검증 실패 ${fails.length}건\n${line}`);
    fails.forEach(f => console.error(`  [${f.id}] ${f.msg}`));
    console.error(line);
  }
  if (warns.length) {
    console.warn(`\n⚠️  경고 ${warns.length}건 (빌드는 계속됩니다)`);
    warns.forEach(w => console.warn(`  [${w.id}] ${w.msg}`));
  }
  if (infos.length) {
    console.log(`\nℹ️  참고`);
    infos.forEach(i => console.log(`  [${i.id}] ${i.msg}`));
  }
}

report();

if (fails.length) process.exit(1);

const total = Object.values(D).reduce((a, r) => a + r.length, 0);
console.log(`\n✅ 검증 통과 — 시트 ${total}행 · MDX ${mdxCount}편`);
console.log(`   차시 ${D.lessons.length} · 용어 ${D.terms.length} · 템플릿 ${D.templates.length} · 자료 ${D.resources.length} · 문항 ${D.quiz.length}\n`);
