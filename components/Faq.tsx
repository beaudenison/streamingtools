import type { Faq as FaqItem } from "@/lib/seo";

export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <section className="notes">
      <h2>Questions</h2>
      <div className="faq-list">
        {items.map((item) => (
          <div className="faq" key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
