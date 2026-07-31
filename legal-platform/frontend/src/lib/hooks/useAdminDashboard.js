"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi, refundApi, leadApi, mediaApi, backupApi,
  blogApi, faqApi, testimonialApi, seoApi, serviceApi, supportTicketApi, lawyerApi,
} from "@/lib/api";

// ---- Overview / Analytics ----
export function useAdminOverview() {
  return useQuery({ queryKey: ["admin", "overview"], queryFn: async () => (await adminApi.overview()).data.data });
}

export function useAdminRevenue(params = {}) {
  return useQuery({ queryKey: ["admin", "revenue", params], queryFn: async () => (await adminApi.revenue(params)).data.data });
}

// ---- Users ----
export function useAdminUsers(params = {}) {
  return useQuery({ queryKey: ["admin", "users", params], queryFn: async () => (await adminApi.listUsers(params)).data });
}

export function useAdminUser(id) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: async () => (await adminApi.getUser(id)).data.data,
    enabled: !!id,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isBanned, reason }) => adminApi.banUser(id, { isBanned, reason }),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useForceLogout() {
  return useMutation({ mutationFn: (id) => adminApi.forceLogout(id) });
}

// ---- Lawyers & KYC ----
export function useAdminLawyers(params = {}) {
  return useQuery({ queryKey: ["admin", "lawyers", params], queryFn: async () => (await adminApi.listLawyers(params)).data });
}

export function useDecideKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lawyerProfileId, decision, remarks }) => lawyerApi.decideKyc(lawyerProfileId, { decision, remarks }),
    onSuccess: (_res, { lawyerProfileId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "lawyers", lawyerProfileId] });
    },
  });
}

export function useAdminLawyer(id) {
  return useQuery({
    queryKey: ["admin", "lawyers", id],
    queryFn: async () => (await adminApi.getLawyer(id)).data.data,
    enabled: !!id,
  });
}

// ---- Documents oversight ----
export function useAdminDocuments(params = {}) {
  return useQuery({ queryKey: ["admin", "documents", params], queryFn: async () => (await adminApi.listDocuments(params)).data });
}

// ---- Appointments oversight ----
export function useAdminAppointments(params = {}) {
  return useQuery({ queryKey: ["admin", "appointments", params], queryFn: async () => (await adminApi.listAppointments(params)).data });
}

// ---- Payments ----
export function useAdminPayments(params = {}) {
  return useQuery({ queryKey: ["admin", "payments", params], queryFn: async () => (await adminApi.listPayments(params)).data });
}

// ---- Refunds ----
export function useAdminRefunds(params = {}) {
  return useQuery({ queryKey: ["refunds", params], queryFn: async () => (await refundApi.listAll(params)).data });
}

export function useApproveRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => refundApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  });
}

export function useRejectRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }) => refundApi.reject(id, { rejectionReason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => refundApi.process(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  });
}

// ---- Leads ----
export function useAdminLeads(params = {}) {
  return useQuery({ queryKey: ["leads", params], queryFn: async () => (await leadApi.listAll(params)).data });
}

export function useAdminLead(id) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: async () => (await leadApi.get(id)).data.data,
    enabled: !!id,
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => leadApi.update(id, data),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ---- Media library ----
export function useAdminMedia(params = {}) {
  return useQuery({ queryKey: ["media", params], queryFn: async () => (await mediaApi.list(params)).data });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => mediaApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
  });
}

// ---- Backups ----
export function useAdminBackups(params = {}) {
  return useQuery({ queryKey: ["backups", params], queryFn: async () => (await backupApi.list(params)).data });
}

export function useTriggerBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => backupApi.trigger(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });
}

export function useRequestRestore() {
  return useMutation({ mutationFn: ({ id, reason }) => backupApi.requestRestore(id, { reason }) });
}

// ---- CMS: Blog ----
export function useAdminBlogPosts(params = {}) {
  return useQuery({ queryKey: ["blog", "admin", params], queryFn: async () => (await blogApi.listAllAdmin(params)).data });
}

export function useAdminBlogPost(id) {
  return useQuery({
    queryKey: ["blog", "admin", id],
    queryFn: async () => (await blogApi.getByIdAdmin(id)).data.data,
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => blogApi.create(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog", "admin"] }),
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => blogApi.update(id, formData),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["blog", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["blog", "admin", id] });
    },
  });
}

export function usePublishBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => blogApi.publish(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog", "admin"] }),
  });
}

// ---- CMS: FAQ ----
export function useAdminFaqs(params = {}) {
  return useQuery({ queryKey: ["faq", "admin", params], queryFn: async () => (await faqApi.listAllAdmin(params)).data });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => faqApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faq", "admin"] }),
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => faqApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faq", "admin"] }),
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => faqApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faq", "admin"] }),
  });
}

// ---- CMS: Testimonials ----
export function useAdminTestimonials(params = {}) {
  return useQuery({ queryKey: ["testimonials", "admin", params], queryFn: async () => (await testimonialApi.listAllAdmin(params)).data });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => testimonialApi.create(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials", "admin"] }),
  });
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => testimonialApi.update(id, formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials", "admin"] }),
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => testimonialApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials", "admin"] }),
  });
}

// ---- CMS: SEO ----
export function useAdminSeoEntries(params = {}) {
  return useQuery({ queryKey: ["seo", "admin", params], queryFn: async () => (await seoApi.listAllAdmin(params)).data });
}

export function useUpsertSeoEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => seoApi.upsert(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seo", "admin"] }),
  });
}

export function useDeleteSeoEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => seoApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seo", "admin"] }),
  });
}

// ---- CMS: Services ----
export function useAdminServices(params = {}) {
  return useQuery({ queryKey: ["services", "admin", params], queryFn: async () => (await serviceApi.listAllAdmin(params)).data });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => serviceApi.create(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services", "admin"] }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => serviceApi.update(id, formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services", "admin"] }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => serviceApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services", "admin"] }),
  });
}

// ---- Support tickets ----
export function useAdminTickets(params = {}) {
  return useQuery({ queryKey: ["support-tickets", "admin", params], queryFn: async () => (await supportTicketApi.listAll(params)).data });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolutionNotes }) => supportTicketApi.updateStatus(id, { status, resolutionNotes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-tickets", "admin"] }),
  });
}

// ---- Audit logs ----
export function useAuditLogs(params = {}) {
  return useQuery({ queryKey: ["admin", "audit-logs", params], queryFn: async () => (await adminApi.listAuditLogs(params)).data });
}


// ---- Activity Timeline ----
export function useActivityEvents(params = {}) {
  return useQuery({
    queryKey: ["admin", "activity-events", params],
    queryFn: async () =>
      (await adminApi.listActivityEvents(params)).data,
  });
}

export function useActivityEvent(id) {
  return useQuery({
    queryKey: ["admin", "activity-events", id],
    queryFn: async () =>
      (await adminApi.getActivityEvent(id)).data.data,
    enabled: !!id,
  });
}