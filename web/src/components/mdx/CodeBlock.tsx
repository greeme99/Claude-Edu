export default function CodeBlock(props: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre {...props}
      className="mb-6 max-w-[64ch] overflow-x-auto rounded-md border border-line bg-surface-2 px-5 py-4 font-mono text-[12.5px] leading-[1.85] text-ink-2 [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]" />
  );
}
