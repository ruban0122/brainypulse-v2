import Link from 'next/link'

interface FAQ {
  q: string
  a: string
}

interface RelatedTool {
  label: string
  href: string
  desc: string
}

interface Props {
  title: string
  description: string
  stats: { label: string; value: string }[]
  faqs: FAQ[]
  related: RelatedTool[]
  faqSchemaId: string
}

export default function ToolSEOSection({
  title,
  description,
  stats,
  faqs,
  related,
  faqSchemaId,
}: Props) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': faqSchemaId,
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <section className="border-t border-[#151515] mt-8 bg-[#080808]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-5 py-12 space-y-12">

        {/* About */}
        <div>
          <h2 className="text-[#444] text-[10px] uppercase tracking-[0.2em] font-mono mb-3">
            About
          </h2>
          <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
          <p className="text-[#666] text-sm leading-relaxed">{description}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
              <div className="text-[#00ff88] font-mono font-bold text-lg">{value}</div>
              <div className="text-[#555] text-[10px] font-mono uppercase tracking-widest mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-[#444] text-[10px] uppercase tracking-[0.2em] font-mono mb-5">
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-[#111] pb-5 last:border-0">
                <h3 className="text-white text-sm font-semibold mb-1.5">{q}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Tests */}
        <div>
          <h2 className="text-[#444] text-[10px] uppercase tracking-[0.2em] font-mono mb-4">
            More Tests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map(({ label, href, desc }) => (
              <Link
                key={href}
                href={href}
                className="group bg-[#0e0e0e] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-lg p-3 transition-colors"
              >
                <div className="text-sm font-medium text-[#888] group-hover:text-white transition-colors">
                  {label}
                </div>
                <div className="text-[#444] text-xs font-mono mt-0.5">{desc}</div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
