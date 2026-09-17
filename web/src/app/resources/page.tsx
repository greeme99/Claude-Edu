import type { Metadata } from 'next';
import { getResources } from '@/lib/content';

export const metadata: Metadata = {
  title: '자료실',
  description: '공식 문서·무료 강의·한국어 자료·논문·도구 모음.'
};

const CATS = ['한국어자료', '공식문서', '무료강의', '논문', '도구'];
const STALE_DAYS = 180;

export default function Resources() {
  const all = getResources();
  const stale = (d: string) => d && (Date.now() - new Date(d).getTime()) > STALE_DAYS * 86400000;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">참조</p>
      <h1 className="mb-2 font-display text-[34px] font-bold leading-tight tracking-tight">자료실</h1>
      <p className="mb-9 max-w-[60ch] text-[14.5px] text-muted">
        다음 단계로 넘어갈 자료 {all.length}개. 한국어 자료를 먼저 배치했습니다.
      </p>

      {CATS.map(cat => {
        const rows = all.filter(r => r.category === cat).sort((a, b) => a.level - b.level);
        if (!rows.length) return null;
        return (
          <section key={cat}>
            <div className="stratum mb-3.5 mt-9 flex items-baseline justify-between pb-2">
              <h2 className="font-display text-[17px] font-bold">{cat}</h2>
              <span className="font-mono text-[11.5px] text-muted">{rows.length}개</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {rows.map(r => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-md border border-line bg-surface px-5 py-3.5 transition-all hover:-translate-y-px hover:border-indigo hover:shadow-md">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="font-display text-[15.5px] font-bold tracking-tight">{r.title}</span>
                      <span className="tracking-[0.14em] text-[11px] text-indigo" aria-label={`난이도 ${r.level}`}>{'★'.repeat(r.level)}</span>
                      <span className="rounded-sm border border-line bg-surface-2 px-1.5 py-px font-mono text-[10px] uppercase text-muted">{r.lang}</span>
                      {stale(r.checked_at) && (
                        <span className="rounded-sm bg-ochre-soft px-1.5 py-px font-mono text-[10px] font-semibold text-ochre">링크 확인 필요</span>
                      )}
                      <svg className="ml-auto text-faint" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </div>
                    {r.note && <p className="mt-1 mb-0 text-[13px] leading-relaxed text-muted">{r.note}</p>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
