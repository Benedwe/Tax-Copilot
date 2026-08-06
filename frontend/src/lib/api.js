const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("tc_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("tc_token", token);
  else window.localStorage.removeItem("tc_token");
}

async function request(path, { method = "GET", body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
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
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload, auth: false }),

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
    const token = getToken();
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
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: "DELETE" }),
};

export { getToken, API_URL };
