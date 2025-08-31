import { type NextRequest, NextResponse } from "next/server"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Authorization header missing" }, { status: 401 })
    }

    const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.OWNER.GET_COURTS)
    console.log("[v0] Fetching courts from:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.log("[v0] Courts API error:", response.status, response.statusText)
      return NextResponse.json({ success: false, error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Courts response:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Courts fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch courts" }, { status: 500 })
  }
}
