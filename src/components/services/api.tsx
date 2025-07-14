const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

export function setTokens({ access, refresh }) {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }
}

async function handleResponse(response) {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      window.location.href = "/signin";
    }
    return Promise.reject(new Error("Session expired"));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.detail || errorData.message || "API Error"
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

export async function apiGet(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
    ...options,
  });
  return handleResponse(response);
}

export async function apiPost(endpoint, data = {}, options = {}) {
  const token = getAuthToken();

  // Create headers object
  const headers = new Headers();

  // Only set Content-Type if it's not FormData
  if (!(data instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Merge custom headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  // Prepare body
  const body = data instanceof FormData ? data : JSON.stringify(data);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body,
    ...options,
  });

  return handleResponse(response);
}
