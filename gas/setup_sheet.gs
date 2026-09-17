/**
 * Claude Edu-Hub — 콘텐츠 시트 구축 스크립트
 * ------------------------------------------------------------------
 * 대상 시트: 1qvRauYKcMoJWM9YwOJmJrYNqAGwJdSkvMbFksIcC6Ms
 *
 * 실행 방법
 *   1. 시트 열기 → 확장 프로그램 → Apps Script
 *   2. 이 파일 전체를 붙여넣고 저장
 *   3. 함수 목록에서 setupAll 선택 → 실행 → 권한 승인
 *
 * 하는 일
 *   - 5개 탭 생성 (lessons / terms / templates / resources / quiz)
 *   - 헤더 작성, 1행 고정, 열 너비, 데이터 유효성 검사
 *   - 초기 데이터 시딩 (차시 21 · 용어 70 · 자료 40 · 확인문제 20)
 *   - 기본 시트(Sheet1/시트1) 정리
 *
 * 주의
 *   - setupAll 은 기존 탭이 있으면 내용을 지우고 다시 씁니다.
 *   - 이미 운영 중인 시트에는 절대 실행하지 마세요.
 *   - 구조만 만들고 데이터는 건드리지 않으려면 setupStructureOnly 를 실행하세요.
 *
 * 명세 근거: dev-docs/02_FS_기능명세서.md §1.2
 */

var CONF = {
  headerBg:   '#2B3F73',
  headerFg:   '#FFFFFF',
  bandBg:     '#F2F1ED',
  noteBg:     '#F5ECDD'
};

/** 탭 정의 — 헤더 순서가 곧 열 순서. 빌드 스크립트는 헤더명으로 찾으므로 순서 변경은 허용되나 이름 변경은 빌드를 깨뜨림 */
var TABS = {
  lessons: {
    headers: ['id','track','seq','title','slug','status','updated_at','note'],
    widths:  [80, 90, 55, 340, 240, 110, 110, 260],
    valid: {
      track:  ['theory','practice'],
      status: ['draft','review','published']
    }
  },
  terms: {
    headers: ['id','ko','en','category','definition','refs','aliases','status'],
    widths:  [150, 190, 230, 150, 480, 130, 200, 100],
    valid: {
      category: ['기초개념','학습·정렬','프롬프트·컨텍스트','에이전트·도구','생태계·안전'],
      status:   ['draft','review','published']
    }
  },
  templates: {
    headers: ['id','category','title','level','body','usage','expected','source','status'],
    widths:  [90, 150, 250, 60, 520, 320, 320, 200, 100],
    valid: {
      category: ['업무문서','마케팅·콘텐츠','분석·리서치','코드·기술','고급기법'],
      level:    ['1','2','3'],
      status:   ['draft','review','published']
    }
  },
  resources: {
    headers: ['id','category','title','url','level','lang','note','checked_at'],
    widths:  [90, 130, 300, 380, 60, 70, 380, 110],
    valid: {
      category: ['공식문서','무료강의','한국어자료','논문','도구'],
      level:    ['1','2','3'],
      lang:     ['ko','en']
    }
  },
  quiz: {
    headers: ['id','lesson_id','type','question','options','answer','hint'],
    widths:  [100, 90, 80, 460, 460, 70, 380],
    valid: {
      type: ['choice','open']
    }
  }
};

/* ══════════════════════════ 차시 21 ══════════════════════════
   ID는 불변. seq는 표시 순서이며 재배열 가능.
   Cowork(TH-07)가 seq 6, 기존 마무리 차시(TH-06)가 seq 7.
   근거: dev-docs/03_IA_정보구조설계.md §2 v1.1 */
var LESSONS = [
['TH-01','theory',1,'AI는 어떻게 여기까지 왔나','ai-history','published','2026-09-09',''],
['TH-02','theory',2,'AI는 왜 틀리고 왜 맞는가','hallucination-multimodal','published','2026-09-09',''],
['TH-03','theory',3,'프롬프트의 한계와 컨텍스트 엔지니어링','context-engineering','published','2026-09-09',''],
['TH-04','theory',4,'하네스: AI를 진짜로 일하게 만드는 소프트웨어','harness','published','2026-09-09',''],
['TH-05','theory',5,'MCP에서 Skills까지','mcp-and-skills','published','2026-09-09',''],
['TH-07','theory',6,'Cowork: 세 번째 표면','cowork','draft','','Phase 02 신규 집필 대상'],
['TH-06','theory',7,'AI 시대에 무엇을 준비해야 하는가','what-to-prepare','published','2026-09-09','본문의 "6차시(이번 차시)" 표현을 순번 비의존으로 교체 필요'],
['PR-01','practice',1,'AI에게 잘 시키는 법','prompting-basics','published','2026-09-09',''],
['PR-02','practice',2,'프롬프트의 한계 직접 체험','prompt-limits','published','2026-09-09','"실습 13차시" 참조가 깨져 있음 → 수정 필요'],
['PR-03','practice',3,'업무 문서 AI로 만들기','work-documents','published','2026-09-09',''],
['PR-04','practice',4,'마케팅·기획에 AI 쓰기','marketing-planning','published','2026-09-09',''],
['PR-05','practice',5,'데이터 분석과 시각화','data-analysis','published','2026-09-09',''],
['PR-06','practice',6,'컨텍스트 설계 실습','context-design','published','2026-09-09',''],
['PR-07','practice',7,'CLAUDE.md와 프로젝트 설정','claude-md','published','2026-09-09',''],
['PR-08','practice',8,'MCP: 외부 도구 연결','mcp-setup','published','2026-09-09',''],
['PR-09','practice',9,'Skills 기초: 나만의 전문가','skills-basics','published','2026-09-09',''],
['PR-10','practice',10,'Skills 심화: 복합 스킬','skills-advanced','published','2026-09-09',''],
['PR-11','practice',11,'AI에게 큰 작업 시키기','agent-loop','published','2026-09-09',''],
['PR-12','practice',12,'나만의 AI 워크플로우 설계','workflow-design','published','2026-09-09','로드맵 표의 차시 번호 오류 수정 필요'],
['PR-13','practice',13,'Cowork로 파일 업무 자동화','cowork-basics','draft','','Phase 02 신규 집필 대상'],
['PR-14','practice',14,'Cowork 스킬·커넥터·스케줄 작업','cowork-advanced','draft','','Phase 02 신규 집필 대상']
];

/* ══════════════════════════ 용어 70 ══════════════════════════
   출처: docs/3.부록.pdf 부록 A
   refs는 원본 표기가 아니라 실제 서술 위치로 교정했습니다.
   (프롬프트 인젝션·탈옥·Jagged Frontier의 차시 표기 오류 3건 반영) */
