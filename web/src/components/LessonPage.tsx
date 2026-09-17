import Link from 'next/link';
import {
  type Track, getLesson, getLessons, getTermsForLesson, getQuiz,
  getAllLessons, lessonHref, LESSON_PAIRS, TRACK_LABEL, formatDate
} from '@/lib/content';
import { notFound } from 'next/navigation';
import LessonBody from './LessonBody';

export default function LessonPage({ track, slug }: { track: Track; slug: string }) {
  const lesson = getLesson(track, slug);
  if (!lesson) notFound();

  const siblings = getLessons().filter(l => l.track === track);
  const idx  = siblings.findIndex(l => l.id === lesson.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const terms = getTermsForLesson(lesson.id);
  const quiz  = getQuiz(lesson.id);
  const pairId = LESSON_PAIRS[lesson.id];
  const pair = pairId ? getAllLessons().find(l => l.id === pairId) : undefined;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_210px]">
      <article className="min-w-0">
        <div className="mb-3 flex items-center gap-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.13em] text-indigo">
          <span className="flex flex-col gap-0.5" aria-hidden="true">
            <i className="block h-0.5 w-4 rounded-sm bg-indigo" />
            <i className="block h-0.5 w-2.5 rounded-sm bg-indigo opacity-60" />
          </span>
          {TRACK_LABEL[track]} · {lesson.seq}차시
        </div>

        <h1 className="mb-3 text-balance font-display text-[37px] font-bold leading-[1.24] tracking-tight">
          {lesson.title}
        </h1>
        <p className="mb-8 border-b border-line pb-6 font-mono text-[11.5px] text-faint">
          {formatDate(lesson.updated_at)} 갱신
        </p>

        <LessonBody track={track} slug={slug} />

        {terms.length > 0 && (
          <section className="mb-10">
            <div className="stratum mb-3.5">
              <h2 className="font-display text-[20px] font-bold tracking-tight">핵심 용어</h2>
            </div>
            <ul className="flex flex-wrap gap-2">
              {terms.map(t => (
                <li key={t.id}>
                  <Link href={`/terms#${t.id}`}
                    className="inline-block rounded-full border border-line-2 bg-surface px-3.5 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-indigo hover:bg-indigo-soft hover:text-indigo">
                    {t.ko}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {quiz.length > 0 && (
          <section className="mb-10">
            <div className="stratum mb-3.5">
              <h2 className="font-display text-[20px] font-bold tracking-tight">확인 문제</h2>
            </div>
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
              {quiz.map((q, i) => (
                <li key={q.id} className="rounded-md border border-line bg-surface px-5 py-4">
                  <p className="mb-2.5 text-[14.5px] font-semibold leading-snug">
                    Q{i + 1}. {q.question}
                  </p>
                  {q.type === 'choice' && (
                    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                      {q.options.map((o, j) => (
                        <li key={j} className="rounded border border-line px-3.5 py-2 text-[14px] text-ink-2">
                          {String.fromCharCode(65 + j)}. {o}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.hint && (
                    <details className="mt-2.5">
                      <summary className="cursor-pointer text-[13px] text-muted">힌트 보기</summary>
                      <p className="mt-2 mb-0 rounded bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-ink-2">{q.hint}</p>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        <nav className="mt-11 grid gap-2.5 border-t border-line pt-7 sm:grid-cols-2">
          {prev ? (
            <Link href={lessonHref(prev)} className="rounded-md border border-line bg-surface px-4 py-3.5 transition-colors hover:border-indigo hover:bg-indigo-soft">
              <div className="mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-indigo">◀ 이전 · {TRACK_LABEL[track]} {prev.seq}차시</div>
              <div className="font-display text-[15px] font-bold leading-snug">{prev.title}</div>
            </Link>
          ) : <div className="rounded-md border border-line px-4 py-3.5 opacity-40"><div className="font-mono text-[10.5px] uppercase tracking-wider text-muted">첫 차시입니다</div></div>}
          {next ? (
            <Link href={lessonHref(next)} className="rounded-md border border-line bg-surface px-4 py-3.5 transition-colors hover:border-indigo hover:bg-indigo-soft sm:text-right">
              <div className="mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-indigo">다음 · {TRACK_LABEL[track]} {next.seq}차시 ▶</div>
              <div className="font-display text-[15px] font-bold leading-snug">{next.title}</div>
            </Link>
          ) : <div className="rounded-md border border-line px-4 py-3.5 opacity-40 sm:text-right"><div className="font-mono text-[10.5px] uppercase tracking-wider text-muted">마지막 차시입니다</div></div>}
        </nav>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-20 border-l border-line pl-4">
          <h3 className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            {TRACK_LABEL[track]} 차시
          </h3>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {siblings.map(l => (
              <li key={l.id}>
                <Link href={lessonHref(l)}
                  className={`block border-l-2 py-1 pl-2.5 text-[12.5px] leading-snug transition-colors ${
                    l.id === lesson.id
                      ? 'border-indigo font-semibold text-ink'
                      : 'border-transparent text-muted hover:text-ink'}`}>
                  {l.seq}. {l.title}
                </Link>
              </li>
            ))}
          </ul>
          {pair && (
            <>
              <h3 className="mt-6 mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                관련 {TRACK_LABEL[pair.track]}
              </h3>
              <Link href={lessonHref(pair)} className="block text-[12.5px] font-semibold leading-snug text-indigo hover:opacity-70">
                {TRACK_LABEL[pair.track]} {pair.seq}차시 · {pair.title}
              </Link>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
