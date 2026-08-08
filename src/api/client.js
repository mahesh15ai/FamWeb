import axios from "axios";

// Fallback base URL
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// 🎯 FIX 1: Strip trailing slashes from baseURL to prevent "//" double slashes
const normalizedBaseURL = API_BASE_URL.replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Token & Log Outgoing Requests
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 🎯 FIX 2: Ensure clean URL logging without double slashes
    const endpoint = config.url?.startsWith("/") ? config.url : `/${config.url}`;
    console.log(`[API Request] ${config.method?.toUpperCase()} -> ${config.baseURL}${endpoint}`);
    
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

// Response Interceptor: Handle Token Expiration & Refresh Flow
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.error(
      `[API Response Error] ${error.config?.url} | Status: ${error.response?.status || "NETWORK_ERROR"}`,
      error.response?.data || error.message
    );

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 🎯 FIX 3: Clean refresh endpoint path
      const refreshUrl = `${normalizedBaseURL}/auth/token/refresh/`;
      const { data } = await axios.post(refreshUrl, {
        refresh: refreshToken,
      });

      localStorage.setItem("access_token", data.access);
      resolveQueue(null, data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolveQueue(refreshError, null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;