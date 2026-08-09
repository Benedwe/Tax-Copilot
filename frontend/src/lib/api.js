import { getSupabaseClient } from "./supabaseClient";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? ""
    : "http://localhost:4000";


async function getToken() {
  if (typeof window === "undefined") return null;

  const supabase = getSupabaseClient();
  if (!supabase) return localStorage.getItem("tax_copilot_token") || null;

  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      return data.session.access_token;
    }
  } catch (err) {
    // Ignore supabase error
  }
  return localStorage.getItem("tax_copilot_token") || null;
}

async function request(path, { method = "GET", body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload, auth: false }),
  quickCalculate: (payload) => request("/api/calculator", { method: "POST", body: payload, auth: false }),


  listTaxReturns: () => request("/api/tax-returns"),
  createTaxReturn: (year) => request("/api/tax-returns", { method: "POST", body: { year } }),
  getTaxReturn: (id) => request(`/api/tax-returns/${id}`),
  deductionCategories: () => request("/api/tax-returns/deduction-categories"),
  addDeduction: (id, payload) => request(`/api/tax-returns/${id}/deductions`, { method: "POST", body: payload }),
  removeDeduction: (id, deductionId) =>
    request(`/api/tax-returns/${id}/deductions/${deductionId}`, { method: "DELETE" }),
  recalculate: (id, payload) => request(`/api/tax-returns/${id}/recalculate`, { method: "POST", body: payload }),
  markReviewed: (id) => request(`/api/tax-returns/${id}/mark-reviewed`, { method: "POST" }),
  pdfUrl: (id) => `${API_URL}/api/tax-returns/${id}/pdf`,
  downloadPdf: async (id, filename) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/tax-returns/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  listDocuments: (taxReturnId) => request(`/api/documents${taxReturnId ? `?taxReturnId=${taxReturnId}` : ""}`),
  uploadDocument: (formData) => request("/api/documents", { method: "POST", body: formData, isForm: true }),
  processDocument: (id) => request(`/api/documents/${id}/process`, { method: "POST" }),
  verifyDocument: (id) => request(`/api/documents/${id}/verify`, { method: "POST" }),
  updateDocumentExtractions: (id, extractions) =>
    request(`/api/documents/${id}/extractions`, { method: "PUT", body: { extractions } }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: "DELETE" }),
};

export { getToken, API_URL };
