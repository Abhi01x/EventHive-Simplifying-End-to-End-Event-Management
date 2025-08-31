export const dynamic = "force-dynamic"

import { API_CONFIG } from "@/lib/api-config"

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || API_CONFIG.BASE_URL).replace(/\/+$/, "")

function pickAuth(headers: Headers) {
  // Support both Authorization and x-access-token
  const auth = headers.get("authorization") || headers.get("Authorization")
  const xAccess = headers.get("x-access-token") || headers.get("X-Access-Token")
  return { auth, xAccess }
}

export function buildUpstreamHeaders(req: Request) {
  const { auth, xAccess } = pickAuth(new Headers(req.headers))
  const headers: Record<string, string> = {
    accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  }
  if (auth) headers["Authorization"] = auth
  if (xAccess) headers["x-access-token"] = xAccess
  return { headers, hasAuth: !!auth, hasXAccess: !!xAccess }
}

export async function proxyJson(upstreamUrl: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 15000)
  try {
    const res = await fetch(upstreamUrl, {
      ...init,
      signal: controller.signal,
      next: { revalidate: 0 },
    })
    const contentType = res.headers.get("content-type") || ""
    let body: any
    if (contentType.includes("application/json")) {
      body = await res.json()
    } else {
      const text = await res.text().catch(() => "")
      body = { error: true, status: res.status, message: "Non-JSON upstream", raw: text }
    }
    return new Response(JSON.stringify(body), {
      status: res.status,
      headers: { "content-type": "application/json" },
    })
  } catch (err: any) {
    console.error("[SERVER][v0] Proxy error:", upstreamUrl, err?.message)
    return new Response(JSON.stringify({ error: true, message: err?.message || "Proxy failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  } finally {
    clearTimeout(timeout)
  }
}
