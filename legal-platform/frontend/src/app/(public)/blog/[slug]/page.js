import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { blogApi } from "@/lib/api";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const { data } = await blogApi.listPublished({ page: 1, limit: 100 });
    return (data.data ?? []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

async function getPost(slug) {
  try {
    const { data } = await blogApi.getBySlug(slug);
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <Section className="pt-14">
      <Container className="max-w-2xl">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
        </Link>

        {post.tags?.[0] && <Badge variant="brass" className="mt-6">{post.tags[0]}</Badge>}
        <h1 className="mt-4 text-balance font-display text-4xl font-semibold text-ink">{post.title}</h1>

        <div className="mt-5 flex items-center gap-3 text-sm text-ink-muted">
          <span>{post.author?.name}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>

        <Separator className="my-8" />

        {/* post.content is server-sanitized rich text (sanitizeRichText in
            the backend's blog.service.js — safe formatting tags only,
            scripts/event handlers stripped) — rendering it as HTML here is
            what makes admin-authored formatting (bold, links, lists)
            actually show up, matching how the CMS editor's textarea is
            meant to be used. */}
        <div
          className="space-y-5 text-[1.05rem] leading-relaxed text-ink [&_a]:text-seal [&_a]:underline [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.author?.name && (
          <div className="mt-12 rounded-card border border-paper-line bg-paper-raised p-6 text-sm text-ink-muted">
            This article is general information, not legal advice specific to
            your situation. For guidance on your own matter, book a
            consultation with {post.author.name.replace("Adv. ", "")} or another
            verified lawyer on the platform.
          </div>
        )}
      </Container>
    </Section>
  );
}
