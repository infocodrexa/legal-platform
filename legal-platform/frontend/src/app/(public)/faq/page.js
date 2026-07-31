import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/site/section";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { faqApi } from "@/lib/api";

export const metadata = {
  title: "FAQ",
  description: "Answers to common questions about document verification, consultations, payments, and refunds.",
};

export const revalidate = 300;

async function getFaqs() {
  try {
    const { data } = await faqApi.listPublic({});
    return data.data ?? [];
  } catch {
    return [];
  }
}

// Groups the flat FAQ list by category — the same shape this page always
// rendered, now driven by the real category field the CMS entries carry
// instead of a hardcoded structure that couldn't be edited from the Admin
// Dashboard's FAQ page.
function groupByCategory(faqs) {
  const groups = new Map();
  for (const faq of faqs) {
    const category = faq.category || "General";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(faq);
  }
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
}

export default async function FaqPage() {
  const faqs = await getFaqs();
  const faqGroups = groupByCategory(faqs);

  return (
    <>
      <PageHero
        eyebrow="Questions"
        title="Frequently asked questions"
        description="If you don't see your question answered here, reach out through our contact page — we typically respond within a day."
      />

      <Section>
        <Container className="max-w-3xl">
          {faqGroups.length === 0 ? (
            <p className="text-sm text-ink-muted">Questions are being updated — check back shortly, or reach out through the contact page.</p>
          ) : (
            faqGroups.map((group) => (
              <div key={group.category} className="mb-14 last:mb-0">
                <h2 className="font-mono text-xs uppercase tracking-widest text-brass">{group.category}</h2>
                <Accordion type="single" collapsible className="mt-4">
                  {group.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </Container>
      </Section>
    </>
  );
}
