import { getAccessToken } from "@/lib/auth/session"

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000"

export class BackendRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = "BackendRequestError"
  }
}

/**
 * Server-only helper for calling the real Fastify backend from Route
 * Handlers / Server Components / Server Actions. Attaches the caller's JWT
 * (read from the httpOnly access_token cookie) automatically — never call
 * this from a Client Component.
 */
export async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken()

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ message: response.statusText }))
    throw new BackendRequestError(
      body.message ?? "Backend request failed",
      response.status,
    )
  }

  return response.json() as Promise<T>
}
