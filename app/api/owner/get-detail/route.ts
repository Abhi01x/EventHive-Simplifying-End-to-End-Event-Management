import { type NextRequest, NextResponse } from "next/server"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Authorization header missing" }, { status: 401 })
    }

    const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.OWNER.GET_DETAIL)
    console.log("[v0] Fetching owner stats from:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.log("[v0] Owner stats API error:", response.status, response.statusText)
      return NextResponse.json({ success: false, error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Owner stats response:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Owner stats fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch owner stats" }, { status: 500 })
  }
}
