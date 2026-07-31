import {
  LayoutDashboard, FileText, CalendarDays, Receipt, MessageSquare,
  Star, LifeBuoy, Settings, ShieldCheck, Clock, Wallet, Users,
  Gavel, BarChart3, Newspaper, HelpCircle, Quote, Search as SearchIcon,
  ScrollText, Ticket, SlidersHorizontal, Briefcase, Inbox, Image,
  DatabaseBackup, Bell, History,
} from "lucide-react";

export const userNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Appointments", href: "/dashboard/appointments", icon: CalendarDays },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const lawyerNav = [
  { label: "Overview", href: "/lawyer", icon: LayoutDashboard },
  { label: "KYC & Profile", href: "/lawyer/profile", icon: ShieldCheck },
  { label: "Document Queue", href: "/lawyer/documents", icon: FileText },
  { label: "Appointments", href: "/lawyer/appointments", icon: CalendarDays },
  { label: "Availability", href: "/lawyer/availability", icon: Clock },
  { label: "Earnings", href: "/lawyer/earnings", icon: Wallet },
  { label: "Messages", href: "/lawyer/messages", icon: MessageSquare },
  { label: "Reviews", href: "/lawyer/reviews", icon: Star },
  { label: "Settings", href: "/lawyer/settings", icon: Settings },
];

export const adminNav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Global Search", href: "/admin/search", icon: SearchIcon },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Lawyers & KYC", href: "/admin/lawyers", icon: Gavel },
  { label: "Documents", href: "/admin/documents", icon: FileText },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { label: "Payments", href: "/admin/payments", icon: Wallet },
  { label: "Refunds", href: "/admin/refunds", icon: Receipt },
  { label: "Reports & Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Blog", href: "/admin/cms/blog", icon: Newspaper },
  { label: "Services", href: "/admin/cms/services", icon: Briefcase },
  { label: "FAQ", href: "/admin/cms/faq", icon: HelpCircle },
  { label: "Testimonials", href: "/admin/cms/testimonials", icon: Quote },
  { label: "SEO", href: "/admin/cms/seo", icon: SearchIcon },
  { label: "Media Library", href: "/admin/media", icon: Image },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Support Tickets", href: "/admin/support", icon: Ticket },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Activity Timeline", href: "/admin/activity-events", icon: History },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Backups", href: "/admin/backups", icon: DatabaseBackup },
  { label: "Settings", href: "/admin/settings", icon: SlidersHorizontal },
];

export const navByRole = {
  USER: userNav,
  LAWYER: lawyerNav,
  ADMIN: adminNav,
  SUPER_ADMIN: adminNav,
};
