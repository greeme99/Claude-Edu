import Link from 'next/link';
import { getAllLessons, lessonHref, TRACK_LABEL } from '@/lib/content';

/**
 * 차시 상호참조. **순번을 본문에 하드코딩하지 않습니다** (R-02-2).
 * 빌드 시 실제 제목·경로로 치환되고, 없는 ID면 검증 게이트가 빌드를 막습니다 (V-05).
 */
export default function LessonLink({ id, children }: { id: string; children?: React.ReactNode }) {
  const l = getAllLessons().find(x => x.id === id);
  if (!l) return <span className="text-ochre">[깨진 참조: {id}]</span>;

  const label = children ?? `${TRACK_LABEL[l.track]} ${l.seq}차시 · ${l.title}`;
  if (l.status !== 'published') {
    return <span className="text-muted" title="아직 공개되지 않은 차시입니다">{label}</span>;
  }
  return (
    <Link href={lessonHref(l)} className="font-medium text-indigo underline decoration-line-2 underline-offset-2 transition-colors hover:decoration-indigo">
      {label}
    </Link>
  );
}