var TERMS = [
['T-AI','인공지능','AI','기초개념','인간의 학습·추론·판단을 모방하는 컴퓨터 시스템의 총칭이에요.','TH-01','','published'],
['T-ML','머신러닝','ML · Machine Learning','기초개념','데이터에서 패턴을 학습하는 AI 하위 분야예요.','TH-01','','published'],
['T-DL','딥러닝','Deep Learning','기초개념','다층 신경망을 사용하는 머신러닝 하위 분야예요.','TH-01','','published'],
['T-LLM','대규모 언어 모델','Large Language Model · LLM','기초개념','대량의 텍스트로 훈련된 초거대 신경망 기반 생성 모델이에요.','TH-01','LLM','published'],
['T-TOKEN','토큰','Token','기초개념','LLM이 텍스트를 처리하는 최소 단위예요. 단어·음절·글자 조각 단위로 나뉘어요.','TH-01','','published'],
['T-PARAM','파라미터','Parameter','기초개념','모델이 학습 중 조정하는 가중치 값이에요.','TH-01','','published'],
['T-TRANS','트랜스포머','Transformer','기초개념','현대 LLM의 기반 아키텍처예요. 2017년 발표됐어요.','TH-01','','published'],
['T-ATTN','어텐션','Attention','기초개념','입력의 각 부분 간 관련도를 계산하는 핵심 메커니즘이에요.','TH-01','Self-Attention','published'],
['T-CTXWIN','컨텍스트 윈도우','Context Window','기초개념','모델이 한 번에 참조할 수 있는 토큰의 최대 범위예요.','TH-01,TH-03','','published'],
['T-INFER','추론','Inference','기초개념','훈련된 모델이 새 입력에서 출력을 생성하는 과정이에요.','TH-01','','published'],
['T-SCALE','스케일링 법칙','Scaling Laws','기초개념','모델 크기·데이터 양·연산량과 성능의 예측 가능한 관계예요.','TH-01','','published'],
['T-MULTI','멀티모달','Multimodal','기초개념','텍스트 외에 이미지·오디오·영상도 함께 처리하거나 생성하는 능력이에요.','TH-02','옴니모달','published'],
['T-EMBED','임베딩','Embedding','기초개념','텍스트를 의미를 보존한 숫자 벡터로 변환한 표현이에요.','TH-01','','published'],
['T-PRE','사전학습','Pre-training','학습·정렬','라벨 없는 텍스트로 다음 토큰 예측을 훈련하는 첫 단계예요.','TH-01,TH-02','','published'],
['T-FT','파인튜닝','Fine-tuning','학습·정렬','사전학습된 모델을 특정 과제에 맞게 추가 훈련하는 것이에요.','TH-02','','published'],
['T-SFT','SFT','Supervised Fine-Tuning','학습·정렬','사람이 작성한 고품질 응답으로 지도 학습하는 파인튜닝이에요.','TH-02','지도 미세조정','published'],
['T-RLHF','RLHF','RL from Human Feedback','학습·정렬','사람의 선호를 보상 신호로 써서 모델을 정렬하는 기법이에요.','TH-02','인간 피드백 강화학습','published'],
['T-DPO','DPO','Direct Preference Optimization','학습·정렬','보상 모델 없이 선호 데이터에서 직접 최적화하는 방법이에요.','TH-02','직접 선호 최적화','published'],
['T-RLAIF','RLAIF','RL from AI Feedback','학습·정렬','사람 대신 AI가 피드백을 생성해 정렬하는 방법이에요.','TH-02','','published'],
['T-RM','보상 모델','Reward Model','학습·정렬','사람의 선호를 학습해 출력 품질을 점수화하는 모델이에요.','TH-02','','published'],
['T-ALIGN','정렬','Alignment','학습·정렬','모델의 행동을 사람의 의도·가치·안전에 맞추는 과정이에요.','TH-02','','published'],
['T-HALL','환각','Hallucination','학습·정렬','사실이 아닌 내용을 사실인 것처럼 자신 있게 생성하는 현상이에요. 버그가 아니라 다음 토큰 예측이라는 구조의 결과예요.','TH-02,PR-02','할루시네이션','published'],
['T-REASON','추론 모델','Reasoning Model','학습·정렬','답변 전에 내부 사고 과정을 거치는 모델이에요. RL로 사고하는 법 자체를 학습했어요.','TH-01','','published'],
['T-PEFT','PEFT','Parameter-Efficient Fine-Tuning','학습·정렬','일부 파라미터만 조정하는 효율적 파인튜닝이에요. LoRA가 대표적이에요.','TH-02','LoRA','published'],
['T-RLVR','RLVR','RL with Verifiable Rewards','학습·정렬','수학 정답처럼 검증 가능한 보상으로 강화학습하는 방법이에요.','TH-02','','published'],
['T-PE','프롬프트 엔지니어링','Prompt Engineering','프롬프트·컨텍스트','LLM에게 지시를 설계해 원하는 행동을 끌어내는 실무 기술이에요. 모델 가중치를 건드리지 않아요.','TH-03,PR-01','','published'],
['T-PROMPT','프롬프트','Prompt','프롬프트·컨텍스트','사용자가 LLM에 보내는 입력 전체예요. 지시·맥락·예시를 포함해요.','PR-01','','published'],
['T-SYSP','시스템 프롬프트','System Prompt','프롬프트·컨텍스트','대화 전에 설정되는 숨겨진 행동 규칙 지시예요.','TH-03,PR-06','','published'],
['T-ZERO','Zero-shot','제로샷','프롬프트·컨텍스트','예시 없이 지시만으로 과제를 수행하게 하는 방식이에요.','TH-03,PR-01','','published'],
['T-FEW','Few-shot','퓨샷','프롬프트·컨텍스트','3~5개의 예시로 모델이 패턴을 따라하게 하는 방식이에요.','TH-03,PR-01','','published'],
['T-COT','사고의 연쇄','CoT · Chain-of-Thought','프롬프트·컨텍스트','중간 추론 단계를 출력하도록 유도하는 프롬프트 기법이에요.','TH-03,PR-02','CoT','published'],
['T-SC','자기 일관성','Self-Consistency','프롬프트·컨텍스트','여러 추론 경로를 샘플링한 뒤 가장 일관된 답을 고르는 기법이에요.','TH-03','','published'],
['T-TOT','사고의 나무','ToT · Tree of Thoughts','프롬프트·컨텍스트','트리 탐색과 상태 평가, 백트래킹을 결합한 추론 기법이에요.','TH-03','ToT','published'],
['T-META','메타 프롬프팅','Meta-Prompting','프롬프트·컨텍스트','지휘자가 전문가들을 오케스트레이션하는 구조의 프롬프트 기법이에요.','TH-03','Conductor-Expert','published'],
['T-CE','컨텍스트 엔지니어링','Context Engineering','프롬프트·컨텍스트','컨텍스트 윈도우 전체를 설계하는 기술이에요. 프롬프트 엔지니어링의 상위 집합이에요.','TH-03,PR-06','','published'],
['T-LIM','Lost-in-Middle','중간 소실','프롬프트·컨텍스트','긴 컨텍스트의 가운데 정보를 잘 활용하지 못하는 현상이에요.','TH-03','중간 소실','published'],
['T-RAG','RAG','Retrieval-Augmented Generation','프롬프트·컨텍스트','외부 DB에서 검색한 정보를 프롬프트에 주입한 뒤 생성하는 방식이에요.','TH-02,TH-03','검색 증강 생성','published'],
['T-STRUCT','구조화 출력','Structured Output','프롬프트·컨텍스트','XML·JSON으로 출력 형식을 강제해 파싱을 안정화하는 기법이에요.','TH-03,PR-01','','published'],
['T-COMPRESS','컨텍스트 압축','Context Compression','프롬프트·컨텍스트','요약·추출로 컨텍스트 윈도우를 효율적으로 활용하는 기법이에요.','TH-03','','published'],
['T-AGENT','에이전트','Agent','에이전트·도구','계획·도구사용·검증을 자율적으로 반복하는 AI 시스템이에요.','TH-04,PR-11','','published'],
['T-HARNESS','하네스','Harness','에이전트·도구','LLM을 보이지 않는 프롬프트와 호출 가능한 도구로 확장하는 소프트웨어예요. 채팅봇을 에이전트로 바꿔요.','TH-04,PR-07','','published'],
['T-MCP','MCP','Model Context Protocol','에이전트·도구','AI 에이전트를 외부 시스템에 연결하는 개방형 표준 프로토콜이에요.','TH-05,PR-08','모델 컨텍스트 프로토콜','published'],
['T-SKILLS','Skills','Agent Skills','에이전트·도구','마크다운 파일로 에이전트에게 전문 지식과 절차를 부여하는 재사용 가능한 패키지예요.','TH-05,PR-09,PR-10','스킬,SKILL.md','published'],
['T-TOOLUSE','도구 사용','Tool Use','에이전트·도구','LLM이 외부 API·코드·파일시스템을 호출해 작업을 수행하는 것이에요.','TH-04,PR-08','','published'],
['T-LOOP','에이전트 루프','Agentic Loop','에이전트·도구','수집·행동·검증·반복을 되풀이하는 핵심 실행 패턴이에요.','TH-04,PR-11','Gather Act Verify','published'],
['T-SUBAGENT','서브에이전트','Sub-agent','에이전트·도구','주 에이전트가 하위 과제를 위임하는 별도 인스턴스예요. 컨텍스트를 격리해요.','TH-04','','published'],
['T-CLAUDEMD','CLAUDE.md','CLAUDE.md','에이전트·도구','프로젝트 규칙과 스타일을 정의하는 자동 참조 설정 파일이에요.','TH-04,PR-07','','published'],
['T-MULTIAGENT','멀티 에이전트','Multi-Agent','에이전트·도구','여러 에이전트가 역할을 나눠 협력하는 구조예요.','TH-04','','published'],
['T-AGMEM','에이전트 메모리','Agent Memory','에이전트·도구','대화 간에 정보를 저장하고 재활용하는 메커니즘이에요.','TH-04,PR-07','','published'],
['T-WORKFLOW','워크플로우','Workflow','에이전트·도구','AI 기능들을 순서대로 연결한 자동화 흐름이에요. 경로가 코드에 고정돼 있어요.','PR-12','','published'],
['T-COMPUSE','컴퓨터 사용','Computer Use','에이전트·도구','AI가 마우스와 키보드로 컴퓨터를 직접 조작하는 것이에요.','TH-04','','published'],
['T-ACI','ACI','Agent-Computer Interface','에이전트·도구','에이전트가 도구를 사용하는 인터페이스를 설계하는 원칙이에요.','TH-04','','published'],
['T-OPENW','오픈 웨이트','Open Weight','생태계·안전','가중치가 공개되어 누구나 다운로드하고 실행할 수 있는 모델이에요.','TH-01','','published'],
['T-VLLM','vLLM','vLLM','생태계·안전','오픈 웨이트 모델용 고성능 추론 서빙 엔진이에요.','TH-01','','published'],
['T-PI','프롬프트 인젝션','Prompt Injection','생태계·안전','악의적 지시를 삽입해 원래 지시를 무시하고 공격자의 지시를 따르게 만드는 공격이에요.','TH-06','','published'],
['T-GUARD','가드레일','Guardrail','생태계·안전','유해하거나 부적절한 출력을 막는 안전장치예요.','TH-02,TH-04','','published'],
['T-JAGGED','Jagged Frontier','들쭉날쭉한 경계','생태계·안전','AI가 어떤 과제에서는 인간을 압도하지만 옆 과제에서는 기초적 실수를 반복하는 현상이에요.','TH-01,TH-06','들쭉날쭉한 경계','published'],
['T-JAIL','탈옥','Jailbreak','생태계·안전','안전 필터와 가드레일을 우회하려는 프롬프트 기법의 총칭이에요.','TH-06','','published'],
['T-REDTEAM','레드팀','Red Team','생태계·안전','AI의 취약점을 의도적으로 찾는 적대적 테스트예요.','TH-02','','published'],
['T-BENCH','벤치마크','Benchmark','생태계·안전','표준 과제로 모델 성능을 측정하고 비교하는 평가 체계예요.','TH-01','','published'],
['T-WINTER','AI 겨울','AI Winter','생태계·안전','AI에 대한 기대가 꺾이면서 투자와 관심이 급감하는 침체기예요.','TH-01','','published'],
['T-TOKENIZE','토큰화','Tokenization','생태계·안전','텍스트를 토큰 단위로 분리하는 전처리 과정이에요.','TH-01','','published'],
['T-LONGCTX','롱 컨텍스트','Long Context','생태계·안전','수십만에서 수백만 토큰에 이르는 컨텍스트 윈도우 기술이에요.','TH-03','','published'],
['T-VECDB','벡터 DB','Vector Database','생태계·안전','임베딩 벡터를 저장하고 유사도로 검색하는 전문 데이터베이스예요.','TH-03','벡터 데이터베이스','published'],
['T-ARTIFACT','아티팩트','Artifact','생태계·안전','AI 대화에서 생성된 독립 산출물이에요. 코드·문서·이미지 등이 해당해요.','PR-03','','published'],
['T-ICL','인컨텍스트 학습','In-Context Learning','생태계·안전','프롬프트의 예시만으로 새 과제를 수행하는 능력이에요.','TH-03','','published'],
['T-AUTON','자율성 평가','Autonomy Assessment','생태계·안전','AI의 자율성을 과제별로 판단하는 프레임워크예요.','TH-04,PR-11','','published'],
['T-REFLECT','성찰 에이전트','Reflective Agent','생태계·안전','자기 출력을 검토하고 수정하는 자기 반성 에이전트예요.','TH-04','','published'],
['T-INFRA','추론 인프라','Inference Infrastructure','생태계·안전','대규모 LLM 추론용 서버·GPU·소프트웨어 스택이에요.','TH-01','','published'],
['T-CLOUDAG','클라우드 에이전트','Cloud Agent','생태계·안전','클라우드에서 장시간 자율 작업하는 에이전트예요.','TH-04','','published'],
['T-REMOTEMCP','원격 MCP','Remote MCP','생태계·안전','원격 서버에서 인터넷을 통해 접근하는 MCP 서버예요.','PR-08','','published']
];

