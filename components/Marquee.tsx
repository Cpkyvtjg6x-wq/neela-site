// Bandeau défilant horizontal (mots-clés / services). CSS pur, performant.
export default function Marquee({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line py-6 select-none">
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
        {loop.map((item, i) => (
          <span
            key={i}
            className="font-display text-lg font-medium text-mut/70"
          >
            {item}
            <span className="ml-12 text-accent">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
