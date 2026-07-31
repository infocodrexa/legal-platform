"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notificationApi, userApi } from "@/lib/api";

const preferenceFields = [
  ["inAppEnabled", "In-app notifications"],
  ["emailEnabled", "Email notifications"],
  ["appointmentReminders", "Appointment reminders"],
  ["paymentUpdates", "Payment updates"],
  ["chatNotifications", "Chat notifications"],
  ["promotional", "Promotional updates"],
];

function messageFrom(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export function AccountSecuritySettings() {
  const [preferences, setPreferences] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError("");
    try {
      const [prefResponse, sessionResponse] = await Promise.all([notificationApi.preferences(), userApi.sessions()]);
      setPreferences(prefResponse.data.data);
      setSessions(sessionResponse.data.data || []);
    } catch (err) {
      setError(messageFrom(err, "Account preferences could not be loaded. Please try again."));
    }
  }

  useEffect(() => { load(); }, []);

  async function savePreferences() {
    setSaving(true);
    setError("");
    try {
      const payload = Object.fromEntries(preferenceFields.map(([key]) => [key, !!preferences[key]]));
      const { data } = await notificationApi.updatePreferences(payload);
      setPreferences(data.data);
    } catch (err) {
      setError(messageFrom(err, "Notification preferences could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function revokeSession(id) {
    try {
      await userApi.revokeSession(id);
      setSessions((current) => current.filter((session) => session.id !== id));
    } catch (err) {
      setError(messageFrom(err, "The selected device could not be signed out."));
    }
  }

  async function revokeAll() {
    try {
      await userApi.revokeAllSessions();
      setSessions([]);
      window.location.href = "/login";
    } catch (err) {
      setError(messageFrom(err, "Devices could not be signed out."));
    }
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Notification preferences</CardTitle><CardDescription>Choose how NyayaSetu contacts you. Critical security and transaction updates may still be delivered.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {!preferences ? <p className="text-sm text-ink-muted">Loading preferences…</p> : preferenceFields.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-sm border border-paper-line px-3 py-3 text-sm text-ink">
              <span>{label}</span>
              <input type="checkbox" checked={!!preferences[key]} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} />
            </label>
          ))}
          {preferences && <Button type="button" onClick={savePreferences} disabled={saving}>{saving ? "Saving…" : "Save preferences"}</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active devices</CardTitle><CardDescription>Review and sign out devices that have access to your account.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? <p className="text-sm text-ink-muted">No active sessions were found.</p> : sessions.map((session) => (
            <div key={session.id} className="flex flex-col justify-between gap-3 rounded-sm border border-paper-line p-3 sm:flex-row sm:items-center">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{session.userAgent || "Unknown device"}</p><p className="text-xs text-ink-muted">IP: {session.ipAddress || "Unavailable"} · Signed in {new Date(session.createdAt).toLocaleString()}</p></div>
              <Button type="button" variant="outline" onClick={() => revokeSession(session.id)}>Sign out</Button>
            </div>
          ))}
          {sessions.length > 0 && <Button type="button" variant="outline" onClick={revokeAll}>Sign out all devices</Button>}
          {error && <p role="alert" className="text-sm text-seal">{error}</p>}
        </CardContent>
      </Card>
    </>
  );
}
