import { API_BASE } from "../../_utils"
import { buildUpstreamHeaders, proxyJson, dynamic } from "../../_utils"

export { dynamic }

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params
  const { headers, hasAuth } = buildUpstreamHeaders(req)
  const upstreamUrl = `${API_BASE}/user/get-event/${encodeURIComponent(id)}`
  console.log("[SERVER][v0] Proxy -> GET", upstreamUrl, "hasAuth", hasAuth)
  return proxyJson(upstreamUrl, { method: "GET", headers })
}
