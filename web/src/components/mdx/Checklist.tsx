export default function Checklist({ items, title = '실습 체크리스트' }: { items: string[]; title?: string }) {
  return (
    <section className="mb-6 max-w-[64ch] rounded-md border border-line bg-surface-2 px-5 py-4">
      <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-[1.7] text-ink-2">
            <span className="mt-[3px] block h-4 w-4 shrink-0 rounded-sm border border-line-2 bg-surface" aria-hidden="true" />
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}
