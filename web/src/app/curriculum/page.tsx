import type { Metadata } from 'next';
import { getLessonsByTrack } from '@/lib/content';
import LessonCard from '@/components/LessonCard';

export const metadata: Metadata = {
  title: '커리큘럼',
  description: '이론 7차시와 실습 14차시의 전체 구조.'
};

export default function Curriculum() {
  const tracks = [
    { key: 'theory'   as const, name: '이론', desc: '개념과 원리를 이해합니다' },
    { key: 'practice' as const, name: '실습', desc: '직접 해보며 익힙니다' }
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">커리큘럼</p>
      <h1 className="mb-2 font-display text-[34px] font-bold leading-tight tracking-tight">이론과 실습</h1>
      <p className="mb-10 max-w-[60ch] text-[14.5px] text-muted">
        이론과 실습은 짝을 이루어 서로를 참조합니다. <span className="font-mono text-[12.5px]">↔</span> 표시가 대응 차시입니다.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        {tracks.map(t => {
          const lessons = getLessonsByTrack(t.key);
          return (
            <section key={t.key}>
              <div className="mb-4 flex items-baseline gap-2.5 border-b border-line-2 pb-3">
                <h2 className="font-display text-[19px] font-bold">{t.name}</h2>
                <span className="font-mono text-[11.5px] tracking-wider text-indigo">{lessons.length}차시</span>
                <span className="ml-auto text-[13px] text-muted">{t.desc}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {lessons.map(l => <LessonCard key={l.id} lesson={l} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
