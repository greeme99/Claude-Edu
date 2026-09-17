import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '/curriculum', label: '커리큘럼' },
  { href: '/terms',      label: '용어사전' },
  { href: '/templates',  label: '템플릿' },
  { href: '/resources',  label: '자료실' }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
        <Link href="/" className="flex items-baseline gap-2 font-display text-[17px] font-bold tracking-tight">
          {/* 층위 시그니처 — 커리큘럼의 5개 계층 구조에서 가져온 마크 */}
          <span className="flex -translate-y-px flex-col gap-[1.5px]" aria-hidden="true">
            <i className="block h-[1.5px] w-[13px] rounded-sm bg-indigo" />
            <i className="block h-[1.5px] w-[9px] rounded-sm bg-indigo opacity-70" />
            <i className="block h-[1.5px] w-[5px] rounded-sm bg-indigo opacity-45" />
          </span>
          Edu-Hub
        </Link>
        <nav className="hidden gap-5 text-[13.5px] text-muted sm:flex">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="py-0.5 transition-colors hover:text-ink">{n.label}</Link>
          ))}
        </nav>
        <span className="flex-1" />
        <ThemeToggle />
      </div>
    </header>
  );
}
