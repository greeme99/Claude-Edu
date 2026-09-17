import type { Metadata } from 'next';
import { getTerms, TERM_CATEGORIES } from '@/lib/content';
import TermList from './TermList';

export const metadata: Metadata = {
  title: '용어사전',
  description: '클로드 교육 과정에서 사용되는 핵심 용어를 카테고리별로 정리했습니다.'
};

export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">참조</p>
      <h1 className="mb-2 font-display text-[34px] font-bold leading-tight tracking-tight">용어사전</h1>
      <p className="mb-8 max-w-[60ch] text-[14.5px] text-muted">
        교재 전체에서 사용된 핵심 용어 {getTerms().length}개입니다. 각 용어에서 설명된 차시로 이동할 수 있습니다.
      </p>
      <TermList terms={getTerms()} categories={[...TERM_CATEGORIES]} />
    </div>
  );
}
