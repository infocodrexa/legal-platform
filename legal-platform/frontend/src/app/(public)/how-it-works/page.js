import Link from "next/link";
import { Upload, ShieldCheck, CalendarCheck, Video, ArrowRight, MessageSquare, CreditCard } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section, StepNumber, Eyebrow } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "How It Works",
  description: "From document upload to a resolved consultation — the full process, step by step.",
};

const clientSteps = [
  {
    icon: Upload,
    title: "Upload your document",
    description:
      "Submit a property paper, contract, notice, or any legal document from your dashboard. Files are stored in encrypted, private storage — never a public link.",
  },
  {
    icon: ShieldCheck,
    title: "A lawyer reviews it",
    description:
      "A licensed lawyer picks up your document from the review queue and marks it Verified, sends it back for a clearer copy, or flags an issue with remarks explaining what to fix.",
  },
  {
    icon: CalendarCheck,
    title: "Book a consultation",
    description:
      "Browse verified lawyers by specialization, check their open slots, and book directly. Payment is handled securely on the platform — the lawyer's fee is shown upfront, no surprises.",
  },
  {
    icon: Video,
    title: "Meet over video",
    description:
      "At the scheduled time, join a video call with your lawyer. A meeting link is generated automatically and sent to you and shown in your dashboard.",
  },
  {
    icon: MessageSquare,
    title: "Message afterwards",
    description:
      "Follow-up questions go straight to your lawyer through the platform's chat — no separate app, no giving out a personal number.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="The process"
        title="From a stack of papers to a straight answer"
        description="Every document is reviewed by a real, licensed lawyer before you ever pay for a consultation. Here's exactly what happens at each step."
      />

      <Section>
        <Container>
          <div className="space-y-16">
            {clientSteps.map((step, i) => (
              <div key={step.title} className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
                <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-seal text-seal">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <StepNumber n={i + 1} />
                </div>
                <div className="border-b border-paper-line pb-16 last:border-b-0 last:pb-0">
                  <h2 className="font-display text-2xl text-ink">{step.title}</h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FOR LAWYERS */}
      <Section className="border-t border-paper-line bg-ink text-paper">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Eyebrow>For lawyers</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold text-cream-white sm:text-4xl">
                Pre-screened clients, on your schedule
              </h2>
              <p className="mt-5 leading-relaxed text-paper/65">
                Set your own consultation fee and weekly availability. Review
                documents in a queue built for focus, accept the bookings
                that fit, and get paid directly — the platform&rsquo;s
                commission is deducted automatically, with a clear invoice
                for every transaction.
              </p>
              <Button size="lg" className="mt-8" asChild>
                <Link href="/register">
                  Apply as a lawyer <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Bar Council check", "One-time verification before your profile goes live."],
                ["Set your own fee", "You decide the consultation charge per session."],
                ["Direct payouts", "Settlement goes straight to your linked account."],
                ["Full case history", "Every document and message stays organized per client."],
              ].map(([title, body]) => (
                <Card key={title} className="border-paper/15 bg-paper/[0.04] p-5">
                  <h3 className="font-display text-base text-cream-white">{title}</h3>
                  <p className="mt-2 text-sm text-paper/60">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="text-center">
          <CreditCard className="mx-auto h-8 w-8 text-seal" />
          <h2 className="mt-4 font-display text-2xl text-ink sm:text-3xl">Ready to see it for yourself?</h2>
          <p className="mt-3 text-ink-muted">Uploading a document costs nothing until you book a consultation.</p>
          <Button size="lg" className="mt-7" asChild>
            <Link href="/register">Get started free</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
