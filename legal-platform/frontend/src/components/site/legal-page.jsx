import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/site/section";

export function LegalPage({ eyebrow, title, updated, children }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={`Last updated ${updated}`} />
      <Section className="pt-14 sm:pt-16">
        <Container className="max-w-3xl">
          <div className="prose-legal prose prose-ink max-w-none prose-headings:font-display prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-3 first:prose-h2:mt-0">
            {children}
          </div>
        </Container>
      </Section>
    </>
  );
}
