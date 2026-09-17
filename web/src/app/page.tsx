import Link from 'next/link';
import { getAllLessons, getTerms, getTemplates, getResources, lessonHref } from '@/lib/content';

export default function Home() {
  const lessons = getAllLessons();
  const recent = lessons.filter(l => l.status === 'published' && l.updated_at)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 3);

  const tiles = [
    { href: '/curriculum', label: '커리큘럼', desc: `이론 ${lessons.filter(l => l.track === 'theory').length}차시 · 실습 ${lessons.filter(l => l.track === 'practice').length}차시` },
    { href: '/terms',      label: '용어사전', desc: `핵심 용어 ${getTerms().length}개` },
    { href: '/templates',  label: '템플릿',   desc: `프롬프트 템플릿 ${getTemplates().length}개` },
    { href: '/resources',  label: '자료실',   desc: `추가 학습자료 ${getResources().length}개` }
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">
        Claude Edu-Hub
      </p>
      <h1 className="mb-3 max-w-[22ch] text-balance font-display text-[34px] font-bold leading-tight tracking-tight">
        프롬프트에서 Cowork까지, 다섯 개의 계층
      </h1>
      <p className="mb-12 max-w-[58ch] text-[15px] text-muted">
        클로드를 실무에 쓰기 위해 필요한 것을 계층 순서대로 정리했습니다.
        개념을 이해하는 이론과, 직접 해보는 실습이 짝을 이룹니다.
      </p>

      <div className="mb-14 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(t => (
          <Link key={t.href} href={t.href}
            className="rounded-md border border-line bg-surface px-4 py-4 transition-all hover:-translate-y-px hover:border-indigo hover:shadow-md">
            <div className="font-display text-[17px] font-bold">{t.label}</div>
            <div className="mt-0.5 font-mono text-[11.5px] text-muted">{t.desc}</div>
          </Link>
        ))}
      </div>

      {recent.length > 0 && (
        <section>
          <div className="stratum mb-4">
            <h2 className="font-display text-[20px] font-bold tracking-tight">최근 갱신</h2>
          </div>
          <ul className="flex flex-col gap-1.5">
            {recent.map(l => (
              <li key={l.id}>
                <Link href={lessonHref(l)} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md px-2 py-2 transition-colors hover:bg-surface-2">
                  <span className="font-mono text-[11.5px] text-indigo">
                    {l.track === 'theory' ? '이론' : '실습'} {String(l.seq).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[15.5px] font-bold">{l.title}</span>
                  <span className="ml-auto font-mono text-[10.5px] text-faint">{l.updated_at}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
