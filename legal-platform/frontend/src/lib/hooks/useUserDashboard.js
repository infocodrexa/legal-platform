"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  documentApi, appointmentApi, paymentApi, reviewApi, supportTicketApi, userApi, api,
} from "@/lib/api";

// ---- Documents ----
export function useDocuments(params = {}) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: async () => (await documentApi.list(params)).data,
  });
}

export function useDocument(id) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: async () => (await documentApi.get(id)).data.data,
    enabled: !!id,
  });
}

export function useDocumentHistory(id) {
  return useQuery({
    queryKey: ["documents", id, "history"],
    queryFn: async () => (await documentApi.history(id)).data.data,
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => documentApi.upload(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => documentApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// ---- Appointments ----
export function useMyAppointments(params = {}) {
  return useQuery({
    queryKey: ["appointments", "mine", params],
    queryFn: async () => (await appointmentApi.mine(params)).data,
  });
}

export function useAppointment(id) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: async () => (await appointmentApi.get(id)).data.data,
    enabled: !!id,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => appointmentApi.cancel(id, { reason }),
    // Optimistic update — the cancel button should feel instant, then
    // reconcile with the server's actual response.
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["appointments", id] });
      const previous = queryClient.getQueryData(["appointments", id]);
      queryClient.setQueryData(["appointments", id], (old) => (old ? { ...old, status: "CANCELLED" } : old));
      return { previous };
    },
    onError: (err, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(["appointments", id], context.previous);
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
    },
  });
}

// ---- Payments ----
export function useMyPayments(params = {}) {
  return useQuery({
    queryKey: ["payments", "mine", params],
    queryFn: async () => (await paymentApi.mine(params)).data,
  });
}

// ---- Reviews ----
export function useMyReviews(params = {}) {
  return useQuery({
    queryKey: ["reviews", "mine", params],
    queryFn: async () => (await reviewApi.mine(params)).data,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => reviewApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

// ---- Support tickets ----
export function useMyTickets(params = {}) {
  return useQuery({
    queryKey: ["support-tickets", "mine", params],
    queryFn: async () => (await supportTicketApi.mine(params)).data,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => supportTicketApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-tickets", "mine"] }),
  });
}

// ---- Profile ----
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    // Matches backend/src/routes/user.routes.js PATCH /users/me
    mutationFn: (data) => api.patch("/users/me", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await userApi.me()).data.data,
  });
}
