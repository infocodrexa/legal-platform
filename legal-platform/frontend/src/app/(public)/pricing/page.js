import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section, Eyebrow } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Pricing",
  description: "Free document upload, transparent consultation fees, no subscription required.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="You only pay for the consultation you book"
        description="Document upload and review is free. Every lawyer sets their own consultation fee, shown upfront before you book — no subscriptions, no hidden charges."
      />

      <Section>
        <Container className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-8">
            <Eyebrow>Step one</Eyebrow>
            <h2 className="mt-3 font-display text-2xl text-ink">Document review</h2>
            <p className="mt-4 font-display text-4xl text-ink">Free</p>
            <ul className="mt-6 space-y-3 text-sm text-ink-muted">
              {["Upload any legal document", "Reviewed by a licensed lawyer", "Verified, rejected, or reupload requested"].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" /> {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-2 border-seal p-8">
            <Eyebrow>Step two</Eyebrow>
            <h2 className="mt-3 font-display text-2xl text-ink">Consultation</h2>
            <p className="mt-4 font-display text-4xl text-ink">
              ₹600<span className="text-lg font-normal text-ink-muted"> – ₹3,500</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">Set by the lawyer, shown before you book</p>
            <ul className="mt-6 space-y-3 text-sm text-ink-muted">
              {["30–45 minute video consultation", "Secure payment via Razorpay", "GST-compliant invoice", "Chat follow-up included"].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" /> {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8">
            <Eyebrow>No extra cost</Eyebrow>
            <h2 className="mt-3 font-display text-2xl text-ink">Everything else</h2>
            <p className="mt-4 font-display text-4xl text-ink">₹0</p>
            <ul className="mt-6 space-y-3 text-sm text-ink-muted">
              {["Account & document storage", "Rescheduling a consultation", "Messaging your lawyer after", "Downloading past invoices"].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" /> {item}
                </li>
              ))}
            </ul>
          </Card>
        </Container>
      </Section>

      {/* WHERE THE FEE GOES */}
      <Section className="border-t border-paper-line bg-paper-raised/60">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Where the fee goes</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-ink">A transparent split, every time</h2>
            <p className="mt-4 leading-relaxed text-ink-muted">
              Most of your consultation fee goes directly to the lawyer. A
              small platform commission covers payment processing, video
              infrastructure, and document storage — shown as a separate
              line item on every invoice, never bundled in.
            </p>
          </div>
          <Card className="p-7 font-mono text-sm">
            <div className="flex items-center justify-between border-b border-paper-line pb-3">
              <span className="text-ink-muted">Consultation fee</span>
              <span className="text-ink">₹1,000.00</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-ink-muted">→ Lawyer receives</span>
              <span className="text-verified">₹850.00</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-ink-muted">→ Platform commission (15%)</span>
              <span className="text-ink-muted">₹150.00</span>
            </div>
            <div className="mt-4 border-t border-paper-line pt-3 text-xs text-ink-muted">
              Example only — the exact fee is set by each lawyer.
            </div>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container className="text-center">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">No plan to pick. Just upload and see.</h2>
          <Button size="lg" className="mt-7" asChild>
            <Link href="/register">
              Upload your first document <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
