import type { MDXComponents } from 'mdx/types';
import Callout from '@/components/mdx/Callout';
import Step from '@/components/mdx/Step';
import TryIt from '@/components/mdx/TryIt';
import Troubleshoot from '@/components/mdx/Troubleshoot';
import Checklist from '@/components/mdx/Checklist';
import LessonLink from '@/components/mdx/LessonLink';
import Term from '@/components/mdx/Term';
import CodeBlock from '@/components/mdx/CodeBlock';

/**
 * MDX 본문에서 쓸 수 있는 컴포넌트와 기본 태그 스타일.
 * 본문에 클래스를 직접 쓰지 않고 여기서 한 번에 지정합니다 — 21편의 일관성이 여기서 결정됩니다.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...p }) => (
      <div className="stratum mb-3.5 mt-11">
        <h2 {...p} className="scroll-mt-20 font-display text-[20px] font-bold tracking-tight">{children}</h2>
      </div>
    ),
    h3: ({ children, ...p }) => (
      <h3 {...p} className="mb-2 mt-8 scroll-mt-20 font-display text-[17px] font-bold tracking-tight">{children}</h3>
    ),
    p: p => <p {...p} className="mb-4 max-w-[64ch] text-[15.5px] leading-[1.85] text-ink-2" />,
    ul: p => <ul {...p} className="mb-4 max-w-[64ch] list-disc pl-5 text-[15.5px] leading-[1.85] text-ink-2 marker:text-line-2" />,
    ol: p => <ol {...p} className="mb-4 max-w-[64ch] list-decimal pl-5 text-[15.5px] leading-[1.85] text-ink-2 marker:text-indigo marker:font-mono marker:text-[13px]" />,
    li: p => <li {...p} className="mb-1" />,
    strong: p => <strong {...p} className="font-semibold text-ink" />,
    a: ({ href, ...p }) => {
      const ext = href?.startsWith('http');
      return <a href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...p}
        className="font-medium text-indigo underline decoration-line-2 underline-offset-2 transition-colors hover:decoration-indigo" />;
    },
    blockquote: p => (
      <blockquote {...p} className="mb-5 max-w-[64ch] border-l-[3px] border-line-2 bg-surface-2 py-3 pl-4 pr-4 text-[15px] italic leading-[1.8] text-ink-2 [&>p]:mb-0" />
    ),
    hr: () => <hr className="my-9 border-0 border-t border-line" />,
    table: p => (
      <div className="mb-6 overflow-x-auto rounded-md border border-line bg-surface">
        <table {...p} className="w-full min-w-[440px] border-collapse text-[13.5px]" />
      </div>
    ),
    thead: p => <thead {...p} className="bg-surface-2" />,
    th: p => <th {...p} className="border-b border-line-2 px-3.5 py-2.5 text-left font-mono text-[10.5px] font-semibold uppercase tracking-wider text-muted" />,
    td: p => <td {...p} className="border-b border-line px-3.5 py-2.5 align-top leading-relaxed" />,
    code: p => <code {...p} className="rounded-sm border border-line bg-surface-2 px-1 py-0.5 font-mono text-[0.86em]" />,
    pre: CodeBlock,
    Callout, Step, TryIt, Troubleshoot, Checklist, LessonLink, Term,
    ...components
  };
}
