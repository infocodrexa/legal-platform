"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, userApi, setAuthTokens, clearAuthTokens, setOnAuthFailure } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" until the initial silent-refresh attempt resolves — every
  // protected-route check waits for this so it never redirects to /login
  // just because the in-memory token hasn't been restored yet on a fresh
  // page load.
  const [status, setStatus] = useState("loading"); // loading | authenticated | unauthenticated

  const loadCurrentUser = useCallback(async () => {
    const { data } = await userApi.me();
    setUser(data.data);
    setStatus("authenticated");
    return data.data;
  }, []);

  // On mount: try a silent refresh using the httpOnly cookie. This is the
  // real replacement for the old mock-session.js — if it succeeds, the
  // user is logged in without re-entering credentials; if not, they're
  // simply logged out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await authApi.refresh();
        setAuthTokens({ accessToken: data.data.accessToken, csrfToken: data.data.csrfToken });
        if (!cancelled) await loadCurrentUser();
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCurrentUser]);

  // Wired into the api.js response interceptor — if a token refresh ever
  // fails mid-session (refresh token expired/revoked), fall back to a
  // clean logged-out state rather than looping failed requests forever.
  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  async function login({ identifier, password }) {
    const { data } = await authApi.login({ identifier, password });
    setAuthTokens({ accessToken: data.data.accessToken, csrfToken: data.data.csrfToken });
    return loadCurrentUser();
  }

  async function loginWithOtp({ identifier, otp }) {
    const { data } = await authApi.loginWithOtp({ identifier, otp, purpose: "LOGIN" });
    setAuthTokens({ accessToken: data.data.accessToken, csrfToken: data.data.csrfToken });
    return loadCurrentUser();
  }

  async function completeRegistration({ identifier, otp }) {
    const { data } = await authApi.verifyRegistrationOtp({ identifier, otp, purpose: "REGISTER" });
    setAuthTokens({ accessToken: data.data.accessToken, csrfToken: data.data.csrfToken });
    return loadCurrentUser();
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearAuthTokens();
      setUser(null);
      setStatus("unauthenticated");
    }
  }

  const value = {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    loginWithOtp,
    completeRegistration,
    logout,
    refetchUser: loadCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
