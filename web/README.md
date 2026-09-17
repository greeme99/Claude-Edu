# Claude Edu-Hub — web

클로드 이론·실습·용어 교육 웹앱. Next.js + MDX + Google Sheets.

## 구조

```
web/
├── content.config.json     시트 ID · 탭별 필수 열 · enum 정의
├── content/                차시 본문 MDX (Phase 01에서 이관)
│   ├── theory/
│   └── practice/
├── content-snapshot/       마지막 성공 스냅샷 — 커밋합니다 (FR-20)
├── .content-cache/         빌드 산출물 — 커밋하지 않습니다
└── scripts/
    ├── lib/csv.mjs             RFC 4180 CSV 파서
    ├── fetch-content.mjs       시트 → JSON (F-08)
    ├── validate-content.mjs    검증 게이트 (F-10)
    └── bootstrap-snapshot.mjs  최초 스냅샷 생성 (1회용)
```

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run content` | 시트 조회 + 검증. 실패 시 종료 코드 1 |
| `npm run content:fetch` | 조회만 |
| `npm run content:validate` | 검증만 |
| `npm run dev` | 콘텐츠 갱신 후 개발 서버 |
| `npm run build` | 콘텐츠 갱신·검증 후 정적 빌드 |

`prebuild`가 걸려 있어 **검증을 통과하지 못하면 빌드가 시작조차 하지 않습니다.**

## 데이터 흐름

```
Google Sheets ──(빌드 시점 CSV 조회)──┐
                                      ├──> 검증 게이트 ──> 정적 페이지
content/*.mdx ────────────────────────┘         │
                                                └── 실패 → 빌드 중단
                                                    (운영 사이트는 직전 버전 유지)
```

- 런타임에 시트를 호출하지 않습니다. 배포 산출물에 DB도 API도 시크릿도 없습니다 (C-02)
- 조회는 탭 **이름** 기준입니다. gid를 관리할 필요가 없습니다
- 열은 **헤더명**으로 찾습니다. 시트에서 열 순서를 바꿔도 안전하고, 헤더명을 바꾸면 빌드가 실패합니다

## 전제 조건

시트가 **링크 공유(뷰어)** 상태여야 합니다.
시트 → 공유 → 일반 액세스 → "링크가 있는 모든 사용자".
콘텐츠는 어차피 공개 웹에 게시되므로 이것이 전제입니다 (C-03).

## 검증 항목

| ID | 검사 | 등급 |
|---|---|---|
| V-01 | 필수 열 존재 | fail |
| V-02 | 필수 열 값 · slug 형식 | fail |
| V-03 | enum 값 · 객관식 정답 범위 | fail |
| V-04 | id · slug 유일성 | fail |
| V-05 | `<LessonLink>` → 실재 차시 | fail |
| V-06 | `<KeyTerms>` → 실재 용어 | fail |
| V-07 | `terms.refs` → 실재 차시 | fail |
| V-08 | `quiz.lesson_id` → 실재 차시 | fail |
| V-09 | 본문 내부 링크 | fail |
| V-10 | MDX 프론트매터 필수 필드 | fail |
| V-11 | MDX title ↔ 시트 title | warn |
| V-12 | 트랙 내 seq 중복 | warn |
| V-13 | `resources.url` 누락 | warn |
| V-14 | `checked_at` 180일 초과 | warn |
| V-15 | 미참조 차시 | info |

## 검증 상태 (2026-09-10)

### 콘텐츠 파이프라인
- 실조회 ✅ — 5개 탭 183행, 스냅샷 갱신
- 스냅샷 폴백 ✅ — 시트 401 상황에서 183행 복구 후 빌드 계속
- 검증 게이트 ✅ — 오류 6건 주입 시 전부 검출, 종료 코드 1

### 빌드
- `next build` ✅ — 정적 페이지 24장 생성
- 차시 페이지 18장 (이론 6 · 실습 12)
- **draft 차시 3개(TH-07, PR-13, PR-14)는 페이지가 생성되지 않음** — R-01-1 동작 확인
- 공유 JS 103 kB

### 화면
| 경로 | 상태 |
|---|---|
| `/` | ✅ 4개 영역 타일 + 최근 갱신 |
| `/curriculum` | ✅ 이론·실습 2단, 대응 차시 배지 |
| `/theory/[slug]`, `/practice/[slug]` | ✅ 차시 목록 사이드바 · 핵심 용어 · 확인 문제 · 이전/다음 |
| `/terms` | ✅ 카테고리 필터 + 검색 (클라이언트) |
| `/templates` | ✅ 카테고리별 목록 |
| `/resources` | ✅ 외부 링크 + 링크 확인 필요 표식 |

본문은 아직 비어 있습니다. 핵심 용어·확인 문제는 시트의 실제 데이터가 렌더됩니다.

## 남은 작업

- [x] 시트 링크 공유 → 실조회 확인
- [x] Next.js 앱 골격 + 디자인 토큰 (dev-docs/05)
- [ ] `npm install` 로컬 완료 대기 (마운트 폴더 I/O가 느립니다)
- [ ] MDX 파이프라인 연결 + 차시 본문 이관 (Phase 01)
- [ ] 용어 툴팁 · 통합 검색 (Phase 03)
- [ ] Vercel 연결 → Deploy Hook → GAS 트리거
