import Link from "next/link";
import { Home as HomeIcon, Users, FileCheck, Building2, Scale, Gavel, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { serviceApi } from "@/lib/api";

const serviceIcons = { Home: HomeIcon, Users, FileCheck, Building2, Scale, Gavel };

export const metadata = {
  title: "Services",
  description: "Legal document verification and lawyer consultation across every major practice area.",
};

// Revalidate periodically rather than caching forever — admin-edited
// services (publish/unpublish, edits) should show up without a full
// redeploy.
export const revalidate = 300;

async function getServices() {
  try {
    const { data } = await serviceApi.listPublished({ page: 1, limit: 50 });
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <PageHero
        eyebrow="Practice areas"
        title="Every practice area, one verified process"
        description="Whatever the matter, it goes through the same review: a licensed lawyer checks your document, then you book a consultation with someone who actually practices in that area."
      />

      <Section>
        <Container>
          {services.length === 0 ? (
            <p className="text-sm text-ink-muted">Practice areas are being updated — check back shortly.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = serviceIcons[service.icon] ?? FileCheck;
                return (
                  <Link key={service.slug} href={`/services/${service.slug}`}>
                    <Card className="h-full p-6 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(22,35,63,0.2)]">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-seal-wash text-seal">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mt-4 font-display text-lg text-ink">{service.name}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.description}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-seal">
                        Learn more <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
