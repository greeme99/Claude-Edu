'use client';
import Link from 'next/link';
import FilterList from '@/components/FilterList';
import type { Term } from '@/lib/content';

export default function TermList({ terms, categories }: { terms: Term[]; categories: string[] }) {
  return (
    <FilterList
      items={terms}
      categories={categories}
      searchable
      searchKeys={['ko', 'en', 'definition']}
      emptyLabel="조건에 맞는 용어가 없습니다"
      render={grouped => (
        <>
          {grouped.map(([cat, rows]) => (
            <section key={cat}>
              <div className="stratum mb-3.5 mt-9 flex items-baseline justify-between pb-2">
                <h2 className="font-display text-[17px] font-bold">{cat}</h2>
                <span className="font-mono text-[11.5px] text-muted">{rows.length}개</span>
              </div>
              {rows.map(t => (
                <article key={t.id} id={t.id} className="mb-2.5 scroll-mt-20 rounded-md border border-line bg-surface px-5 py-4 target:border-indigo target:ring-[3px] target:ring-indigo-soft">
                  <h3 className="font-display text-[17px] font-bold tracking-tight">{t.ko}</h3>
                  {t.en && <p className="mb-2 mt-0.5 font-mono text-[11.5px] tracking-wide text-indigo">{t.en}</p>}
                  <p className="mb-2.5 text-[14px] leading-relaxed text-ink-2">{t.definition}</p>
                  {t.refs.length > 0 && (
                    <p className="m-0 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5 text-[12.5px] text-muted">
                      관련 차시
                      {t.refs.map(r => (
                        <Link key={r} href="/curriculum" className="font-mono font-medium text-indigo transition-opacity hover:opacity-70">{r}</Link>
                      ))}
                    </p>
                  )}
                </article>
              ))}
            </section>
          ))}
        </>
      )}
    />
  );
}
