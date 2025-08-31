import { API_BASE } from "../_utils"
import { buildUpstreamHeaders, proxyJson, dynamic } from "../_utils"

export { dynamic }

export async function GET(req: Request) {
  const url = new URL(req.url)
  const queryString = url.search // already includes leading "?"
  const { headers, hasAuth } = buildUpstreamHeaders(req)
  const upstreamUrl = `${API_BASE}/user/get-event-bysearch${queryString}`
  console.log("[SERVER][v0] Proxy -> GET", upstreamUrl, "hasAuth", hasAuth)
  return proxyJson(upstreamUrl, { method: "GET", headers })
}
