import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { blogApi } from "@/lib/api";

export const metadata = {
  title: "Blog",
  description: "Practical explainers from the lawyers on our platform — contracts, property, family law, and more.",
};

export const revalidate = 300;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

async function getPosts() {
  try {
    const { data } = await blogApi.listPublished({ page: 1, limit: 50 });
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <PageHero
        eyebrow="From our lawyers"
        title="Practical explainers, not legalese"
        description="Short, specific reads on the legal questions people bring to us most often — written by the lawyers who actually handle these matters."
      />

      <Section>
        <Container>
          {posts.length === 0 ? (
            <p className="text-sm text-ink-muted">No posts published yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card className="flex h-full flex-col p-6 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(22,35,63,0.2)]">
                    {post.tags?.[0] && <Badge variant="brass" className="w-fit">{post.tags[0]}</Badge>}
                    <h2 className="mt-4 font-display text-xl leading-snug text-ink">{post.title}</h2>
                    {post.excerpt && <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>}
                    <div className="mt-5 flex items-center justify-between border-t border-paper-line pt-4 text-xs text-ink-muted">
                      <span>{post.author?.name}</span>
                      <span className="font-mono">{formatDate(post.publishedAt)}</span>
                    </div>
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
