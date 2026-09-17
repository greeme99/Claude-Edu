# GAS — 콘텐츠 시트 자동화

| 항목 | 값 |
|---|---|
| 대상 시트 | **Claude-Edu** |
| 시트 ID | `1qvRauYKcMoJWM9YwOJmJrYNqAGwJdSkvMbFksIcC6Ms` |
| 위치 | 내 드라이브 › S4.Claude_Edu |
| 소유자 | greeme99@gmail.com |

> 폴더를 옮기거나 시트 이름을 바꿔도 **파일 ID는 변하지 않으므로** 아무것도 깨지지 않습니다.
> 빌드가 깨지는 경우는 **탭 이름이나 헤더명을 바꿀 때** 뿐이고, 그때는 빌드 검증(V-01)이 배포를 막습니다.

---

## 1. 시트 구축 — 지금 실행

1. 시트 열기 → **확장 프로그램 › Apps Script**
2. `setup_sheet.gs` 전체를 붙여넣고 저장
3. 함수 목록에서 **`setupAll`** 선택 → 실행 → 권한 승인

실행 결과:

| 탭 | 행 | 내용 |
|---|---|---|
| `lessons` | 21 | 이론 7 + 실습 14. ID 불변, seq는 표시 순서 |
| `terms` | 71 | 부록 A 전량. 차시 참조 3건은 실제 서술 위치로 교정함 |
| `templates` | 25 | 메타만. `body`는 Phase 01에서 입력 → 전부 `draft` |
| `resources` | 41 | 부록 C 전량 |
| `quiz` | 25 | 이론 7차시 확인 문제. 실습 문항은 Phase 01 |

헤더 고정·열 너비·탭 색·드롭다운 유효성 검사가 함께 적용됩니다.

> ⚠️ `setupAll`은 **기존 내용을 지우고 다시 씁니다.** 운영 중인 시트에는 실행하지 마세요.
> 구조만 손보려면 `setupStructureOnly`를 쓰세요.

---

## 2. 웹에 게시 — 구축 직후

빌드가 시트를 읽으려면 CSV 게시가 필요합니다. **서비스 계정 키를 쓰지 않는 이유가 이것입니다.**

1. **파일 › 공유 › 웹에 게시**
2. 탭 5개를 각각 **쉼표로 구분된 값(.csv)** 으로 게시
3. 각 URL을 리포의 `.env` 또는 `content.config.json`에 기록

```
SHEET_ID=1qvRauYKcMoJWM9YwOJmJrYNqAGwJdSkvMbFksIcC6Ms
TAB_LESSONS_GID=...
TAB_TERMS_GID=...
```

---

## 3. 자동 재배포 — Vercel 연결 후

리포 스캐폴딩과 Vercel 연결이 끝난 뒤에 설정합니다.

1. Vercel → 프로젝트 → Settings → Git → **Deploy Hooks**에서 훅 생성
2. Apps Script 편집기에서 실행:
   ```js
   setDeployHook('https://api.vercel.com/v1/integrations/deploy/...')
   ```
3. `installOnChangeTrigger()` 실행
4. `testDeployHook()` 으로 연결 확인

동작:

| 항목 | 값 |
|---|---|
| 트리거 | 시트 변경 시 (`onChange`) |
| 디바운스 | **5분** — 연속 편집을 1회 배포로 병합 (R-09-1) |
| 재시도 | 3회, 2초 간격 |
| 실패 시 | 소유자에게 메일 발송. **운영 사이트는 직전 성공 버전 유지** |

Deploy Hook URL은 스크립트 속성에 저장되며 **셀에 두지 않습니다** (R-09-2).

---

## 4. 함수 목록

| 함수 | 용도 | 실행 시점 |
|---|---|---|
| `setupAll()` | 구조 + 초기 데이터 전체 구축 | 최초 1회 |
| `setupStructureOnly()` | 헤더·서식·유효성검사만 | 스키마 변경 시 |
| `setDeployHook(url)` | 배포 훅 URL 저장 | Vercel 연결 후 1회 |
| `installOnChangeTrigger()` | 변경 트리거 설치 | 위 직후 1회 |
| `testDeployHook()` | 훅 연결 수동 점검 | 필요할 때 |
| `onSheetChange(e)` | 트리거 핸들러 | 자동 |

---

## 5. 검증 결과 (작성 시점)

빌드 검증 게이트와 동일한 규칙으로 시딩 데이터를 미리 검사했습니다.

