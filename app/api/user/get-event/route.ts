import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/api-config"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || API_CONFIG.BASE_URL.replace(/\/+$/, "")

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const xAccessToken = request.headers.get("x-access-token")
    console.log("[v0] Proxy headers -> hasAuth:", !!authHeader, "hasXAccess:", !!xAccessToken)
    if (!authHeader && !xAccessToken) {
      return NextResponse.json({ error: "No authorization token provided" }, { status: 401 })
    }

    const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.USER.GET_EVENT}`
    console.log("[v0] Proxy -> GET", url)

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(xAccessToken ? { "x-access-token": xAccessToken } : {}),
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const text = await res.text()
      let payload: any
      try {
        payload = JSON.parse(text)
      } catch {
        payload = { message: text }
      }
      const status = res.status
      console.log("[v0] /user/get-event upstream error:", status, payload)
      return NextResponse.json(
        {
          error: "UPSTREAM_ERROR",
          status,
          // include possible keys from upstream such as `msg`
          message: payload?.message || payload?.msg || payload?.error || "Failed to fetch events",
          raw: payload,
        },
        { status },
      )
    }

    const data = await res.json()
    console.log("[v0] /user/get-event upstream ok:", {
      status: res.status,
      type: typeof data,
      keys: data && typeof data === "object" ? Object.keys(data) : null,
      length: Array.isArray(data)
        ? data.length
        : Array.isArray((data as any)?.data)
          ? (data as any).data.length
          : Array.isArray((data as any)?.events)
            ? (data as any).events.length
            : Array.isArray((data as any)?.data?.events)
              ? (data as any).data.events.length
              : undefined,
    })
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("[v0] /api/user/get-event proxy error:", error)
    if (error?.name === "AbortError") {
      return NextResponse.json(
        { error: "API_TIMEOUT", message: "Request timeout - API server may be unavailable", fallback: true },
        { status: 408 },
      )
    }
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Internal server error occurred", fallback: true },
      { status: 500 },
    )
  }
}
