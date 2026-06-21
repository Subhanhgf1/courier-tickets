// lib/api.js
import { getAccessToken, logout } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";

const apiRequest = async (endpoint, options = {}) => {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401 && !endpoint.includes("/login")) {
      logout();
      throw new Error("Session expired. Please log in again.");
    }

    // Handle 304 Not Modified
    if (response.status === 304) {
      return { success: true, message: "Not modified", ok: true };
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = {
        error: `Request failed with status ${response.status}`,
      };
    }

    if (response.ok) return responseData;
    return { ok: false, error: responseData.error || `HTTP error ${response.status}` };
  } catch (err) {
    console.error("API Request failure:", err);
    return { ok: false, error: err.message || "Network error" };
  }
};

export const courierPortalApi = {
  login: async (email, password) => {
    return apiRequest("/api/courier-portal/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  
  getTickets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/courier-portal/tickets?${query}`);
  },

  getTicket: async (id) => {
    return apiRequest(`/api/courier-portal/tickets/${id}`);
  },

  respondToTicket: async (id, message, attachments = []) => {
    return apiRequest(`/api/courier-portal/tickets/${id}/responses`, {
      method: "POST",
      body: JSON.stringify({ message, attachments })
    });
  },

  updateStatus: async (id, status) => {
    return apiRequest(`/api/courier-portal/tickets/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
  },

  uploadAttachment: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/api/courier-portal/upload", {
      method: "POST",
      body: formData
    });
  }
};
