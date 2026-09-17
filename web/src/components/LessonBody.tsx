import Callout from '@/components/mdx/Callout';

interface Frontmatter { summary?: string; keyQuestion?: string; goals?: string[] }

/**
 * MDX 본문 로더.
 * 동적 import 는 **상대 경로**여야 합니다. webpack 이 정적 접두사로 컨텍스트를 만들기 때문에
 * tsconfig 별칭(@content)으로는 해결되지 않습니다.
 * 파일이 없는 차시는 "본문 준비 중"으로 대체합니다 (Phase 01 진행 중).
 */
export default async function LessonBody({ track, slug }: { track: string; slug: string }) {
  try {
    const mod = await import(`../../content/${track}/${slug}.mdx`);
    const Body = mod.default as React.ComponentType;
    const fm = (mod.frontmatter ?? {}) as Frontmatter;

    return (
      <>
        {fm.goals && fm.goals.length > 0 && (
          <Callout type="goal">
            <ul>{fm.goals.map((g, i) => <li key={i}>{g}</li>)}</ul>
          </Callout>
        )}
        {fm.keyQuestion && <Callout type="q">{fm.keyQuestion}</Callout>}
        <Body />
      </>
    );
  } catch {
    return (
      <div className="mb-6 max-w-[64ch] rounded-md border border-dashed border-line-2 bg-surface-2 px-5 py-6">
        <p className="mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">본문 준비 중</p>
        <p className="m-0 text-[14.5px] text-ink-2">
          이 차시의 본문은 <code className="rounded-sm bg-surface px-1 py-0.5 font-mono text-[13px]">content/{track}/{slug}.mdx</code> 에 들어갑니다.
          아래 핵심 용어와 확인 문제는 시트의 실제 데이터입니다.
        </p>
      </div>
    );
  }
}
