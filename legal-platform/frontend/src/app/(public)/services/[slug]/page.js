import Link from "next/link";
import { notFound } from "next/navigation";
import { Home as HomeIcon, Users, FileCheck, Building2, Scale, Gavel, Check, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { serviceApi } from "@/lib/api";

const serviceIcons = { Home: HomeIcon, Users, FileCheck, Building2, Scale, Gavel };

export const revalidate = 300;

// Pre-builds known slugs at build time where a backend is reachable; falls
// back to on-demand rendering (dynamicParams defaults to true) if not —
// this sandbox itself never had a live backend to pre-render against, so
// this is written for a real deployment, not tested here.
export async function generateStaticParams() {
  try {
    const { data } = await serviceApi.listPublished({ page: 1, limit: 100 });
    return (data.data ?? []).map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

async function getService(slug) {
  try {
    const { data } = await serviceApi.getBySlug(slug);
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const service = await getService(params.slug);
  if (!service) return {};
  return { title: service.name, description: service.description };
}

function formatFeeRange(service) {
  if (!service.feeRangeMin && !service.feeRangeMax) return "Set by the lawyer you book";
  if (service.feeRangeMin && service.feeRangeMax) return `₹${service.feeRangeMin} – ₹${service.feeRangeMax}`;
  return `From ₹${service.feeRangeMin || service.feeRangeMax}`;
}

export default async function ServiceDetailPage({ params }) {
  const service = await getService(params.slug);
  if (!service) notFound();

  const Icon = serviceIcons[service.icon] ?? FileCheck;

  let related = [];
  try {
    const { data } = await serviceApi.listPublished({ page: 1, limit: 4 });
    related = (data.data ?? []).filter((s) => s.slug !== service.slug).slice(0, 3);
  } catch {
    related = [];
  }

  return (
    <>
      <PageHero eyebrow="Practice area" title={service.name} description={service.longDescription || service.description} />

      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            {service.covers?.length > 0 && (
              <>
                <h2 className="font-display text-2xl text-ink">What&rsquo;s covered in a consultation</h2>
                <ul className="mt-6 space-y-4">
                  {service.covers.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-verified" />
                      <span className="text-ink-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <Card className="h-fit p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-seal-wash text-seal">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-5 font-mono text-xs uppercase tracking-widest text-ink-muted">Typical fee range</p>
            <p className="mt-1 font-display text-2xl text-ink">{formatFeeRange(service)}</p>
            <p className="mt-2 text-xs text-ink-muted">Set independently by each lawyer, shown before you book.</p>
            <Button className="mt-6 w-full" asChild>
              <Link href="/lawyers">
                Find a {service.name.split(" ")[0].toLowerCase()} lawyer <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="border-t border-paper-line bg-paper-raised/60">
          <Container>
            <h2 className="font-display text-2xl text-ink">Related practice areas</h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {related.map((s) => {
                const RelIcon = serviceIcons[s.icon] ?? FileCheck;
                return (
                  <Link key={s.slug} href={`/services/${s.slug}`}>
                    <Card className="h-full p-5 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(22,35,63,0.2)]">
                      <RelIcon className="h-5 w-5 text-seal" />
                      <h3 className="mt-3 font-display text-base text-ink">{s.name}</h3>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
