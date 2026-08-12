import { getSupabaseClient } from "./supabaseClient";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? ""
    : "http://localhost:4000";


const clientCache = new Map();

export function clearApiCache() {
  clientCache.clear();
}

async function getToken() {
  if (typeof window === "undefined") return null;

  const localToken = localStorage.getItem("tax_copilot_token");
  if (localToken) return localToken;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    } catch (err) {
      // Ignore supabase error
    }
  }
  return null;
}

async function request(path, { method = "GET", body, isForm = false, auth = true, useCache = false, cacheTtlMs = 60000 } = {}) {
  // Clear cache on state-changing requests
  if (method !== "GET") {
    clearApiCache();
  }

  // Check client-side cache for GET requests if requested
  if (method === "GET" && useCache) {
    const cached = clientCache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch (err) {
      // Non-JSON response
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    let message = data?.error;
    if (!message) {
      if (res.status === 504) {
        message = "Server gateway timeout (504). Please verify that the database server and API backend are running.";
      } else if (res.status === 502 || res.status === 503) {
        message = `Service temporarily unavailable (${res.status}). Please check system status and try again.`;
      } else {
        message = `Request failed (${res.status})`;
      }
    }
    throw new Error(message);
  }

  if (method === "GET" && useCache && data) {
    clientCache.set(path, { data, expiresAt: Date.now() + cacheTtlMs });
  }

  return data;
}

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload, auth: false }),
  logout: () => request("/api/auth/logout", { method: "POST", auth: false }),
  getProfile: () => request("/api/auth/me", { useCache: true, cacheTtlMs: 10000 }),
  updateTin: (tin) => request("/api/auth/tin", { method: "PUT", body: { tin } }),
  quickCalculate: (payload) => request("/api/calculator", { method: "POST", body: payload, auth: false }),

  listTaxReturns: () => request("/api/tax-returns", { useCache: true, cacheTtlMs: 15000 }),
  createTaxReturn: (year) => request("/api/tax-returns", { method: "POST", body: { year } }),
  getTaxReturn: (id) => request(`/api/tax-returns/${id}`, { useCache: true, cacheTtlMs: 15000 }),
  deductionCategories: () => request("/api/tax-returns/deduction-categories", { useCache: true, cacheTtlMs: 3600000 }),
  addDeduction: (id, payload) => request(`/api/tax-returns/${id}/deductions`, { method: "POST", body: payload }),
  removeDeduction: (id, deductionId) =>
    request(`/api/tax-returns/${id}/deductions/${deductionId}`, { method: "DELETE" }),
  recalculate: (id, payload) => request(`/api/tax-returns/${id}/recalculate`, { method: "POST", body: payload }),
  markReviewed: (id) => request(`/api/tax-returns/${id}/mark-reviewed`, { method: "POST" }),
  pdfUrl: (id) => `${API_URL}/api/tax-returns/${id}/pdf`,
  downloadPdf: async (id, filename) => {
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}/api/tax-returns/${id}/pdf`, {
      headers,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not generate PDF.");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "tax-return.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  listDocuments: (taxReturnId) => request(`/api/documents${taxReturnId ? `?taxReturnId=${taxReturnId}` : ""}`, { useCache: true, cacheTtlMs: 10000 }),
  uploadDocument: (formData) => request("/api/documents", { method: "POST", body: formData, isForm: true }),
  processDocument: (id) => request(`/api/documents/${id}/process`, { method: "POST" }),
  verifyDocument: (id) => request(`/api/documents/${id}/verify`, { method: "POST" }),
  updateDocumentExtractions: (id, extractions) =>
    request(`/api/documents/${id}/extractions`, { method: "PUT", body: { extractions } }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: "DELETE" }),
  clearCache: clearApiCache,
};

export { getToken, API_URL };

