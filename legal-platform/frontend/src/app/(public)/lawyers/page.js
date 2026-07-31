import Link from "next/link";
import { Star, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { lawyerApi, serviceApi } from "@/lib/api";

export const metadata = {
  title: "Find a Lawyer",
  description: "Browse Bar Council verified lawyers by practice area, experience, and rating.",
};

export const revalidate = 120;

// Genuinely functional filter — a real GET param, not static UI. The
// backend's GET /lawyers?specialization= only supports one at a time, so
// this is single-select rather than multi-select checkboxes.
// export default async function LawyersPage({ searchParams }) {
//   const specialization = searchParams?.specialization || "";

export default async function LawyersPage({ searchParams }) {
  const params = await searchParams;
  const specialization = params?.specialization || "";

  const [lawyersResult, servicesResult] = await Promise.all([
    lawyerApi.listPublicDirectory({ page: 1, limit: 50, ...(specialization && { specialization }) }).catch(() => null),
    serviceApi.listPublished({ page: 1, limit: 20 }).catch(() => null),
  ]);

  const lawyers = lawyersResult?.data?.data ?? [];
  const services = servicesResult?.data?.data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Directory"
        title="Every lawyer here has already been checked"
        description="Filter by practice area or just browse — every profile shown has passed Bar Council verification before appearing in this directory."
      />

      <Section>
        <Container>
          <div className="flex flex-wrap gap-2 border-b border-paper-line pb-8">
            <Link
              href="/lawyers"
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                !specialization ? "bg-ink text-cream-white" : "border border-ink/15 text-ink-muted hover:border-seal hover:text-seal"
              )}
            >
              All
            </Link>
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/lawyers?specialization=${encodeURIComponent(s.name)}`}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  specialization === s.name ? "bg-ink text-cream-white" : "border border-ink/15 text-ink-muted hover:border-seal hover:text-seal"
                )}
              >
                {s.name}
              </Link>
            ))}
          </div>

          {lawyers.length === 0 ? (
            <p className="mt-10 text-sm text-ink-muted">
              No verified lawyers match this filter yet.{" "}
              <Link href="/lawyers" className="text-seal hover:underline">Clear the filter</Link>.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lawyers.map((lawyer) => (
                <Link key={lawyer.id} href={`/lawyers/${lawyer.id}`}>
                  <Card className="h-full p-6 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(22,35,63,0.2)]">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink font-display text-lg text-cream-white">
                        {(lawyer.user?.name || "L").split(" ").slice(-1)[0][0]}
                      </div>
                      <Badge variant="verified">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    </div>
                    <h2 className="mt-4 font-display text-lg text-ink">{lawyer.user?.name}</h2>
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
                          <span className="text-ink-muted">New</span>
                        )}
                      </span>
                      <span className="font-mono text-ink-muted">{lawyer.experienceYears} yrs</span>
                    </div>

                    <p className="mt-3 font-mono text-sm text-ink">
                      ₹{Number(lawyer.consultationCharge).toLocaleString("en-IN")}
                      <span className="text-xs font-sans text-ink-muted"> / consultation</span>
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