/* ══════════════════════════ 추가 학습자료 41 ══════════════════════════
   출처: docs/3.부록.pdf 부록 C
   checked_at 은 링크 생존 확인일. 180일 초과 시 사이트에 "링크 확인 필요" 표식이 붙습니다. */
var RESOURCES = [
['R-D01','공식문서','Anthropic Docs','https://docs.anthropic.com',1,'en','프롬프트 엔지니어링 가이드·API 레퍼런스·모델 카드. 이론 3차시와 직결.','2026-09-09'],
['R-D02','공식문서','Claude Code Docs','https://docs.anthropic.com/en/docs/claude-code',2,'en','설치·설정·CLAUDE.md·MCP·Skills 전체. 실습 7~12차시의 원본 소스.','2026-09-09'],
['R-D03','공식문서','OpenAI Docs','https://platform.openai.com/docs',1,'en','GPT 시리즈 공식 문서. API·프롬프트 가이드·함수 호출.','2026-09-09'],
['R-D04','공식문서','OpenAI Prompt Engineering Guide','https://platform.openai.com/docs/guides/prompt-engineering',1,'en','6가지 전략으로 구성된 모범 사례 가이드.','2026-09-09'],
['R-D05','공식문서','Google AI for Developers','https://ai.google.dev',2,'en','Gemini API 공식 문서. 멀티모달 입력·구조화 출력·함수 호출.','2026-09-09'],
['R-D06','공식문서','Hugging Face Docs','https://huggingface.co/docs',2,'en','오픈소스 모델 허브이자 Transformers 라이브러리 공식 문서.','2026-09-09'],
['R-D07','공식문서','MCP Specification','https://modelcontextprotocol.io',3,'en','MCP 공식 사양. 서버 개발과 통합의 기술 명세.','2026-09-09'],
['R-C01','무료강의','Google AI Essentials','https://grow.google/ai-essentials',1,'en','Coursera 제공 AI 기초 과정. 비기술직도 수강 가능.','2026-09-09'],
['R-C02','무료강의','DeepLearning.AI Short Courses','https://deeplearning.ai/short-courses',1,'en','주제별 1~2시간 단기 과정 모음.','2026-09-09'],
['R-C03','무료강의','Anthropic Prompt Engineering Course','https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',2,'en','Anthropic이 직접 만든 프롬프트 엔지니어링 과정.','2026-09-09'],
['R-C04','무료강의','CS50 Introduction to AI','https://cs50.harvard.edu/ai',2,'en','하버드 AI 입문. 탐색·지식표현·머신러닝·신경망 기초.','2026-09-09'],
['R-C05','무료강의','Stanford CS229 Machine Learning','https://cs229.stanford.edu',3,'en','수학적 기초부터 다루는 머신러닝 과정.','2026-09-09'],
['R-C06','무료강의','fast.ai Practical Deep Learning','https://course.fast.ai',2,'en','코드 중심 실용 딥러닝 과정. Python 기초만 있으면 시작 가능.','2026-09-09'],
['R-C07','무료강의','Hugging Face NLP Course','https://huggingface.co/learn/nlp-course',2,'en','Transformer 아키텍처·파인튜닝·모델 배포 실습.','2026-09-09'],
['R-K01','한국어자료','모두의 연구소','https://modulabs.co.kr',1,'ko','AI/ML 학습 커뮤니티. 논문 읽기 모임과 프로젝트 스터디.','2026-09-09'],
['R-K02','한국어자료','네이버 부스트코스 AI','https://boostcourse.org',1,'ko','파이썬 기초부터 딥러닝까지 한국어로 체계적 학습.','2026-09-09'],
['R-K03','한국어자료','테디노트 유튜브','https://youtube.com/@teddynote',2,'ko','LangChain·RAG·프롬프트 엔지니어링 실습 중심 튜토리얼.','2026-09-09'],
['R-K04','한국어자료','노마드코더 AI 콘텐츠','https://nomadcoders.co',1,'ko','ChatGPT API 활용, AI 앱 개발 등 무료 콘텐츠.','2026-09-09'],
['R-K05','한국어자료','AI타임스','https://aitimes.com',1,'ko','국내외 AI 산업 동향·정책·기술 트렌드 뉴스.','2026-09-09'],
['R-K06','한국어자료','Google ML Crash Course 한국어','https://developers.google.com/machine-learning/crash-course',2,'ko','머신러닝 기초 개념을 시각적으로 설명.','2026-09-09'],
['R-K07','한국어자료','위키독스 · 딥러닝을 이용한 자연어 처리 입문','https://wikidocs.net/book/2155',2,'ko','토큰화·임베딩·트랜스포머까지 한국어 NLP 입문서.','2026-09-09'],
['R-P01','논문','Vaswani et al. (2017) Attention Is All You Need','https://arxiv.org/abs/1706.03762',3,'en','트랜스포머 아키텍처 원논문. 현대 모든 LLM의 기반.','2026-09-09'],
['R-P02','논문','Brown et al. (2020) Language Models are Few-Shot Learners','https://arxiv.org/abs/2005.14165',3,'en','GPT-3 논문. 인컨텍스트 학습을 보인 프롬프트 엔지니어링의 출발점.','2026-09-09'],
['R-P03','논문','Kaplan et al. (2020) Scaling Laws for Neural Language Models','https://arxiv.org/abs/2001.08361',3,'en','스케일링 법칙의 원본. 이론 1차시 근거.','2026-09-09'],
['R-P04','논문','Wei et al. (2022) Chain-of-Thought Prompting','https://arxiv.org/abs/2201.11903',3,'en','CoT 프롬프팅 원논문. 템플릿 E-1의 원본.','2026-09-09'],
['R-P05','논문','Wang et al. (2022) Self-Consistency','https://arxiv.org/abs/2203.11171',3,'en','Self-Consistency 원논문. 템플릿 E-2의 원본.','2026-09-09'],
['R-P06','논문','Yao et al. (2023) Tree of Thoughts','https://arxiv.org/abs/2305.10601',3,'en','ToT 원논문. 템플릿 E-3의 원본.','2026-09-09'],
['R-P07','논문','Suzgun & Kalai (2024) Meta-Prompting','https://arxiv.org/abs/2401.12954',3,'en','Conductor-Expert 패턴 정식화. 템플릿 E-4의 원본.','2026-09-09'],
['R-P08','논문','Dell Acqua et al. (2023) Navigating the Jagged Technological Frontier','https://www.hbs.edu/faculty/Pages/item.aspx?num=64700',2,'en','Jagged Frontier를 실증한 하버드/BCG 공동 연구.','2026-09-09'],
['R-P09','논문','Ouyang et al. (2022) InstructGPT','https://arxiv.org/abs/2203.02155',3,'en','RLHF를 본격 적용한 논문. 이론 2차시 정렬의 배경.','2026-09-09'],
['R-P10','논문','Mollick (2024) Good Enough Prompting','https://www.oneusefulthing.org',1,'en','프롬프트 엔지니어링의 실용 원칙. "10시간 쓰면 는다"가 핵심.','2026-09-09'],
['R-T01','도구','ChatGPT','https://chatgpt.com',1,'en','OpenAI 대화형 인터페이스. 무료 버전으로 프롬프트 연습 시작.','2026-09-09'],
['R-T02','도구','Claude','https://claude.ai',1,'en','Anthropic 대화형 인터페이스. 긴 문서 분석·구조화 출력에 강점.','2026-09-09'],
['R-T03','도구','Claude Code','https://docs.anthropic.com/en/docs/claude-code',2,'en','터미널 기반 에이전트 도구. 파일·코드 실행·MCP·Skills 지원.','2026-09-09'],
['R-T04','도구','Google AI Studio','https://aistudio.google.com',1,'en','Gemini 모델 실험용 웹 인터페이스.','2026-09-09'],
['R-T05','도구','Hugging Face Spaces','https://huggingface.co/spaces',1,'en','설치 없이 오픈소스 모델을 웹에서 체험.','2026-09-09'],
['R-T06','도구','Google Colab','https://colab.research.google.com',2,'en','무료 GPU가 제공되는 클라우드 Jupyter 노트북.','2026-09-09'],
['R-T07','도구','LM Studio','https://lmstudio.ai',2,'en','로컬에서 오픈 웨이트 LLM을 실행하는 데스크톱 앱.','2026-09-09'],
['R-T08','도구','Ollama','https://ollama.com',2,'en','커맨드라인에서 오픈 웨이트 모델을 실행하는 도구.','2026-09-09'],
['R-T09','도구','vLLM','https://docs.vllm.ai',3,'en','프로덕션 수준 고성능 추론 서빙 엔진.','2026-09-09'],
['R-T10','도구','LangChain','https://langchain.com',3,'en','LLM 애플리케이션 개발 프레임워크. RAG·에이전트·도구 연동.','2026-09-09']
];

