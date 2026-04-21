const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export class ApiError extends Error {
  status: number
  body?: any
  constructor(message: string, status: number, body?: any) {
    super(message)
    this.status = status
    this.body = body
  }
}

function getToken(): string | null {
  return localStorage.getItem("token")
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  }

  if (requiresAuth) {
    const token = getToken()
    if (!token) throw new ApiError("Not authenticated", 401)
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new ApiError(err.error ?? "Request failed", res.status, err)
  }

  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string, auth = true)               => request<T>("GET",    path, undefined, auth),
  post:   <T>(path: string, body: unknown, auth = true) => request<T>("POST",   path, body,      auth),
  put:    <T>(path: string, body: unknown, auth = true) => request<T>("PUT",    path, body,      auth),
  patch:  <T>(path: string, body: unknown, auth = true) => request<T>("PATCH",  path, body,      auth),
  delete: <T>(path: string, auth = true)               => request<T>("DELETE", path, undefined, auth),
}