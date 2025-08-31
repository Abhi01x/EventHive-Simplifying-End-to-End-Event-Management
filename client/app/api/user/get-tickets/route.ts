import { API_BASE } from "../_utils"
import { buildUpstreamHeaders, dynamic } from "../_utils"

export { dynamic }

export async function POST(req: Request) {
  const { headers, hasAuth } = buildUpstreamHeaders(req)

  let raw: any = {}
  try {
    raw = await req.json()
  } catch {
    raw = {}
  }

  const normalizedEventId = String(raw?.event_id ?? raw?.eventId ?? raw?.event ?? raw?.id ?? "").trim()

  // Forward a body that includes multiple aliases just in case the upstream is strict
  const forwardBody = normalizedEventId
    ? {
        event_id: normalizedEventId,
        event: normalizedEventId,
        id: normalizedEventId,
        eventId: normalizedEventId,
      }
    : raw

  const upstreamUrl = `${API_BASE}/user/get-tickets`
  console.log(
    "[SERVER][v0] Proxy(get-tickets) -> POST",
    upstreamUrl,
    "hasAuth",
    hasAuth,
    "normalizedEventId",
    normalizedEventId || "(none)",
    "forwardBodyKeys",
    Object.keys(forwardBody || {}),
  )

  // First try POST as specified
  const res = await fetch(upstreamUrl, {
    method: "POST",
    headers: { ...headers, accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(forwardBody || {}),
  })

  const ct = res.headers.get("content-type") || ""
  const text = await res.text()
  console.log(
    "[SERVER][v0] /user/get-tickets upstream status:",
    res.status,
    "content-type:",
    ct,
    "len:",
    text?.length ?? 0,
  )

  // If upstream rejects (404/400/405), try a GET fallback with event_id as a query param
  if ((res.status === 404 || res.status === 400 || res.status === 405) && normalizedEventId) {
    const fallbackUrl = `${API_BASE}/user/get-tickets?event_id=${encodeURIComponent(normalizedEventId)}`
    console.log("[SERVER][v0] /user/get-tickets retry(GET) ->", fallbackUrl)
    const res2 = await fetch(fallbackUrl, {
      method: "GET",
      headers: { ...headers, accept: "application/json" },
    })
    const ct2 = res2.headers.get("content-type") || ""
    const text2 = await res2.text()
    console.log(
      "[SERVER][v0] /user/get-tickets GET fallback status:",
      res2.status,
      "content-type:",
      ct2,
      "len:",
      text2?.length ?? 0,
    )
    return new Response(text2, {
      status: res2.status,
      headers: { "content-type": ct2 || "application/json" },
    })
  }

  // Return original POST response
  return new Response(text, {
    status: res.status,
    headers: { "content-type": ct || "application/json" },
  })
}

// Optional: expose GET handler for debugging or if upstream expects GET
export async function GET(req: Request) {
  const { headers, hasAuth } = buildUpstreamHeaders(req)
  const url = new URL(req.url)
  const event_id = (url.searchParams.get("event_id") ||
    url.searchParams.get("event") ||
    url.searchParams.get("id") ||
    url.searchParams.get("eventId") ||
    "") as string

  const upstreamUrl = event_id
    ? `${API_BASE}/user/get-tickets?event_id=${encodeURIComponent(event_id)}`
    : `${API_BASE}/user/get-tickets`

  console.log(
    "[SERVER][v0] Proxy(get-tickets) -> GET",
    upstreamUrl,
    "hasAuth",
    hasAuth,
    "event_id",
    event_id || "(none)",
  )

  const res = await fetch(upstreamUrl, { headers: { ...headers, accept: "application/json" } })
  const ct = res.headers.get("content-type") || ""
  const text = await res.text()
  console.log(
    "[SERVER][v0] /user/get-tickets GET upstream status:",
    res.status,
    "content-type:",
    ct,
    "len:",
    text?.length ?? 0,
  )
  return new Response(text, {
    status: res.status,
    headers: { "content-type": ct || "application/json" },
  })
}
