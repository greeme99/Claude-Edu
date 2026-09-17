export default function Troubleshoot({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="mb-2 max-w-[64ch] rounded-md border border-line bg-surface px-5 py-3.5 [&[open]>summary]:mb-2.5">
      <summary className="cursor-pointer list-none text-[14.5px] font-semibold marker:hidden">
        <span className="mr-2 font-mono text-[11px] text-indigo">Q</span>{q}
      </summary>
      <div className="text-[14px] leading-[1.8] text-ink-2 [&>*:last-child]:mb-0">{children}</div>
    </details>
  );
}
