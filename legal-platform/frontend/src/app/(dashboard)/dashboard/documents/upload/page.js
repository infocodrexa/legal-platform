"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { documentCategoryLabels } from "@/lib/constants";
import { useUploadDocument } from "@/lib/hooks/useUserDashboard";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

const uploadSchema = z.object({
  category: z.string().min(1, "Select a category"),
  file: z
    .instanceof(File, { message: "Choose a file to upload" })
    .refine((f) => ALLOWED_TYPES.includes(f.type), "Only PDF, JPEG, PNG, or WEBP files are allowed")
    .refine((f) => f.size <= MAX_SIZE_MB * 1024 * 1024, `File must be under ${MAX_SIZE_MB}MB`),
});

export default function UploadDocumentPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [serverError, setServerError] = useState("");
  const uploadMutation = useUploadDocument();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(uploadSchema) });

  const file = watch("file");

  function handleFile(f) {
    if (f) setValue("file", f, { shouldValidate: true });
  }

  async function onSubmit(values) {
    setServerError("");
    try {
      // Matches backend/src/routes/document.routes.js exactly:
      // upload.single("file") + category in the body.
      const formData = new FormData();
      formData.append("category", values.category);
      formData.append("file", values.file);
      await uploadMutation.mutateAsync(formData);
      router.push("/dashboard/documents");
    } catch (err) {
      setServerError(getErrorMessage(err, "Upload failed. Please try again."));
    }
  }

  return (
    <div className="max-w-2xl">
      <DashPageHeading title="Upload a document" description="PDF, JPEG, PNG, or WEBP — up to 10MB." />

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="category">Document category</Label>
            <select
              id="category"
              {...register("category")}
              defaultValue=""
              aria-invalid={!!errors.category}
              className="flex h-11 w-full rounded-sm border border-ink/20 bg-cream-white px-3.5 text-sm text-ink focus-visible:outline-none focus-visible:border-seal focus-visible:ring-1 focus-visible:ring-seal aria-invalid:border-seal"
            >
              <option value="" disabled>
                Select a category
              </option>
              {Object.entries(documentCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-seal">{errors.category.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>File</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
                dragActive ? "border-seal bg-seal-wash" : "border-paper-line hover:border-ink/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept={ALLOWED_TYPES.join(",")}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex items-center gap-3">
                  <FileIcon className="h-6 w-6 text-seal" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-ink">{file.name}</p>
                    <p className="text-xs text-ink-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setValue("file", undefined); }}
                    className="ml-2 rounded-sm p-1 text-ink-muted hover:text-seal"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-ink-muted" />
                  <p className="mt-3 text-sm text-ink">
                    <span className="font-medium text-seal">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">PDF, JPEG, PNG, or WEBP up to 10MB</p>
                </>
              )}
            </div>
            {errors.file && <p className="text-xs text-seal">{errors.file.message}</p>}
          </div>

          {serverError && <p className="text-sm text-seal">{serverError}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for review
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
