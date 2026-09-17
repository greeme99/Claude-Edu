import Link from 'next/link';
import { type Lesson, lessonHref, LESSON_PAIRS, TRACK_LABEL, getAllLessons } from '@/lib/content';

export default function LessonCard({ lesson }: { lesson: Lesson }) {
  const isDraft = lesson.status !== 'published';
  const pairId  = LESSON_PAIRS[lesson.id];
  const pair    = pairId ? getAllLessons().find(l => l.id === pairId) : undefined;

  const inner = (
    <>
      <div className="mb-0.5 flex items-center justify-between gap-3">
        <span className="font-mono text-[11.5px] font-semibold tracking-wider text-indigo">
          {String(lesson.seq).padStart(2, '0')}
        </span>
        {isDraft ? (
          <span className="rounded-sm bg-ochre-soft px-1.5 py-px font-mono text-[10px] font-semibold tracking-wider text-ochre">
            집필 예정
          </span>
        ) : pair ? (
          <span className="rounded-full border border-line-2 bg-surface-2 px-2 py-px font-mono text-[10.5px] text-muted">
            ↔ {TRACK_LABEL[pair.track]} {String(pair.seq).padStart(2, '0')}
          </span>
        ) : null}
      </div>
      <span className="font-display text-[16.5px] font-bold leading-snug tracking-tight">{lesson.title}</span>
      {lesson.updated_at && (
        <span className="mt-1 self-end font-mono text-[10.5px] text-faint">{lesson.updated_at} 갱신</span>
      )}
    </>
  );

  const cls = 'flex w-full flex-col gap-1 rounded-md border border-line bg-surface px-4 py-3 text-left transition-all';

  return isDraft
    ? <div className={`${cls} opacity-60`}>{inner}</div>
    : <Link href={lessonHref(lesson)} className={`${cls} hover:-translate-y-px hover:border-indigo hover:shadow-md`}>{inner}</Link>;
}
