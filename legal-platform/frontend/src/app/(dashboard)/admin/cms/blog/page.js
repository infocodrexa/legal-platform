"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { useAdminBlogPosts, usePublishBlogPost } from "@/lib/hooks/useAdminDashboard";
import { useState } from "react";

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not published";
}

export default function AdminBlogPage() {
  const { data, isLoading, isError, error, refetch } = useAdminBlogPosts({ page: 1, limit: 50 });
  const publishMutation = usePublishBlogPost();
  const [actionError, setActionError] = useState("");
  const posts = data?.data ?? [];

  async function handlePublishToggle(post) {
    setActionError("");
    try {
      await publishMutation.mutateAsync({ id: post.id, status: post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" });
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't update this post."));
    }
  }

  return (
    <div>
      <DashPageHeading
        title="Blog"
        description="Draft, publish, and archive posts."
        action={
          <Button asChild>
            <Link href="/admin/cms/blog/new">
              <Plus className="h-4 w-4" /> New post
            </Link>
          </Button>
        }
      />

      {actionError && <p className="mb-4 text-sm text-seal">{actionError}</p>}

      {isLoading ? (
        <LoadingState label="Loading posts…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : posts.length === 0 ? (
        <EmptyState icon="Newspaper" title="No posts yet" description="Create your first post to get started." />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Author</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Published</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 font-medium text-ink">{post.title}</td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{post.author?.name}</td>
                  <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{formatDate(post.publishedAt)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/cms/blog/${post.id}`} className="mr-3 text-sm font-medium text-seal hover:underline">
                      Edit
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handlePublishToggle(post)} disabled={publishMutation.isPending}>
                      {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
