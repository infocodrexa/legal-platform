import Link from "next/link";
import {
  Home as HomeIcon, Users, FileCheck, Building2, Scale, Gavel,
  ShieldCheck, Video, MessageSquare, Star, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container, Section, Eyebrow, StepNumber } from "@/components/site/section";
import { Seal } from "@/components/site/seal";
import { HeroVisual } from "@/components/site/hero-visual";
import { serviceApi, lawyerApi, testimonialApi, faqApi } from "@/lib/api";

const serviceIcons = { Home: HomeIcon, Users, FileCheck, Building2, Scale, Gavel };

// The four-step process description is genuinely static content (a fixed
// explanation of how the platform works), not data from a table — kept
// as a plain constant rather than invented as a fake "steps" API.
const steps = [
  { title: "Upload your document", description: "Submit identity proof, property papers, or any legal document for review — encrypted and stored privately." },
  { title: "Get it verified", description: "A licensed lawyer reviews your document and marks it verified, rejected, or requests a clearer copy." },
  { title: "Book a consultation", description: "Choose a verified lawyer's open slot and pay securely through the platform." },
  { title: "Meet over video", description: "Talk it through on a scheduled video call, with chat and follow-up support after." },
];

export const metadata = {
  title: "Verified Documents, Real Lawyers",
  description:
    "Upload legal documents for verification and book a consultation with a Bar Council verified lawyer — all in one platform.",
};

