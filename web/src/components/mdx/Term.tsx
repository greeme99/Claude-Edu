import Link from 'next/link';
import { getTerm } from '@/lib/content';

/**
 * 본문 용어 마킹. v1은 용어사전 앵커로 이동합니다.
 * 호버 팝오버는 Phase 03에서 클라이언트 컴포넌트로 올립니다 (F-05).
 */
export default function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const t = getTerm(id);
  if (!t) return <span className="text-ochre">[미등록 용어: {id}]</span>;
  return (
    <Link href={`/terms#${t.id}`} className="term-mark" title={t.definition}>
      {children ?? t.ko}
    </Link>
  );
}
