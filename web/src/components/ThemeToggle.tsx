'use client';
import { useEffect, useState } from 'react';

type Mode = 'system' | 'light' | 'dark';
const NEXT: Record<Mode, Mode> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<Mode, string> = { system: '시스템 테마', light: '라이트 테마', dark: '다크 테마' };

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as Mode | null;
      if (saved) apply(saved);
    } catch { /* 저장소 접근이 막힌 환경 — 시스템 설정을 그대로 씁니다 */ }
  }, []);

  function apply(m: Mode) {
    setMode(m);
    const el = document.documentElement;
    if (m === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', m);
    try { localStorage.setItem('theme', m); } catch { /* 무시 */ }
  }

  return (
    <button
      onClick={() => apply(NEXT[mode])}
      aria-label={`${LABEL[mode]} — 클릭하면 ${LABEL[NEXT[mode]]}로 바뀝니다`}
      title={LABEL[mode]}
      className="grid h-8 w-8 place-items-center rounded-md border border-line-2 text-muted transition-colors hover:border-muted hover:text-ink"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 000 16z" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}
