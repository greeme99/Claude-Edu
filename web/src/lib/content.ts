/**
 * 콘텐츠 로더 — 빌드 시점에 .content-cache 의 정적 JSON을 읽습니다.
 * 런타임에는 어떤 외부 호출도 하지 않습니다 (C-02).
 */
import fs from 'node:fs';
import path from 'node:path';

const CACHE = path.join(process.cwd(), '.content-cache');
const read = <T>(name: string): T[] =>
  JSON.parse(fs.readFileSync(path.join(CACHE, `${name}.json`), 'utf8'));

export type Track = 'theory' | 'practice';
export type Status = 'draft' | 'review' | 'published';

export interface Lesson {
  id: string; track: Track; seq: number; title: string; slug: string;
  status: Status; updated_at: string; note?: string;
}
export interface Term {
  id: string; ko: string; en: string; category: string; definition: string;
  refs: string[]; aliases: string[]; status: Status;
}
export interface Template {
  id: string; category: string; title: string; level: number;
  body: string; usage: string; expected: string; source: string; status: Status;
}
export interface Resource {
  id: string; category: string; title: string; url: string;
  level: number; lang: 'ko' | 'en'; note: string; checked_at: string;
}
export interface Quiz {
  id: string; lesson_id: string; type: 'choice' | 'open';
  question: string; options: string[]; answer: number | null; hint: string;
}

const published = <T extends { status?: Status }>(rows: T[]) =>
  rows.filter(r => !r.status || r.status === 'published');

/** 공개된 차시만. draft 는 페이지를 생성하지 않습니다 (R-01-1) */
export const getLessons = (): Lesson[] =>
  published(read<Lesson>('lessons')).sort((a, b) => a.seq - b.seq);

/** draft 포함 — 커리큘럼에서 "집필 예정"을 보여주기 위해 */
export const getAllLessons = (): Lesson[] =>
  read<Lesson>('lessons').sort((a, b) => a.seq - b.seq);

export const getLessonsByTrack = (t: Track) => getAllLessons().filter(l => l.track === t);
export const getLesson = (t: Track, slug: string) =>
  getLessons().find(l => l.track === t && l.slug === slug);

export const getTerms = (): Term[] =>
  published(read<Term>('terms')).sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
export const getTerm = (id: string) => getTerms().find(t => t.id === id);
export const getTermsForLesson = (lessonId: string) =>
  getTerms().filter(t => t.refs.includes(lessonId));

export const getTemplates = (): Template[] => read<Template>('templates');
export const getResources = (): Resource[] => read<Resource>('resources');
export const getQuiz = (lessonId: string): Quiz[] =>
  read<Quiz>('quiz').filter(q => q.lesson_id === lessonId);

export const TERM_CATEGORIES = [
  '기초개념', '학습·정렬', '프롬프트·컨텍스트', '에이전트·도구', '생태계·안전'
] as const;

export const TRACK_LABEL: Record<Track, string> = { theory: '이론', practice: '실습' };

/** 이론 ↔ 실습 대응 (IA §4.4). 시트로 옮기기 전까지 여기서 관리합니다. */
export const LESSON_PAIRS: Record<string, string> = {
  'TH-02': 'PR-02', 'PR-02': 'TH-02',
  'TH-03': 'PR-06', 'PR-06': 'TH-03',
  'TH-04': 'PR-07', 'PR-07': 'TH-04',
  'TH-05': 'PR-08', 'PR-08': 'TH-05',
  'TH-07': 'PR-13', 'PR-13': 'TH-07'
};

export const lessonHref = (l: Lesson) => `/${l.track}/${l.slug}`;
export const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
