"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateBlogPost } from "@/lib/hooks/useAdminDashboard";
import { useState } from "react";

export default function NewBlogPostPage() {
  const router = useRouter();
  const createMutation = useCreateBlogPost();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(values) {
    setServerError("");
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      if (values.excerpt) formData.append("excerpt", values.excerpt);
      formData.append("content", values.content);
      if (values.tags) formData.append("tags", values.tags);
      if (values.coverImage?.[0]) formData.append("coverImage", values.coverImage[0]);
      await createMutation.mutateAsync(formData);
      router.push("/admin/cms/blog");
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't create this post."));
    }
  }

  return (
    <div className="max-w-2xl">
      <DashPageHeading title="New post" description="Saved as a draft — publish it from the Blog list." />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title", { required: true, minLength: 3 })} aria-invalid={!!errors.title} />
              {errors.title && <p className="text-xs text-seal">Enter a title (at least 3 characters).</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" rows={2} {...register("excerpt")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" rows={10} {...register("content", { required: true })} aria-invalid={!!errors.content} />
              {errors.content && <p className="text-xs text-seal">Content is required.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="property-law, contracts" {...register("tags")} />
              <p className="text-xs text-ink-muted">Comma-separated.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coverImage">Cover image</Label>
              <Input id="coverImage" type="file" accept=".jpg,.jpeg,.png,.webp" {...register("coverImage")} />
            </div>
            {serverError && <p className="text-sm text-seal">{serverError}</p>}
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {(isSubmitting || createMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Save post
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