/* ══════════════════════════ 확인 문제 25 ══════════════════════════
   출처: docs/1.이론.pdf 각 차시 확인 문제
   options 는 | 구분, answer 는 1부터 시작하는 번호 (choice 일 때만)
   실습 차시 문항은 Phase 01 콘텐츠 이관에서 추가합니다. */
var QUIZ = [
['Q-TH01-1','TH-01','choice','1차 AI 겨울과 2차 AI 겨울의 원인으로 올바르게 짝지은 것은?','1차: 데이터 부족 / 2차: 컴퓨트 부족|1차: 과도한 기대와 부족한 결과 / 2차: 규칙 기반 접근법의 구조적 한계|1차: 정부 규제 / 2차: 시장 포화|1차: 알고리즘 오류 / 2차: 하드웨어 실패',2,'1차는 기대의 문제, 2차는 접근법의 문제였어요.'],
['Q-TH01-2','TH-01','choice','Chinchilla 법칙에 따르면 같은 컴퓨트 예산에서 최적의 결과를 내려면?','파라미터를 최대한 키우고 데이터는 최소화한다|데이터를 최대한 늘리고 모델은 작게 유지한다|모델 크기와 데이터 양을 같은 비율로 키운다|학습 시간을 2배로 늘린다',3,'Chinchilla(70B)가 MT-NLG(530B)를 이긴 이유를 떠올려보세요.'],
['Q-TH01-3','TH-01','open','추론 모델이 기존 LLM과 근본적으로 다른 점은 무엇이고, 왜 네 번째 스케일링 축이라 불리는지 본인의 말로 설명해보세요.','','','시험장의 두 학생 비유 — 답을 바로 쓰는 학생과 풀이를 적고 검토하는 학생.'],
['Q-TH01-4','TH-01','open','DeepSeek R1-Zero가 학술적으로 흥미로운 이유를 매뉴얼 비유를 활용해 설명해보세요.','','','사람이 생각하는 법을 가르치지 않았는데 어떤 일이 벌어졌는지 떠올려보세요.'],
['Q-TH02-1','TH-02','choice','AI 환각이 버그가 아니라 구조적 원인에서 비롯된다고 하는 이유로 가장 적절한 것은?','학습 데이터가 부족하기 때문이다|다음 토큰 예측이라는 손실 함수가 그럴듯한 답 생성을 선호하기 때문이다|프롬프트를 잘 쓰지 않았기 때문이다|GPU 성능이 부족하기 때문이다',2,'빈칸 채우기 시험의 채점 기준 비유를 떠올려보세요.'],
['Q-TH02-2','TH-02','choice','RLHF의 세 단계를 올바른 순서로 배열한 것은?','보상 모델 → SFT → PPO|SFT → PPO → 보상 모델|SFT → 보상 모델 → PPO|PPO → SFT → 보상 모델',3,'모범 답안으로 형식을 가르치고, 기준을 만들고, 그 기준에 맞춰 조정하는 순서예요.'],
['Q-TH02-3','TH-02','open','멀티모달 AI가 이미지를 처리하는 핵심 원리를 편지 번역 비유를 활용해 설명해보세요.','','','패치로 나누고, 벡터로 변환하고, 텍스트와 같은 공간에 배치하는 과정.'],
['Q-TH02-4','TH-02','open','환각을 줄이는 세 가지 전략 중 컨텍스트 엔지니어링이 가장 효과적인 이유를, 사실성 환각과 충실성 환각의 차이를 들어 설명해보세요.','','','약국 비유 — 처방전의 50mg을 500mg으로 읽는 상황에서 가장 효과적인 방어는?'],
['Q-TH03-1','TH-03','choice','프롬프트가 컨텍스트 윈도우에서 차지하는 비중으로 가장 가까운 것은?','약 25%|약 5%|약 0.25%|약 50%',3,'면접장의 첫 마디 인사 비유를 떠올려보세요.'],
['Q-TH03-2','TH-03','choice','컨텍스트 엔지니어링의 4축을 올바르게 짝지은 것은?','Write(토큰 축소), Select(윈도우 밖 저장), Compress(조각 선택), Isolate(분리)|Write(윈도우 밖 저장), Select(필요한 조각만 꺼냄), Compress(토큰 축소), Isolate(컨텍스트 분리)|Write(쓰기), Select(읽기), Compress(삭제), Isolate(생성)|Write(프롬프트), Select(모델), Compress(학습), Isolate(추론)',2,'건물을 짓는 비유에서 각 축의 역할을 떠올려보세요.'],
['Q-TH03-3','TH-03','open','Lost-in-Middle 현상이 왜 발생하는지 교실 수업 비유를 사용해 설명해보세요.','','','수업 시작할 때 한 말과 방금 한 말은 기억하지만 20분 전 말은 흐릿해지는 것.'],
['Q-TH03-4','TH-03','open','100개 파일 리팩토링 시나리오에서 Isolate를 적용하는 것이 왜 중요한지 컨텍스트 오염과 연결해 설명해보세요.','','','서브에이전트가 독립된 컨텍스트에서 작업하면 메인 컨텍스트에 어떤 영향이 있을까요?'],
['Q-TH04-1','TH-04','choice','Claude.ai와 Claude Code에 같은 모델이 들어 있는데 결과가 다른 이유는?','Claude Code에 더 똑똑한 모델이 들어 있어서|하네스가 있어서 파일 접근·도구 호출·검증 루프가 가능하기 때문|Claude.ai는 인터넷에 연결되어 있지 않아서|Claude Code는 유료라서 성능이 더 좋음',2,'Product Overhang의 핵심은 모델이 아니라 소프트웨어의 차이예요.'],
['Q-TH04-2','TH-04','open','에이전트 루프의 네 단계를 순서대로 나열하고, 가장 자주 빠뜨려지면서 가장 치명적인 단계가 무엇인지 설명해보세요.','','','의사의 진료 과정 — 약을 처방하고 나서 빠뜨리기 쉬운 것은?'],
['Q-TH04-3','TH-04','choice','다음 중 ACI 설계의 올바른 원칙이 아닌 것은?','도구 설명을 최대한 짧게 줄여 컨텍스트를 절약한다|상대 경로 대신 절대 경로를 강제한다|모델이 도구를 처음 보는 주니어 개발자라고 상상하고 설계한다|실수가 어렵도록 위험한 기본값을 제거한다',1,'도구 설명은 길어도 괜찮아요. 짧지만 모호한 것보다 길지만 명확한 것이 나아요.'],
['Q-TH04-4','TH-04','open','반패턴 3가지 중 하나를 골라 왜 위험한지 자신만의 비유로 설명해보세요.','','','자판기와 바리스타, 채점 기준 변경 등의 비유를 참고하되 자신만의 비유를 만들어보세요.'],
['Q-TH05-1','TH-05','choice','MCP를 AI의 USB-C라고 부르는 이유는?','USB-C 케이블을 통해 연결되기 때문|N×M개의 커넥터를 단일 표준으로 통일하기 때문|충전 기능을 제공하기 때문|Anthropic이 하드웨어 회사이기 때문',2,'USB 이전에 프린터·마우스·스캐너 케이블이 전부 달랐던 상황을 떠올려보세요.'],
['Q-TH05-2','TH-05','choice','MCP의 3자 구조를 공항 비유로 올바르게 연결한 것은?','Host=비행기, Client=터미널, Server=탑승구|Host=터미널, Client=탑승구, Server=항공사 비행기|Host=승객, Client=비행기, Server=터미널|Host=탑승구, Client=터미널, Server=승객',2,'하나의 터미널에 여러 탑승구가 있고, 각 탑승구가 다른 항공사와 연결되는 구조.'],
['Q-TH05-3','TH-05','choice','Skills의 자동 매칭에서 가장 중요한 프론트매터 필드는?','name|description|allowed-tools|context',2,'Claude가 지금 이 스킬이 필요한가를 판단할 때 무엇을 보는지 떠올려보세요.'],
['Q-TH05-4','TH-05','open','MCP와 Skills의 관계를 장비 vs 교육 비유로 설명하고, MCP만 있고 Skills가 없을 때 어떤 문제가 생기는지 구체적으로 서술하세요.','','','장비는 있지만 진료 프로토콜이 없는 병원에서 어떤 일이 벌어질까요?'],
['Q-TH05-5','TH-05','open','나쁜 스킬의 안티패턴 3가지를 설명하고 각각의 해결책을 제시하세요.','','','과적, MCP 미러링, 자동 호출 남용의 세 가지를 떠올려보세요.'],
['Q-TH06-1','TH-06','choice','직접 인젝션과 간접 인젝션의 가장 큰 차이는?','직접은 텍스트, 간접은 이미지를 이용한다|직접은 사용자가 대화창에 공격하고, 간접은 외부 데이터에 공격을 숨긴다|직접은 채팅봇만, 간접은 에이전트만 공격한다|직접은 방어가 불가능하고, 간접은 완벽히 방어할 수 있다',2,'우체국 직원 비유 — 고객이 직접 거짓말하는 것 vs 편지 안에 지시를 숨기는 것.'],
['Q-TH06-2','TH-06','choice','BCG 실험에서 AI 능력 경계 바깥의 과제를 수행할 때 AI를 사용한 컨설턴트의 성과가 하락한 이유는?','AI가 해당 과제를 거부했기 때문|AI의 자신감 있는 오답을 검증 없이 수용했기 때문|AI의 응답 속도가 너무 느렸기 때문|컨설턴트가 AI 사용법을 몰랐기 때문',2,'경계 바깥에서 AI가 함정이 되는 메커니즘을 떠올려보세요.'],
['Q-TH06-3','TH-06','open','AI 시대에 개인이 준비해야 할 것 2가지를 제시하고 각각이 왜 중요한지 본인의 말로 설명해보세요.','','','하나는 AI를 이해하는 능력, 다른 하나는 AI 위에서 방향을 잡는 능력.'],
['Q-TH06-4','TH-06','open','사라지는 것은 직업이 아니라 작업이다라는 주장을 ATM 비유를 활용해 설명해보세요.','','','ATM 등장 뒤 은행 창구 직원의 수와 역할이 어떻게 변했는지 떠올려보세요.']
];

