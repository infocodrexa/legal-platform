import axios from "axios";

// withCredentials so the httpOnly refresh-token cookie is sent/received —
// see backend/src/controllers/auth.controller.js for the cookie contract.
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// In-memory access token — never persisted to localStorage (XSS-exposed);
// restored via the httpOnly-cookie refresh flow on app mount instead (see
// AuthProvider). Lost on a full page reload until that silent refresh runs.
let accessToken = null;
let csrfToken = null;

export function setAuthTokens({ accessToken: at, csrfToken: ct }) {
  accessToken = at ?? accessToken;
  csrfToken = ct ?? csrfToken;
}

export function clearAuthTokens() {
  accessToken = null;
  csrfToken = null;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method)) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

// ---------------------------------------------------------------------
// 401 handling: a single in-flight refresh shared by every request that
// hits it concurrently (no thundering herd of refresh calls), each queued
// request automatically retried once with the new token. If the refresh
// itself fails, every queued request rejects and the caller (AuthProvider)
// is responsible for redirecting to /login.
// ---------------------------------------------------------------------
let refreshPromise = null;
let onAuthFailure = null;

export function setOnAuthFailure(fn) {
  onAuthFailure = fn;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthRoute = config?.url?.startsWith("/auth/");

    if (response?.status !== 401 || isAuthRoute || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post("/auth/refresh-token").finally(() => {
          refreshPromise = null;
        });
      }
      const { data } = await refreshPromise;
      setAuthTokens({ accessToken: data.data.accessToken, csrfToken: data.data.csrfToken });
      config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(config);
    } catch (refreshError) {
      clearAuthTokens();
      onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  }
);

// ---------------------------------------------------------------------
// Endpoint modules — one per backend route file, same shape/naming so a
// glance at backend/src/routes/*.js tells you exactly what's here.
// ---------------------------------------------------------------------

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  requestOtp: (data) => api.post("/auth/otp/request", data),
  verifyRegistrationOtp: (data) => api.post("/auth/otp/verify-registration", data),
  login: (data) => api.post("/auth/login", data),
  loginWithOtp: (data) => api.post("/auth/login/otp", data),
  refresh: () => api.post("/auth/refresh-token"),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

export const userApi = {
  me: () => api.get("/users/me"),
};

// export const documentApi = {
//   upload: (formData) => api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } }),
//   list: (params) => api.get("/documents", { params }),
//   get: (id) => api.get(`/documents/${id}`),
//   history: (id) => api.get(`/documents/${id}/history`),
//   replace: (id, formData) => api.put(`/documents/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
//   remove: (id) => api.delete(`/documents/${id}`),
// };

