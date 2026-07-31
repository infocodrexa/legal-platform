"use client";

import { useState } from "react";
import { notificationApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminNotificationsPage() {
  const [form, setForm] = useState({ audience: "USERS", recipientIds: "", title: "", message: "", link: "", inApp: true, email: false });
  const [state, setState] = useState({ loading: false, error: "", success: "" });

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event) {
    event.preventDefault();
    setState({ loading: true, error: "", success: "" });
    try {
      const recipientIds = form.recipientIds.split(",").map((value) => value.trim()).filter(Boolean);
      const channels = [...(form.inApp ? ["BROWSER"] : []), ...(form.email ? ["EMAIL"] : [])];
      const { data } = await notificationApi.adminSend({ audience: form.audience, recipientIds, title: form.title, message: form.message, link: form.link || undefined, channels });
      setState({ loading: false, error: "", success: `${data.data.recipients} recipient(s) queued successfully.` });
      setForm((current) => ({ ...current, title: "", message: "", link: "", recipientIds: "" }));
    } catch (error) {
      setState({ loading: false, error: error?.response?.data?.message || "Notification could not be sent. Please try again.", success: "" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="font-mono text-xs uppercase tracking-widest text-seal">Communication</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink">Notification Center</h1><p className="mt-2 text-sm text-ink-muted">Send personal or bulk in-app and email notifications.</p></div>
      <Card><CardHeader><CardTitle>New notification</CardTitle></CardHeader><CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="audience">Audience</Label><select id="audience" value={form.audience} onChange={(e) => update("audience", e.target.value)} className="h-10 w-full rounded-sm border border-paper-line bg-paper px-3 text-sm"><option value="USERS">All users</option><option value="LAWYERS">All lawyers</option><option value="EVERYONE">Everyone</option><option value="SELECTED">Selected recipients</option></select></div>
          {form.audience === "SELECTED" && <div className="space-y-2"><Label htmlFor="recipients">Recipient user IDs</Label><Input id="recipients" value={form.recipientIds} onChange={(e) => update("recipientIds", e.target.value)} placeholder="Comma-separated user IDs" required /><p className="text-xs text-ink-muted">Use Global Search or the Users/Lawyers page to copy recipient IDs.</p></div>}
          <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={150} required /></div>
          <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" value={form.message} onChange={(e) => update("message", e.target.value)} rows={6} maxLength={4000} required /></div>
          <div className="space-y-2"><Label htmlFor="link">Related page (optional)</Label><Input id="link" value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="/dashboard/appointments" /></div>
          <fieldset className="space-y-2"><legend className="text-sm font-medium text-ink">Delivery channels</legend><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.inApp} onChange={(e) => update("inApp", e.target.checked)} /> In-app</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.email} onChange={(e) => update("email", e.target.checked)} /> Email</label></fieldset>
          {state.error && <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          {state.success && <p role="status" className="rounded-sm bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p>}
          <Button type="submit" disabled={state.loading || (!form.inApp && !form.email)}>{state.loading ? "Sending..." : "Send notification"}</Button>
        </form>
      </CardContent></Card>
    </div>
  );
}