/* ══════════════════════════ 템플릿 25 (메타만) ══════════════════════════
   출처: docs/3.부록.pdf 부록 B
   body 는 비워둡니다 — Phase 01 콘텐츠 이관에서 채웁니다.
   따라서 status 가 전부 draft 이고, 사이트에 노출되지 않습니다. */
var TEMPLATES = [
['TPL-A1','업무문서','보고서 요약 템플릿','1','','긴 보고서를 500자 이내로 압축합니다. 독자와 형식을 명시하면 효과적이에요.','핵심 결론·근거 3개·권고사항이 구조화된 요약문','','draft'],
['TPL-A2','업무문서','업무 메일 작성 템플릿','1','','수신자·목적·핵심 내용·톤을 채우면 상황에 맞는 메일이 생성됩니다.','인사·본문·요청사항·마무리의 4단 구조 메일 초안','','draft'],
['TPL-A3','업무문서','회의록 정리 템플릿','2','','회의 녹취록이나 메모를 통째로 넣으면 됩니다. 발언자 이름이 있으면 더 정확해요.','기본 정보 표 + 논의 요약 + 결정/미결 사항 분리','','draft'],
['TPL-A4','업무문서','기획서 초안 템플릿','2','','프로젝트 기본 정보만 채우면 6개 섹션의 기획서 뼈대가 나옵니다.','2~3페이지 분량의 기획서 초안','','draft'],
['TPL-A5','업무문서','주간 보고 작성 템플릿','1','','정리되지 않은 업무 메모·메신저 기록을 그대로 넣어도 됩니다.','실적·진행중·다음주 계획·이슈의 4개 섹션 보고서','','draft'],
['TPL-B1','마케팅·콘텐츠','SNS 캡션 생성','1','','조건을 채우면 3가지 스타일의 캡션이 나옵니다.','훅 + 본문 + CTA + 해시태그 구조의 캡션 3개 안','','draft'],
['TPL-B2','마케팅·콘텐츠','블로그 포스트 초안','2','','주제와 조건을 채우면 구조화된 초안이 나옵니다.','제목 3안 + 도입 + 소제목별 본문 + 결론','','draft'],
['TPL-B3','마케팅·콘텐츠','경쟁사 분석','2','','알고 있는 경쟁사 정보를 최대한 넣으세요. 수치는 반드시 직접 검증해야 합니다.','비교 매트릭스 + 차별화 기회가 포함된 분석 보고서','','draft'],
['TPL-B4','마케팅·콘텐츠','고객 페르소나','2','','고객 데이터가 많을수록 정확해집니다. 적으면 가설로 생성되니 검증이 필요해요.','7개 항목이 채워진 구체적 페르소나 2개','','draft'],
['TPL-B5','마케팅·콘텐츠','광고 카피 A/B안','2','','제품 정보와 매체를 채우면 A/B 테스트용 카피 쌍이 나옵니다.','소구점이 다른 카피 2쌍(4개)과 각각의 효과 조건','','draft'],
['TPL-C1','분석·리서치','데이터 분석 요청','2','','CSV나 표를 그대로 붙여넣으세요. 크면 상위 20~30행만 넣어도 됩니다.','5개 항목의 데이터 분석 결과와 해석','','draft'],
['TPL-C2','분석·리서치','시장 조사 요약','2','','수치는 반드시 공식 소스로 교차 검증해야 합니다.','5개 섹션의 시장 조사 요약 보고서','','draft'],
['TPL-C3','분석·리서치','논문·보고서 비판적 검토','3','','논문이 길면 초록·방법론·결론만 넣어도 됩니다.','6개 항목의 구조화된 비판적 검토','','draft'],
['TPL-C4','분석·리서치','SWOT 분석','2','','정보가 적으면 일반적 산업 특성으로 채워지니 가설인지 사실인지 구분하세요.','SWOT 매트릭스 + 4가지 교차 전략','','draft'],
['TPL-C5','분석·리서치','트렌드 브리핑','2','','우리 사업과의 관계를 구체적으로 적으면 맞춤형 시사점이 나옵니다.','A4 1장 분량의 경영진 트렌드 브리핑','','draft'],
['TPL-D1','코드·기술','코드 리뷰 요청','2','','코드 전체 또는 PR diff를 넣으세요. 언어를 명시하면 더 정확합니다.','5개 기준별 리뷰 + 개선 코드 + 심각도 표기','','draft'],
['TPL-D2','코드·기술','버그 수정 요청','2','','에러 메시지와 기대 동작을 함께 넣으면 원인 파악이 빨라집니다.','원인 분석 + 수정 코드 + 예방 팁','','draft'],
['TPL-D3','코드·기술','리팩토링 요청','3','','목표를 명확히 하세요. 전부 개선해줘보다 중복 제거에 집중해줘가 낫습니다.','문제점 분석 + 리팩토링된 코드 + 변경 근거','','draft'],
['TPL-D4','코드·기술','API 문서 작성','2','','함수 시그니처나 라우터 코드를 넣으면 문서가 생성됩니다.','파라미터 표 + 응답 형식 + 사용 예시','','draft'],
['TPL-D5','코드·기술','테스트 케이스 생성','2','','대상 코드와 테스트 프레임워크를 명시하세요.','8~9개의 테스트 케이스가 설명과 코드로','','draft'],
['TPL-E1','고급기법','Chain-of-Thought','3','','예시의 풀이 과정이 정확해야 합니다. 틀린 풀이를 넣으면 그 오류를 모방해요. 단순 사실 질문에는 쓰지 마세요.','단계별 추론 과정 + 최종 답','Wei et al. (2022)','draft'],
['TPL-E2','고급기법','Self-Consistency','3','','정답이 하나로 수렴하는 분석·판단 문제에 적합합니다. 창작에는 부적합해요.','3가지 독립 분석 + 비교 + 최종 답','Wang et al. (2022)','draft'],
['TPL-E3','고급기법','Tree of Thoughts','3','','퍼즐·전략 수립처럼 탐색과 백트래킹이 필요한 과제에 적합합니다.','트리 탐색 기록 + 백트래킹 + 최적 경로 + 답','Yao et al. (2023)','draft'],
['TPL-E4','고급기법','Meta-Prompting','3','','여러 분야 전문성이 필요한 복합 과제에만. 3단계 검증을 생략하지 마세요.','서브태스크 분해 + 전문가별 결과 + 교차 검증 + 통합','Suzgun & Kalai (2024)','draft'],
['TPL-E5','고급기법','구조화 출력 (XML + JSON 스키마)','3','','XML 태그로 영역을 분리하고 JSON 스키마로 출력을 강제합니다. API 연동에 유용해요.','지정한 JSON 스키마에 맞는 구조화된 결과','Anthropic 공식 가이드','draft']
];

