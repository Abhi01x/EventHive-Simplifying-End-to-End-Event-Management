import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/api-config"

// Prefer env var if present, otherwise use API_CONFIG.BASE_URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || API_CONFIG.BASE_URL.replace(/\/+$/, "")

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization token provided" }, { status: 401 })
    }

    console.log("[v0] Making request to external API:", `${API_BASE_URL}/auth/me`)

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    console.log("[v0] External API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] External API error response:", errorText)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Unauthorized", message: errorData.message || "Authentication failed" },
          { status: 401 },
        )
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: "User is banned", message: errorData.message || "User is banned" },
          { status: 403 },
        )
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: "No user found", message: errorData.message || "No user found" },
          { status: 404 },
        )
      }

      return NextResponse.json(
        { error: "External API error", message: errorData.message || "API error" },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] External API success response:", data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] API proxy error:", error)

    if (error?.name === "AbortError") {
      return NextResponse.json(
        {
          error: "API_TIMEOUT",
          message: "Request timeout - API server may be unavailable",
          fallback: true,
        },
        { status: 408 },
      )
    }

    if (error?.code === "ECONNREFUSED" || (typeof error?.message === "string" && error.message.includes("fetch"))) {
      return NextResponse.json(
        {
          error: "API_UNAVAILABLE",
          message: "External API server is unavailable",
          fallback: true,
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Internal server error occurred",
        fallback: true,
      },
      { status: 500 },
    )
  }
}
