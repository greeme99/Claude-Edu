const STYLE = {
  key:   { box: 'border-line bg-surface-2',              label: '핵심 정리', tone: 'text-muted' },
  goal:  { box: 'border-line border-l-[3px] border-l-indigo bg-surface', label: '학습 목표', tone: 'text-muted' },
  q:     { box: 'border-transparent bg-indigo-soft',      label: '핵심 질문', tone: 'text-indigo' },
  warn:  { box: 'border-line border-l-[3px] border-l-ochre bg-surface',  label: '주의',      tone: 'text-ochre' },
  quote: { box: 'border-line bg-surface',                 label: '인용',      tone: 'text-muted' }
} as const;

export default function Callout({
  type = 'key', title, children
}: { type?: keyof typeof STYLE; title?: string; children: React.ReactNode }) {
  const s = STYLE[type] ?? STYLE.key;
  return (
    <aside className={`mb-5 max-w-[64ch] rounded-md border px-5 py-4 ${s.box}`}>
      {/* 색만으로 유형을 구분하지 않도록 라벨을 항상 동반합니다 (CL-03) */}
      <p className={`mb-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] ${s.tone}`}>
        {title ?? s.label}
      </p>
      <div className={`text-[14.5px] leading-[1.8] text-ink-2 ${type === 'q' ? 'font-display text-[16px] text-ink' : ''} [&>*:last-child]:mb-0 [&>ul]:mb-0 [&>ul]:pl-5 [&>p]:mb-2`}>
        {children}
      </div>
    </aside>
  );
}
