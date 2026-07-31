import { ShieldCheck, ScrollText, Users2, Target } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section, Eyebrow } from "@/components/site/section";
import { Seal } from "@/components/site/seal";

export const metadata = {
  title: "About",
  description: "Why NyayaSetu exists, and how we verify every lawyer on the platform.",
};

const values = [
  [ShieldCheck, "Verification isn't optional", "No lawyer sees a single client until their Bar Council license has been checked. Not after signup — before."],
  [ScrollText, "Plain language, always", "Legal documents shouldn't require a law degree to understand what a lawyer told you about them."],
  [Users2, "Two-sided trust", "Clients get vetted lawyers. Lawyers get pre-screened clients and a clean case history — the whole system works because both sides can rely on it."],
  [Target, "Access, not just convenience", "Most people's first legal question is small — is this contract fair? Is this notice serious? Getting a straight answer shouldn't require finding a lawyer through someone's cousin."],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About NyayaSetu"
        title="Legal help shouldn't start with uncertainty"
        description="We built NyayaSetu because getting a straight, trustworthy answer to a legal question in India usually means knowing someone who knows a lawyer. We wanted a front door that works for everyone else."
      />

      <Section>
        <Container className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {values.map(([Icon, title, body]) => (
            <div key={title} className="border-t border-paper-line pt-6">
              <Icon className="h-6 w-6 text-seal" />
              <h2 className="mt-4 font-display text-xl text-ink">{title}</h2>
              <p className="mt-2 leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </Container>
      </Section>

      <Section className="border-t border-paper-line bg-ink text-paper">
        <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[auto_1fr]">
          <Seal size={140} className="text-seal-soft mx-auto lg:mx-0" />
          <div>
            <Eyebrow>How verification works</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-cream-white">
              Every seal on this platform means something specific
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-paper/65">
              A lawyer&rsquo;s profile carries a &ldquo;Verified&rdquo; mark only
              after we&rsquo;ve checked their Bar Council enrollment ID against
              their submitted license. It&rsquo;s a one-time check before they can
              accept their first booking, not a badge anyone can claim by
              signing up. The same discipline applies to every document you
              upload: reviewed by a real person, not an algorithm guessing
              at legal validity.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
