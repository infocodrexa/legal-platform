"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lawyerApi, verificationApi, appointmentApi, reviewApi, paymentApi } from "@/lib/api";

// ---- Profile / KYC ----
export function useMyLawyerProfile() {
  return useQuery({
    queryKey: ["lawyer", "profile", "me"],
    queryFn: async () => (await lawyerApi.myProfile()).data.data,
    retry: false, // a 404 here just means "no profile yet" — not worth retrying
  });
}

export function useUpsertLawyerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => lawyerApi.upsertProfile(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lawyer", "profile"] }),
  });
}

// ---- Availability ----
export function useSetWorkingHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => lawyerApi.setWorkingHours(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lawyer", "profile"] }),
  });
}

export function useGenerateSlots() {
  return useMutation({
    mutationFn: (data) => lawyerApi.generateSlots(data),
  });
}

export function useMySlots(lawyerProfileId, params = {}) {
  return useQuery({
    queryKey: ["lawyer", "slots", lawyerProfileId, params],
    queryFn: async () => (await lawyerApi.listSlots(lawyerProfileId, params)).data.data,
    enabled: !!lawyerProfileId,
  });
}

// ---- Document review queue ----
export function useReviewQueue(params = {}) {
  return useQuery({
    queryKey: ["verification", "queue", params],
    queryFn: async () => (await verificationApi.queue(params)).data,
  });
}

export function useVerificationDocument(documentId) {
  return useQuery({
    queryKey: ["verification", documentId],
    queryFn: async () => (await verificationApi.get(documentId)).data.data,
    enabled: !!documentId,
  });
}

export function useStartReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId) => verificationApi.startReview(documentId),
    onSuccess: (_res, documentId) => {
      queryClient.invalidateQueries({ queryKey: ["verification", "queue"] });
      queryClient.invalidateQueries({ queryKey: ["verification", documentId] });
    },
  });
}

export function useDecideDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status, remarks }) => verificationApi.decide(documentId, { status, remarks }),
    onSuccess: (_res, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ["verification", "queue"] });
      queryClient.invalidateQueries({ queryKey: ["verification", documentId] });
    },
  });
}

// ---- Appointments (lawyer side) ----
export function useLawyerAppointments(params = {}) {
  return useQuery({
    queryKey: ["appointments", "lawyer-mine", params],
    queryFn: async () => (await appointmentApi.lawyerMine(params)).data,
  });
}

export function useLawyerAppointment(id) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: async () => (await appointmentApi.get(id)).data.data,
    enabled: !!id,
  });
}

export function useRespondToAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }) => appointmentApi.respond(id, { decision }),
    // Optimistic — accepting/rejecting should feel instant.
    onMutate: async ({ id, decision }) => {
      await queryClient.cancelQueries({ queryKey: ["appointments", id] });
      const previous = queryClient.getQueryData(["appointments", id]);
      queryClient.setQueryData(["appointments", id], (old) =>
        old ? { ...old, status: decision === "ACCEPT" ? "ACCEPTED" : "REJECTED" } : old
      );
      return { previous };
    },
    onError: (err, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(["appointments", id], context.previous);
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "lawyer-mine"] });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => appointmentApi.complete(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ["appointments", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "lawyer-mine"] });
    },
  });
}

// ---- Reviews received ----
export function useLawyerReviews(lawyerProfileId, params = {}) {
  return useQuery({
    queryKey: ["reviews", "lawyer", lawyerProfileId, params],
    queryFn: async () => (await reviewApi.listForLawyer(lawyerProfileId, params)).data,
    enabled: !!lawyerProfileId,
  });
}

// ---- Earnings ----
export function useLawyerEarnings(params = {}) {
  return useQuery({
    queryKey: ["payments", "lawyer-mine", params],
    queryFn: async () => (await paymentApi.lawyerMine(params)).data,
  });
}
