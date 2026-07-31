"use client";

import {
  FileText, CalendarDays, Wallet, Clock, Receipt, MessageSquare, Star,
  LifeBuoy, ShieldCheck, Users, Gavel, BarChart3, Newspaper, HelpCircle,
  CreditCard, Briefcase, Inbox, Image, DatabaseBackup, Quote, Search,
} from "lucide-react";

// Icon props on StatCard/EmptyState are passed as STRING NAMES, not
// component references — a React component reference is a function, and
// Next.js's RSC layer cannot serialize a function passed as a prop from a
// Server Component into a Client Component (or vice versa in some cases).
// Resolving the name to a component here, entirely inside the client
// bundle, sidesteps that boundary issue completely.
export const iconRegistry = {
  FileText, CalendarDays, Wallet, Clock, Receipt, MessageSquare, Star,
  LifeBuoy, ShieldCheck, Users, Gavel, BarChart3, Newspaper, HelpCircle,
  CreditCard, Briefcase, Inbox, Image, DatabaseBackup, Quote, Search,
  SearchIcon: Search,
};

export function resolveIcon(name) {
  return iconRegistry[name] ?? FileText;
}
