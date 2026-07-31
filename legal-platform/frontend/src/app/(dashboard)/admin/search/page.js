"use client";

import { useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [state, setState] = useState({ loading: false, error: "" });

  async function submit(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setState({ loading: true, error: "" });
    try {
      const { data } = await adminApi.globalSearch({ query: query.trim(), page: 1, limit: 20 });
      setResults(data.data);
    } catch (error) {
      setState({ loading: false, error: error?.response?.data?.message || "Search could not be completed. Please try again." });
      return;
    }
    setState({ loading: false, error: "" });
  }

  const groups = results ? [
    ["Users and lawyers", results.users, (item) => `${item.name} · ${item.email} · ${item.phone}`, (item) => item.role === "LAWYER" ? "/admin/lawyers" : `/admin/users`],
    ["Appointments", results.appointments, (item) => `${item.id} · ${item.status} · ${item.user?.name || "User"}`, () => "/admin/appointments"],
    ["Payments", results.payments, (item) => `${item.id} · ${item.status} · ₹${item.amount}`, () => "/admin/payments"],
    ["Documents", results.documents, (item) => `${item.originalFileName} · ${item.status}`, () => "/admin/documents"],
  ] : [];

  return <div className="space-y-6">
    <div><p className="font-mono text-xs uppercase tracking-widest text-seal">Admin tools</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink">Global search</h1><p className="mt-2 text-sm text-ink-muted">Search users, lawyers, appointments, payments and documents from one place.</p></div>
    <form onSubmit={submit} className="flex max-w-2xl gap-3"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, phone, ID or filename" minLength={2} /><Button type="submit" disabled={state.loading}>{state.loading ? "Searching…" : "Search"}</Button></form>
    {state.error && <p role="alert" className="text-sm text-seal">{state.error}</p>}
    {groups.map(([title, items, label, href]) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{items?.length ? <ul className="divide-y divide-paper-line">{items.map((item) => <li key={item.id} className="py-3"><Link href={href(item)} className="text-sm text-ink hover:text-seal hover:underline">{label(item)}</Link></li>)}</ul> : <p className="text-sm text-ink-muted">No matching records.</p>}</CardContent></Card>)}
  </div>;
}
