export default function TryIt({ title = '직접 해보기', children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 max-w-[64ch] rounded-md border border-dashed border-indigo bg-indigo-soft px-5 py-4">
      <p className="mb-2.5 flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-indigo">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        {title}
      </p>
      <div className="text-[14.5px] leading-[1.8] text-ink-2 [&>*:last-child]:mb-0 [&>ol]:mb-0 [&>ol]:pl-5 [&>ul]:mb-0 [&>ul]:pl-5">{children}</div>
    </section>
  );
}