// Each section fetches independently and fails gracefully (empty array,
// not a thrown error) — one backend hiccup shouldn't take the whole
// homepage down. This is a real tradeoff for a marketing page: showing a
// slightly sparse section beats a 500.
async function safeFetch(promise) {
  try {
    const { data } = await promise;
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [services, lawyers, testimonials, faqs] = await Promise.all([
    safeFetch(serviceApi.listPublished({ page: 1, limit: 6 })),
    safeFetch(lawyerApi.listPublicDirectory({ page: 1, limit: 3 })),
    safeFetch(testimonialApi.listPublic()),
    safeFetch(faqApi.listPublic({})),
  ]);
  const faqPreview = faqs.slice(0, 3);
  const testimonialPreview = testimonials.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <Section className="pt-14 pb-20 sm:pt-20 sm:pb-28">
        <Container className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-8">
          <div>
            <Eyebrow>Legal help, verified before it reaches you</Eyebrow>
            <h1 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl lg:text-[3.25rem]">
              Get your documents verified. Talk to a real lawyer.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">
              Upload a property paper, contract, or legal notice and a
              licensed lawyer reviews it — then book a video consultation
              with them directly, paid securely, start to finish.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Upload a document <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/lawyers">Browse verified lawyers</Link>
              </Button>
            </div>
          </div>

          <HeroVisual />
        </Container>
      </Section>

      {/* HOW IT WORKS PREVIEW */}
      <Section className="border-t border-paper-line bg-paper-raised/60">
        <Container>
          <div className="max-w-xl">
            <Eyebrow>The process</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Four steps, start to resolution
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <StepNumber n={i + 1} />
                <h3 className="mt-3 font-display text-lg text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
              </div>
            ))}
          </div>

          <Button variant="link" className="mt-12" asChild>
            <Link href="/how-it-works">
              See the full process <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Container>
      </Section>

      {/* SERVICES */}
      <Section>
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <Eyebrow>Practice areas</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
                Whatever the matter, there&rsquo;s a verified lawyer for it
              </h2>
            </div>
            <Button variant="link" asChild>
              <Link href="/services">
                View all services <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {services.length === 0 ? (
            <p className="mt-12 text-sm text-ink-muted">Practice areas are being updated — check back shortly.</p>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = serviceIcons[service.icon] ?? FileCheck;
                return (
                  <Card key={service.slug} className="p-6 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(22,35,63,0.2)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-seal-wash text-seal">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg text-ink">{service.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.description}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      {/* WHY US */}
      <Section className="border-t border-paper-line bg-ink text-paper">
        <Container>
          <div className="max-w-xl">
            <Eyebrow>Why NyayaSetu</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cream-white sm:text-4xl">
              Built so trust isn&rsquo;t something you have to take on faith
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [ShieldCheck, "Bar Council verified", "Every lawyer's license is checked before they can accept a booking."],
              [FileCheck, "Private by default", "Documents live in encrypted storage, reachable only by short-lived signed links."],
              [Video, "Video, built in", "Consultations happen over a scheduled video call with no separate app to install."],
              [MessageSquare, "Direct follow-up", "Message your lawyer directly through the platform after your consultation."],
            ].map(([Icon, title, body]) => (
              <div key={title}>
                <Icon className="h-6 w-6 text-seal-soft" />
                <h3 className="mt-4 font-display text-lg text-cream-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/60">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FEATURED LAWYERS */}
      <Section>
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <Eyebrow>On the platform</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
                A few of our verified lawyers
              </h2>
            </div>
            <Button variant="link" asChild>
              <Link href="/lawyers">
                Browse the full directory <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {lawyers.length === 0 ? (
            <p className="mt-12 text-sm text-ink-muted">New lawyers are being verified — check back shortly.</p>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lawyers.map((lawyer) => (
                <Card key={lawyer.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink font-display text-lg text-cream-white">
                      {(lawyer.user?.name || "L").split(" ").slice(-1)[0][0]}
                    </div>
                    <Badge variant="verified">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-lg text-ink">{lawyer.user?.name}</h3>
                  <p className="text-sm text-ink-muted">{(lawyer.specializations || []).join(", ")}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-paper-line pt-4 text-sm">
                    <span className="flex items-center gap-1 text-ink">
                      {lawyer.avgRating ? (
                        <>
                          <Star className="h-3.5 w-3.5 fill-brass text-brass" />
                          {lawyer.avgRating.toFixed(1)}
                          <span className="text-ink-muted">({lawyer.reviewCount})</span>
                        </>
                      ) : (
                        <span className="text-ink-muted">New on the platform</span>
                      )}
                    </span>
                    <span className="font-mono text-ink-muted">{lawyer.experienceYears} yrs</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* TESTIMONIALS */}
      {testimonialPreview.length > 0 && (
        <Section className="border-t border-paper-line bg-paper-raised/60">
          <Container>
            <div className="max-w-xl">
              <Eyebrow>From the record</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
                What people say after
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {testimonialPreview.map((t) => (
                <Card key={t.id} className="flex flex-col justify-between p-7">
                  <p className="font-display text-[1.05rem] leading-relaxed text-ink">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 border-t border-paper-line pt-4">
                    <p className="text-sm font-medium text-ink">{t.authorName}</p>
                    <p className="text-xs text-ink-muted">{t.authorRole}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* FAQ PREVIEW */}
      {faqPreview.length > 0 && (
        <Section>
          <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <Eyebrow>Questions</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Before you get started</h2>
              <Button variant="link" className="mt-6" asChild>
                <Link href="/faq">
                  Read the full FAQ <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-paper-line">
              {faqPreview.map((item) => (
                <div key={item.id} className="py-5 first:pt-0">
                  <h3 className="font-display text-lg text-ink">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CLOSING CTA */}
      <Section className="border-t border-paper-line">
        <Container>
          <div className="relative overflow-hidden rounded-card bg-ink px-8 py-16 text-center sm:px-16">
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <Seal size={72} className="text-seal-soft" />
              <h2 className="mt-6 font-display text-3xl font-semibold text-cream-white sm:text-4xl text-balance">
                Your document deserves a second, licensed pair of eyes.
              </h2>
              <p className="mt-4 text-paper/65">
                Free to upload. You only pay when you book a consultation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">Get started free</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-paper/30 text-cream-white hover:bg-paper/10" asChild>
                  <Link href="/contact">Talk to us first</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