export const documentApi = {
  upload: (formData) =>
    api.post("/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  list: (params) =>
    api.get("/documents", { params }),

  get: (id) =>
    api.get(`/documents/${id}`),

  history: (id) =>
    api.get(`/documents/${id}/history`),

  replace: (id, formData) =>
    api.put(`/documents/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  remove: (id) =>
    api.delete(`/documents/${id}`),

  clientDocuments: (userId, params = {}) =>
    api.get("/documents", {
      params: {
        userId,
        ...params,
      },
    }),

  remove: (id) =>
  api.delete(`/documents/${id}`),
};

export const verificationApi = {
  queue: (params) => api.get("/verification/queue", { params }),
  get: (documentId) => api.get(`/verification/${documentId}`),
  startReview: (documentId) => api.post(`/verification/${documentId}/start`),
  decide: (documentId, data) => api.post(`/verification/${documentId}/decision`, data),
};

export const lawyerApi = {
  listPublicDirectory: (params) => api.get("/lawyers", { params }),
  getPublicProfile: (lawyerProfileId) => api.get(`/lawyers/${lawyerProfileId}/public`),
  getForAdmin: (lawyerProfileId) => api.get(`/lawyers/${lawyerProfileId}/admin`),
  upsertProfile: (formData) => api.post("/lawyers/profile", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  myProfile: () => api.get("/lawyers/profile/me"),
  decideKyc: (lawyerProfileId, data) => api.patch(`/lawyers/${lawyerProfileId}/kyc`, data),
  setRazorpayAccount: (lawyerProfileId, data) => api.patch(`/lawyers/${lawyerProfileId}/razorpay-account`, data),
  setWorkingHours: (data) => api.put("/lawyers/working-hours", data),
  generateSlots: (data) => api.post("/lawyers/slots/generate", data),
  availabilityCalendar: (lawyerProfileId, params) => api.get(  `/lawyers/${lawyerProfileId}/availability-calendar`, { params } ),
  listSlots: (lawyerProfileId, params) => api.get(`/lawyers/${lawyerProfileId}/slots`, { params }),
};

export const appointmentApi = {
  book: (data) => api.post("/appointments", data),
  mine: (params) => api.get("/appointments/mine", { params }),
  lawyerMine: (params) => api.get("/appointments/lawyer/mine", { params }),
  get: (id) => api.get(`/appointments/${id}`),
  getAdmin: (id) => api.get(`/appointments/admin/${id}`),
  respond: (id, data) => api.post(`/appointments/${id}/respond`, data),
  cancel: (id, data) => api.post(`/appointments/${id}/cancel`, data),
  complete: (id) => api.post(`/appointments/${id}/complete`),
  reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
};

export const paymentApi = {
  createOrder: (data) => api.post("/payments/orders", data),
  confirm: (data) => api.post("/payments/confirm", data),
  mine: (params) => api.get("/payments/mine", { params }),
  lawyerMine: (params) => api.get("/payments/lawyer/mine", { params }),
  get: (id) => api.get(`/payments/${id}`),
};

export const refundApi = {
  request: (data) => api.post("/refunds", data),
  get: (id) => api.get(`/refunds/${id}`),
  listAll: (params) => api.get("/refunds", { params }),
  approve: (id) => api.post(`/refunds/${id}/approve`),
  reject: (id, data) => api.post(`/refunds/${id}/reject`, data),
  process: (id) => api.post(`/refunds/${id}/process`),
};

// export const notificationApi = {
//   mine: (params) => api.get("/notifications/mine", { params }),
//   markRead: (id) => api.patch(`/notifications/${id}/read`),
//   markAllRead: () => api.patch("/notifications/mine/read-all"),
//   preferences: () => api.get("/notifications/preferences"),
//   updatePreferences: (data) => api.patch("/notifications/preferences", data),
//   adminSend: (data) => api.post("/notifications/admin/send", data),
// };



export const notificationApi = {
  // Existing
  mine: (params) =>
    api.get("/notifications/mine", { params }),

  markRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  markUnread: (id) =>
    api.patch(`/notifications/${id}/unread`),

  markAllRead: () =>
    api.patch("/notifications/mine/read-all"),

  // New
  remove: (id) =>
    api.delete(`/notifications/${id}`),

  deleteAll: () =>
    api.delete("/notifications/mine"),

  deleteRead: () =>
    api.delete("/notifications/mine/read"),

  // Existing (keep these)
  preferences: () =>
    api.get("/notifications/preferences"),

  updatePreferences: (data) =>
    api.patch("/notifications/preferences", data),

  adminSend: (data) =>
    api.post("/notifications/admin/send", data),
};

export const chatApi = {
  history: (appointmentId, params) => api.get(`/chat/${appointmentId}/messages`, { params }),
  uploadAttachment: (appointmentId, formData) =>
    api.post(`/chat/${appointmentId}/attachments`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

export const reviewApi = {
  create: (data) => api.post("/reviews", data),
  mine: (params) => api.get("/reviews/mine", { params }),
  listForLawyer: (lawyerProfileId, params) => api.get(`/reviews/lawyer/${lawyerProfileId}`, { params }),
  listAll: (params) => api.get("/reviews", { params }),
  moderate: (reviewId, data) => api.patch(`/reviews/${reviewId}/moderate`, data),
};

export const supportTicketApi = {
  create: (data) => api.post("/support-tickets", data),
  mine: (params) => api.get("/support-tickets/mine", { params }),
  get: (id) => api.get(`/support-tickets/${id}`),
  reply: (id, data) => api.post(`/support-tickets/${id}/replies`, data),
  listAll: (params) => api.get("/support-tickets", { params }),
  updateStatus: (id, data) => api.patch(`/support-tickets/${id}/status`, data),
  assign: (id, data) => api.patch(`/support-tickets/${id}/assign`, data),
};

export const blogApi = {
  listPublished: (params) => api.get("/blog", { params }),
  getBySlug: (slug) => api.get(`/blog/slug/${slug}`),
  listAllAdmin: (params) => api.get("/blog/admin", { params }),
  getByIdAdmin: (id) => api.get(`/blog/admin/${id}`),
  create: (formData) => api.post("/blog/admin", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/blog/admin/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  publish: (id, data) => api.patch(`/blog/admin/${id}/publish`, data),
  remove: (id) => api.delete(`/blog/admin/${id}`),
};

export const faqApi = {
  listPublic: (params) => api.get("/faq", { params }),
  listAllAdmin: (params) => api.get("/faq/admin", { params }),
  create: (data) => api.post("/faq/admin", data),
  update: (id, data) => api.put(`/faq/admin/${id}`, data),
  remove: (id) => api.delete(`/faq/admin/${id}`),
};

export const testimonialApi = {
  listPublic: () => api.get("/testimonials"),
  listAllAdmin: (params) => api.get("/testimonials/admin", { params }),
  create: (formData) => api.post("/testimonials/admin", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/testimonials/admin/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/testimonials/admin/${id}`),
};

export const seoApi = {
  getByPath: (path) => api.get("/seo", { params: { path } }),
  listAllAdmin: (params) => api.get("/seo/admin", { params }),
  upsert: (formData) => api.post("/seo/admin", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/seo/admin/${id}`),
};

export const serviceApi = {
  listPublished: (params) => api.get("/services", { params }),
  getBySlug: (slug) => api.get(`/services/slug/${slug}`),
  listAllAdmin: (params) => api.get("/services/admin", { params }),
  getByIdAdmin: (id) => api.get(`/services/admin/${id}`),
  create: (formData) => api.post("/services/admin", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/services/admin/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/services/admin/${id}`),
};

export const leadApi = {
  create: (data) => api.post("/leads", data),
  listAll: (params) => api.get("/leads", { params }),
  get: (id) => api.get(`/leads/${id}`),
  update: (id, data) => api.patch(`/leads/${id}`, data),
};

export const mediaApi = {
  list: (params) => api.get("/admin/media", { params }),
  get: (id) => api.get(`/admin/media/${id}`),
  contexts: () => api.get("/admin/media/contexts"),
  remove: (id) => api.delete(`/admin/media/${id}`),
};

export const backupApi = {
  trigger: () => api.post("/admin/backups"),
  list: (params) => api.get("/admin/backups", { params }),
  download: (id) => api.get(`/admin/backups/${id}/download`),
  requestRestore: (id, data) => api.post(`/admin/backups/${id}/request-restore`, data),
};

export const messageTemplateApi = {
  list: (params) => api.get("/admin/message-templates", { params }),
  upsert: (data) => api.post("/admin/message-templates", data),
  remove: (id) => api.delete(`/admin/message-templates/${id}`),
  preview: (data) => api.post("/admin/message-templates/preview", data),
};

export const adminApi = {
  overview: () => api.get("/admin/analytics/overview"),
  revenue: (params) => api.get("/admin/analytics/revenue", { params }),
  listUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  banUser: (id, data) => api.patch(`/admin/users/${id}/ban`, data),
  forceLogout: (id) => api.post(`/admin/users/${id}/force-logout`),
  listLawyers: (params) => api.get("/admin/lawyers", { params }),
  getLawyer: (id) => api.get(`/admin/lawyers/${id}`),
  listPayments: (params) => api.get("/admin/payments", { params }),
  listDocuments: (params) => api.get("/admin/documents", { params }),
  listAppointments: (params) => api.get("/admin/appointments", { params }),
  listAuditLogs: (params) => api.get("/admin/audit-logs", { params }),
  // 👇 Ye dono add karo
  listActivityEvents: (params) =>
    api.get("/admin/activity-events", { params }),

  getActivityEvent: (id) =>
    api.get(`/admin/activity-events/${id}`),
  globalSearch: (params) => api.get("/admin/search", { params }),
  timeline: (entityType, entityId, params) => api.get(`/admin/timeline/${entityType}/${entityId}`, { params }),
  addTimeline: (data) => api.post("/admin/timeline", data),
  notes: (entityType, entityId, params) => api.get(`/admin/notes/${entityType}/${entityId}`, { params }),
  addNote: (data) => api.post("/admin/notes", data),
  updateNote: (id, data) => api.patch(`/admin/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/admin/notes/${id}`),
};