| 검사 | 결과 |
|---|---|
| V-04 id 유일성 (5개 탭) | ✅ |
| V-07 `terms.refs` → 실재 차시 | ✅ 전부 실재 |
| V-08 `quiz.lesson_id` → 실재 차시 | ✅ 전부 실재 |
| V-03 enum 값 | ✅ |
| choice 문항 정답 범위 | ✅ 13문항 |
| slug 중복·형식 | ✅ 21개 고유, 영문 소문자 |
| seq 중복 (트랙 내) | ✅ 이론 1~7, 실습 1~14 |
| V-15 미참조 차시 (info) | TH-07, PR-04, PR-05, PR-13, PR-14 |

마지막 항목은 정상입니다. Cowork 3개 차시는 아직 집필 전이고, PR-04·PR-05는 용어에서 참조되지 않을 뿐입니다.

---

---

## 트러블슈팅

### ❌ "액세스 차단됨: 승인 오류 / The OAuth client is not fully created yet / 401 invalid_client"

**원인** — `배포 > 새 배포 > 웹 앱` 경로로 진입했을 때 발생합니다.
웹앱 배포는 스크립트에 연결된 GCP 프로젝트의 OAuth 클라이언트를 요구하는데,
새로 만든 Apps Script 프로젝트는 자동 생성 GCP 프로젝트를 쓰고 그 OAuth 동의 화면이
구성되기 전이라 클라이언트가 미완성 상태입니다. 개인 Gmail 계정은 Workspace 도메인
내부 예외도 적용되지 않습니다.

**조치 — 배포하지 마세요.** 이 스크립트에는 `doGet`/`doPost`가 없어서
웹앱으로 배포할 진입점 자체가 없습니다. 배포에 성공해도 아무 일도 일어나지 않습니다.

편집기에서 직접 실행하세요:

1. 상단 함수 드롭다운에서 `setupAll` 선택
2. **실행**
3. 권한 검토 → 계정 선택
4. "확인되지 않은 앱" 경고 → **고급** → **(안전하지 않음) …(으)로 이동**
5. **허용**

4번은 오류가 아니라 정상입니다. 방금 만든 스크립트라 구글 검수를 안 거쳤을 뿐입니다.

**왜 배포가 불필요한가**

| 기능 | 필요한 것 | 웹앱 배포 |
|---|---|---|
| `setupAll` | 편집기 실행 | 불필요 |
| `installOnChangeTrigger` | 편집기 1회 실행 | 불필요 (설치형 트리거는 URL이 없음) |
| `onSheetChange` | 트리거 자동 호출 | 불필요 |
| Deploy Hook 호출 (`UrlFetchApp`) | **아웃바운드** 요청 | 불필요 |
| 실패 알림 (`MailApp`) | 실행 권한 | 불필요 |

Vercel Deploy Hook은 이 스크립트가 **밖으로 요청을 보내는** 구조입니다.
밖에서 스크립트를 호출하는 것이 아니라 공개 URL이 필요 없습니다.

**편집기 실행에서도 같은 오류가 날 때** — 순서대로 시도

1. 5~10분 대기 후 재시도 (신규 프로젝트 전파 지연)
2. 배포 기록 정리 — 배포 > 배포 관리 > 보관처리
3. 스크립트 재생성 — 시트에서 `확장 프로그램 › Apps Script`로 새로 만들고 코드 재입력 (가장 확실)

### ❌ "Cannot read properties of null" / getActive() 가 null

**원인** — 스크립트가 시트에 종속(container-bound)돼 있지 않습니다.
Apps Script 홈에서 독립 실행형으로 만들면 `SpreadsheetApp.getActive()`가 null을 반환합니다.

**조치** — 반드시 **시트 → 확장 프로그램 → Apps Script**로 만드세요.
편집기 왼쪽 위에 시트 이름 `Claude-Edu`가 보이면 정상입니다.

### ❌ 유효성 검사 드롭다운이 안 보임

`setupStructureOnly` 또는 `setupAll`을 다시 실행하세요.
탭을 손으로 추가했다면 헤더명이 명세와 정확히 일치하는지 확인하세요 — 빌드는 헤더명으로 열을 찾습니다.

### ⚠️ setupAll 재실행 시 데이터 소실

`setupAll`은 기존 내용을 지우고 다시 씁니다.
구축 이후에는 `setupStructureOnly`만 쓰세요.

---

## 다음 단계

- [ ] `setupAll` 실행
- [ ] 웹에 게시 (탭 5개 CSV)
- [ ] Next.js 리포 스캐폴딩
- [ ] 시트 → JSON 빌드 스크립트 + 검증 게이트
- [ ] Vercel 연결 → Deploy Hook → 트리거 설치
- [ ] **Phase 00 게이트: 시트에서 용어 1행을 고치면 5분 내 사이트 반영**
