'use client';
import { useMemo, useState } from 'react';

export interface FilterItem { id: string; category: string }

export default function FilterList<T extends FilterItem>({
  items, categories, searchable, searchKeys, render, emptyLabel = '조건에 맞는 항목이 없습니다'
}: {
  items: T[];
  categories: readonly string[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  render: (grouped: [string, T[]][]) => React.ReactNode;
  emptyLabel?: string;
}) {
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');

  const grouped = useMemo(() => {
    const lq = q.trim().toLowerCase();
    const filtered = items.filter(it => {
      if (cat !== 'all' && it.category !== cat) return false;
      if (!lq) return true;
      return (searchKeys ?? []).some(k => String(it[k] ?? '').toLowerCase().includes(lq));
    });
    return categories
      .map(c => [c, filtered.filter(it => it.category === c)] as [string, T[]])
      .filter(([, rows]) => rows.length > 0);
  }, [items, categories, cat, q, searchKeys]);

  const reset = () => { setCat('all'); setQ(''); };
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
      active ? 'border-indigo bg-indigo font-semibold text-on-indigo'
             : 'border-line-2 bg-surface text-muted hover:border-muted hover:text-ink'}`;

  return (
    <>
      {searchable && (
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="한국어나 영어로 검색하세요" aria-label="검색"
          className="mb-3.5 w-full rounded-md border border-line-2 bg-surface px-4 py-2.5 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-indigo focus:ring-[3px] focus:ring-indigo-soft"
        />
      )}
      <div className="mb-7 flex flex-wrap gap-1.5">
        <button onClick={() => setCat('all')} aria-pressed={cat === 'all'} className={chip(cat === 'all')}>전체</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={chip(cat === c)}>{c}</button>
        ))}
      </div>
      {grouped.length === 0 ? (
        <div className="rounded-md border border-line bg-surface px-5 py-12 text-center">
          <p className="mb-3.5 text-[14px] text-muted">{emptyLabel}</p>
          <button onClick={reset} className="rounded-md border border-line-2 bg-surface px-4 py-2 text-[14px] text-ink-2 transition-colors hover:border-indigo hover:text-indigo">
            필터 초기화
          </button>
        </div>
      ) : render(grouped)}
    </>
  );
}
