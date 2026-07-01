function normalizeBaseUrl(url: string) {
  const u = url.trim();
  if (!u) return u;
  return u.endsWith("/") ? u : `${u}/`;
}

// In development we rely on Vite proxy: "/api/v1/" → backend
// In production (Vercel) we proxy "/api/v1/" → backend via vercel.json rewrites.
const ENV_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL?.toString?.() ??
  (import.meta as any).env?.VITE_API_BASE_URL ??
  "";

const IS_DEV = Boolean((import.meta as any).env?.DEV);
const DEFAULT_BASE = IS_DEV ? "http://127.0.0.1:8001/api/v1/" : "/api/v1/";

export const BASE_URL = normalizeBaseUrl(ENV_BASE || DEFAULT_BASE);

type ApiErrorShape =
  | { detail?: string }
  | { message?: string }
  | Record<string, unknown>
  | unknown[];

export function getErrorMessage(err: unknown) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const e = err as ApiErrorShape;
    if (e && typeof e === "object") {
      const anyE = e as any;
      if (typeof anyE.detail === "string") return anyE.detail;
      if (typeof anyE.message === "string") return anyE.message;
      if (typeof anyE.error === "string") return anyE.error;
    }
  }
  return "Request failed";
}

function getAuthToken() {
  return localStorage.getItem("auth_token");
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return (token ? { Authorization: `Bearer ${token}` } : {}) as HeadersInit;
}

type JsonRequestInit = Omit<RequestInit, "body"> & { method: string; body?: unknown };

async function requestJson<TResponse>(
  path: string,
  init: JsonRequestInit
): Promise<TResponse> {
  const { body, ...rest } = init;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const res = await fetch(`${BASE_URL}${cleanPath}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore non-json
  }

  if (!res.ok) {
    throw data ?? new Error(`HTTP ${res.status}`);
  }

  return data as TResponse;
}

export async function getJson<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    ...(init ?? {}),
    method: "GET",
    body: undefined,
  });
}

export async function postJson<TResponse>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    ...((init ?? {}) as Omit<RequestInit, "body">),
    method: "POST",
    body,
  });
}

export async function putJson<TResponse>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    ...((init ?? {}) as Omit<RequestInit, "body">),
    method: "PUT",
    body,
  });
}

export async function patchJson<TResponse>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    ...((init ?? {}) as Omit<RequestInit, "body">),
    method: "PATCH",
    body,
  });
}

export async function deleteJson<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    ...((init ?? {}) as Omit<RequestInit, "body">),
    method: "DELETE",
    body: undefined,
  });
}

export async function postFormData<TResponse>(
  path: string,
  formData: FormData,
  init?: RequestInit
): Promise<TResponse> {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const res = await fetch(`${BASE_URL}${cleanPath}`, {
    ...init,
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
      // do NOT set Content-Type here; browser sets multipart boundary
    },
    body: formData,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore non-json
  }

  if (!res.ok) throw data ?? new Error(`HTTP ${res.status}`);
  return data as TResponse;
}

export async function putFormData<TResponse>(
  path: string,
  formData: FormData,
  init?: RequestInit
): Promise<TResponse> {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const res = await fetch(`${BASE_URL}${cleanPath}`, {
    ...init,
    method: "PUT",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
      // do NOT set Content-Type here; browser sets multipart boundary
    },
    body: formData,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore non-json
  }

  if (!res.ok) throw data ?? new Error(`HTTP ${res.status}`);
  return data as TResponse;
}

export async function patchFormData<TResponse>(
  path: string,
  formData: FormData,
  init?: RequestInit
): Promise<TResponse> {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const res = await fetch(`${BASE_URL}${cleanPath}`, {
    ...init,
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    body: formData,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore non-json
  }

  if (!res.ok) throw data ?? new Error(`HTTP ${res.status}`);
  return data as TResponse;
}

