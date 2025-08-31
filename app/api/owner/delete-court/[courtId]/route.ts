import { type NextRequest, NextResponse } from "next/server"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

export async function DELETE(request: NextRequest, { params }: { params: { courtId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ success: false, error: "Authorization header missing" }, { status: 401 })
    }

    const { courtId } = params
    console.log("[v0] Deleting court:", courtId)

    const apiUrl = buildApiUrl(`${API_CONFIG.ENDPOINTS.OWNER.DELETE_COURT}/${courtId}`)

    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.log("[v0] Delete court API error:", response.status, response.statusText)
      return NextResponse.json({ success: false, error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Delete court response:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Delete court error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete court" }, { status: 500 })
  }
}