/* ══════════════════════════ 실행 함수 ══════════════════════════ */

/** 전체 구축 — 구조 + 초기 데이터. 기존 내용을 지우고 다시 씁니다. */
function setupAll() {
  var ss = SpreadsheetApp.getActive();
  buildTab_(ss, 'lessons',   LESSONS);
  buildTab_(ss, 'terms',     TERMS);
  buildTab_(ss, 'templates', TEMPLATES);
  buildTab_(ss, 'resources', RESOURCES);
  buildTab_(ss, 'quiz',      QUIZ);
  removeDefaultSheet_(ss);
  ss.setActiveSheet(ss.getSheetByName('lessons'));
  SpreadsheetApp.getUi().alert(
    '구축 완료\n\n' +
    'lessons ' + LESSONS.length + '행\n' +
    'terms ' + TERMS.length + '행\n' +
    'templates ' + TEMPLATES.length + '행 (본문은 Phase 01에서 입력)\n' +
    'resources ' + RESOURCES.length + '행\n' +
    'quiz ' + QUIZ.length + '행\n\n' +
    '다음 단계: 파일 → 공유 → 웹에 게시 → 탭별 CSV 게시');
}

/** 구조만 — 헤더·서식·유효성검사만 만들고 데이터는 건드리지 않습니다. */
function setupStructureOnly() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(TABS).forEach(function(name){ buildTab_(ss, name, null); });
  removeDefaultSheet_(ss);
}

