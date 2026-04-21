import { BASE_URL } from "./api_list";
import { clearSession } from "../utils/sessionManager";

/**
 * Universal HTTP wrapper
 * - Handles JWT Authorization
 * - Supports JSON & FormData
 * - Centralized 401 handling
 */
export const http = async (
  url: string,
  options: RequestInit = {}
) => {
  /* =========================
     TOKEN HANDLING
  ========================= */
  let token = localStorage.getItem("token");

  // Sanitize token (remove literal "null" or "undefined" strings)
  if (!token || token === "undefined" || token === "null") {
    token = null;
  }

  const isFormData = options.body instanceof FormData;

  // Normalize Authorization header: Ensure exactly one "Bearer " prefix
  const authHeader = token
    ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`)
    : undefined;

  /* =========================
     HEADERS (SAFE BUILD)
  ========================= */
  const headers = new Headers();

  // Standard Required Headers
  headers.set("Accept", "application/json");
  headers.set("x-api-key", "WEB-Y5YQ8C8VP-MO6Z1XKN");
  headers.set("x-service-name", "Epay_Recharge");
  headers.set("x-platform", "WEB");

  // Set JSON content type ONLY if body is not FormData
  if (!isFormData && options.body) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Authorization EXCEPT for login API
  // We check if the URL contains "login" to exclude it from having the Authorization header
  const isLoginApi = url.includes("/login");
  if (authHeader && !isLoginApi) {
    headers.set("Authorization", authHeader);
  }

  // Merge custom headers safely (do NOT override Authorization or standard headers)
  if (options.headers) {
    const standardHeaders = ["x-api-key", "x-service-name", "x-platform", "authorization"];
    Object.entries(options.headers as Record<string, string>).forEach(
      ([key, value]) => {
        if (!standardHeaders.includes(key.toLowerCase())) {
          headers.set(key, value);
        }
      }
    );
  }

  /* =========================
     URL NORMALIZATION
  ========================= */
  const normalizedBase = BASE_URL.replace(/\/+$/, "");
  const normalizedPath = url.replace(/^\/+/, "");
  const finalUrl = normalizedBase + "/" + normalizedPath;

  console.log(`📡 [HTTP] ${options.method || "GET"} -> ${finalUrl}`);
  if (token) {
    const partial = token.length > 20 ? token.substring(0, 15) + "..." : token;
    console.log(`🔑 Auth: ${partial}`);
  } else if (!url.includes("/auth")) {
    console.warn("🔐 Auth: No token found");
  }

  /* =========================
     FETCH REQUEST
  ========================= */
  const response = await fetch(finalUrl, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // If backend returned non-JSON but success (e.g. plain text "OK")
    if (response.ok) {
      return text;
    }
    // If it failed and is not JSON (like a 404 HTML page)
    const snippet = text.length > 100 ? text.substring(0, 97) + "..." : text;
    throw new Error(`HTTP ${response.status}: Invalid JSON response from ${url}. Body: ${snippet}`);
  }

  /* =========================
     GLOBAL 401 HANDLING
  ========================= */
  /* =========================
     401 / 403 HANDLING
  ========================= */
  if (response.status === 401 && !url.includes("/auth")) {
    const errorDetail = data?.message || data?.error || (typeof data === 'object' ? JSON.stringify(data) : text) || "No response body";
    console.error(`⛔ [401 Unauthorized]`);
    console.error(`🔗 URL: ${finalUrl}`);
    console.error(`📝 Message: ${errorDetail}`);

    // Clear session and redirect to login
    clearSession();
    window.location.href = "/login";

    throw new Error(errorDetail);
  }

  /* =========================
     ERROR HANDLING
  ========================= */
  if (!response.ok) {
    const truncatedText = text.length > 200 ? text.substring(0, 197) + "..." : text;
    console.error(`❌ [HTTP ERROR] ${response.status} from ${finalUrl}`);
    console.error(`📄 Response: ${truncatedText}`);

    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
};

/**
 * Returns the current logged-in user's ID.
 * Defaults to "1" if not found (legacy fallback).
 */
export const getUserId = (): string => {
  try {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      return String(user.id || user.user_id || "1");
    }
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }
  return "1";
};

/**
 * Utility to manually set session in console for testing
 * Usage: setSession("TOKEN_HERE", { id: 2, email: "..." })
 */
(window as any).getUserId = getUserId;
(window as any).setSession = (token: string, user: any = {}) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  console.log("✅ Session set. Refresh the page to apply.");
};
