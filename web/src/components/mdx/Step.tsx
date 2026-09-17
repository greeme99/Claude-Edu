export default function Step({ n, title, children }: { n: number | string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 max-w-[64ch] rounded-md border border-line bg-surface px-5 py-4">
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo font-mono text-[11px] font-semibold text-on-indigo">{n}</span>
        <h3 className="m-0 font-display text-[16.5px] font-bold tracking-tight">{title}</h3>
      </div>
      <div className="text-[14.5px] leading-[1.8] text-ink-2 [&>*:last-child]:mb-0">{children}</div>
    </section>
  );
}