function buildTab_(ss, name, rows) {
  var spec = TABS[name];
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);

  if (rows) sh.clear();
  else sh.getRange(1, 1, 1, spec.headers.length).clearContent();

  // 헤더
  var hr = sh.getRange(1, 1, 1, spec.headers.length);
  hr.setValues([spec.headers])
    .setBackground(CONF.headerBg).setFontColor(CONF.headerFg)
    .setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 30);

  // 열 너비
  spec.widths.forEach(function(w, i){ sh.setColumnWidth(i + 1, w); });

  // 데이터
  if (rows && rows.length) {
    sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  // 유효성 검사 — 헤더명으로 열을 찾습니다 (열 위치에 의존하지 않음)
  if (spec.valid) {
    Object.keys(spec.valid).forEach(function(col){
      var idx = spec.headers.indexOf(col);
      if (idx < 0) return;
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(spec.valid[col], true)
        .setAllowInvalid(false)
        .setHelpText(col + ' 허용값: ' + spec.valid[col].join(', '))
        .build();
      sh.getRange(2, idx + 1, Math.max(sh.getMaxRows() - 1, 500), 1).setDataValidation(rule);
    });
  }

  // 본문 서식
  var last = Math.max(sh.getLastRow(), 2);
  var body = sh.getRange(2, 1, last - 1, spec.headers.length);
  body.setVerticalAlignment('top').setWrap(true).setFontSize(10);

  // 여분 열 제거
  var extra = sh.getMaxColumns() - spec.headers.length;
  if (extra > 0) sh.deleteColumns(spec.headers.length + 1, extra);

  sh.setTabColor(CONF.headerBg);
}

