"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Trash2 } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminBlogPost, useUpdateBlogPost } from "@/lib/hooks/useAdminDashboard";
import { blogApi } from "@/lib/api";
import { useState } from "react";

export default function EditBlogPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const postQuery = useAdminBlogPost(id);
  const updateMutation = useUpdateBlogPost();
  const [serverError, setServerError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    values: postQuery.data
      ? { title: postQuery.data.title, excerpt: postQuery.data.excerpt || "", content: postQuery.data.content, tags: (postQuery.data.tags || []).join(", ") }
      : undefined,
  });

  if (postQuery.isLoading) return <LoadingState label="Loading post…" />;
  if (postQuery.isError) return <ErrorState error={postQuery.error} onRetry={postQuery.refetch} />;

  async function onSubmit(values) {
    setServerError("");
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      if (values.excerpt) formData.append("excerpt", values.excerpt);
      formData.append("content", values.content);
      if (values.tags) formData.append("tags", values.tags);
      if (values.coverImage?.[0]) formData.append("coverImage", values.coverImage[0]);
      await updateMutation.mutateAsync({ id, formData });
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't save changes."));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setServerError("");
    try {
      await blogApi.remove(id);
      router.push("/admin/cms/blog");
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't delete this post."));
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <DashPageHeading title="Edit post" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" rows={2} {...register("excerpt")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" rows={10} {...register("content", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" {...register("tags")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coverImage">Replace cover image</Label>
              <Input id="coverImage" type="file" accept=".jpg,.jpeg,.png,.webp" {...register("coverImage")} />
            </div>
            {serverError && <p className="text-sm text-seal">{serverError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
                {(isSubmitting || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
              <Button type="button" variant="ghost" className="text-seal hover:bg-seal-wash" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
