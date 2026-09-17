import type { Metadata } from 'next';
import { getTemplates } from '@/lib/content';

export const metadata: Metadata = {
  title: '프롬프트 템플릿',
  description: '복사해서 바로 쓸 수 있는 프롬프트 템플릿 모음.'
};

const CATS = ['업무문서', '마케팅·콘텐츠', '분석·리서치', '코드·기술', '고급기법'];

export default function Templates() {
  const all = getTemplates();
  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">참조</p>
      <h1 className="mb-2 font-display text-[34px] font-bold leading-tight tracking-tight">프롬프트 템플릿</h1>
      <p className="mb-9 max-w-[60ch] text-[14.5px] text-muted">
        템플릿 {all.length}개. 대괄호 부분만 본인 상황으로 바꾸면 됩니다.
        본문은 콘텐츠 이관 단계에서 채워집니다.
      </p>

      {CATS.map(cat => {
        const rows = all.filter(t => t.category === cat);
        if (!rows.length) return null;
        return (
          <section key={cat}>
            <div className="stratum mb-3.5 mt-9 flex items-baseline justify-between pb-2">
              <h2 className="font-display text-[17px] font-bold">{cat}</h2>
              <span className="font-mono text-[11.5px] text-muted">{rows.length}개</span>
            </div>
            {rows.map(t => (
              <article key={t.id} className="mb-2.5 rounded-md border border-line bg-surface px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-[16.5px] font-bold tracking-tight">{t.title}</h3>
                    {t.usage && <p className="mt-1 mb-0 text-[13px] leading-relaxed text-muted">{t.usage}</p>}
                  </div>
                  <span className="shrink-0 tracking-[0.14em] text-[11.5px] text-indigo" aria-label={`난이도 ${t.level}`}>
                    {'★'.repeat(t.level)}
                  </span>
                </div>
                {t.expected && (
                  <p className="mt-2.5 mb-0 border-t border-line pt-2.5 text-[13px] text-ink-2">
                    <span className="mr-2 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-indigo">결과</span>
                    {t.expected}
                  </p>
                )}
                {t.source && <p className="mt-1.5 mb-0 font-mono text-[11px] text-faint">{t.source}</p>}
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
