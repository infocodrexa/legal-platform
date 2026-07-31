"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^(?:\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  topic: z.string().min(1, "Select a topic"),
  message: z.string().min(10, "Tell us a bit more — at least 10 characters"),
});

const topics = [
  "General question",
  "I'm a lawyer, I want to join",
  "Document verification issue",
  "Payment or refund",
  "Partnership / press",
];

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values) {
    setServerError("");
    try {
      // Matches backend/src/validators/lead.validator.js#createLeadSchema
      // exactly — this is now a real endpoint (POST /api/v1/leads,
      // public, rate-limited), not simulated. Untested against a live
      // backend in this sandbox (see the backend README for why), but the
      // request shape is correct.
      await api.post("/leads", values);
      setSubmitted(true);
      reset();
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Something went wrong sending your message. Please try again."
      );
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-card border border-verified/30 bg-verified-wash px-8 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-verified" />
        <h3 className="mt-4 font-display text-xl text-ink">Message sent</h3>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          We typically reply within one business day. You&rsquo;ll hear from us at the email you provided.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-seal">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" {...register("phone")} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="text-xs text-seal">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        {errors.email && <p className="text-xs text-seal">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic">What&rsquo;s this about?</Label>
        <select
          id="topic"
          {...register("topic")}
          aria-invalid={!!errors.topic}
          defaultValue=""
          className="flex h-11 w-full rounded-sm border border-ink/20 bg-cream-white px-3.5 text-sm text-ink focus-visible:outline-none focus-visible:border-seal focus-visible:ring-1 focus-visible:ring-seal aria-invalid:border-seal"
        >
          <option value="" disabled>
            Select a topic
          </option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.topic && <p className="text-xs text-seal">{errors.topic.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} {...register("message")} aria-invalid={!!errors.message} />
        {errors.message && <p className="text-xs text-seal">{errors.message.message}</p>}
      </div>

      {serverError && <p className="text-sm text-seal">{serverError}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Send message
      </Button>
    </form>
  );
}