function removeDefaultSheet_(ss) {
  ['Sheet1', '시트1'].forEach(function(n){
    var sh = ss.getSheetByName(n);
    if (sh && ss.getSheets().length > 1 && sh.getLastRow() === 0) ss.deleteSheet(sh);
  });
}

/* ══════════════════════════ 자동 재배포 트리거 ══════════════════════════
   Vercel Deploy Hook 이 준비된 뒤에 설정합니다 (Phase 00 후반).
   1. setDeployHook('https://api.vercel.com/v1/integrations/deploy/...') 를 한 번 실행
   2. installOnChangeTrigger() 를 한 번 실행
   디바운스 5분 — 연속 편집이 매번 배포를 유발하지 않도록 합니다 (R-09-1). */

var PROP_HOOK  = 'DEPLOY_HOOK_URL';
var PROP_LAST  = 'LAST_DEPLOY_AT';
var DEBOUNCE_MS = 5 * 60 * 1000;

function setDeployHook(url) {
  if (!url) throw new Error('Deploy Hook URL 을 인자로 넘겨주세요.');
  PropertiesService.getScriptProperties().setProperty(PROP_HOOK, url);
}

function installOnChangeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === 'onSheetChange') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSheetChange')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();
}

function onSheetChange(e) {
  var p = PropertiesService.getScriptProperties();
  var hook = p.getProperty(PROP_HOOK);
  if (!hook) return;

  var now  = Date.now();
  var last = Number(p.getProperty(PROP_LAST) || 0);
  if (now - last < DEBOUNCE_MS) return;   // 디바운스 창 안 — 병합

  var ok = false, err = '';
  for (var i = 0; i < 3 && !ok; i++) {
    try {
      var res = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
      if (res.getResponseCode() < 400) ok = true;
      else err = 'HTTP ' + res.getResponseCode();
    } catch (ex) { err = String(ex); }
    if (!ok) Utilities.sleep(2000);
  }

  if (ok) {
    p.setProperty(PROP_LAST, String(now));
  } else {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
      '[Edu-Hub] 재배포 실패',
      '시트 변경 후 Deploy Hook 호출이 3회 모두 실패했습니다.\n오류: ' + err +
      '\n\n시트는 저장됐지만 사이트에 반영되지 않았습니다. Vercel 상태를 확인하세요.');
  }
}

/** 연결 점검 — Deploy Hook 이 살아 있는지 수동 확인 */
function testDeployHook() {
  var hook = PropertiesService.getScriptProperties().getProperty(PROP_HOOK);
  if (!hook) { SpreadsheetApp.getUi().alert('Deploy Hook 이 설정되지 않았습니다. setDeployHook(url) 을 먼저 실행하세요.'); return; }
  var res = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
  SpreadsheetApp.getUi().alert('응답 코드: ' + res.getResponseCode() + '\n' + res.getContentText().slice(0, 300));
}
