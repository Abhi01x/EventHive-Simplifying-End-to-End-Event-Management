"use client"

import { useEffect, useMemo } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Share2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type EventLike = {
  id: string
  title: string
  subtitle?: string
  category?: string
  tags?: string[]
  image?: string
  image_url?: string
  banner?: string
  description?: string
  shortDescription?: string
  location?: { venue?: string; city?: string; region?: string; address?: string; name?: string } | string
  venue?: string
  city?: string
  region?: string
  event_date?: string | number
  date?: string | number
  date_label?: string
  dateLabel?: string
  start_date?: string | number
  tickets?: { id?: string; name?: string; title?: string; price?: number; amount?: number; max_per_user?: number }[]
  organizer?: { name?: string; email?: string; phone?: string }
}

function getAuthHeader() {
  const tokenRaw =
    typeof window !== "undefined"
      ? localStorage.getItem("authToken") || localStorage.getItem("token") || localStorage.getItem("access_token") || ""
      : ""
  const hasBearer = /^bearer\s+/i.test(tokenRaw)
  const authValue = tokenRaw ? (hasBearer ? tokenRaw : `Bearer ${tokenRaw}`) : ""
  const xToken = tokenRaw ? tokenRaw.replace(/^bearer\s+/i, "") : ""
  return {
    ...(authValue ? { Authorization: authValue } : {}),
    ...(xToken ? { "x-access-token": xToken } : {}),
    Accept: "application/json",
  }
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventId = params?.id

  useEffect(() => {
    const tok = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!tok) router.push("/auth/login")
  }, [router])

  const { data, error, isLoading } = useSWR(
    eventId ? `/api/user/get-event/${encodeURIComponent(String(eventId))}` : null,
    async (url: string) => {
      console.log("[v0] EventDetails fetch ->", url, { eventId })
      const res = await fetch(url, { headers: getAuthHeader() })
      console.log("[v0] EventDetails status:", res.status)
      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json")) {
        const text = await res.text()
        console.warn("[v0] EventDetails non-JSON:", text.slice(0, 200))
        throw new Error("Non-JSON response")
      }
      const json = await res.json()
      try {
        const keys = json && typeof json === "object" ? Object.keys(json) : []
        console.log("[v0] EventDetails json keys:", keys)
      } catch {}
      return json
    },
    { revalidateOnFocus: false },
  )

  const selected = useMemo(() => {
    if (!data) return null

    // common shapes: {data: {...}}, {event: {...}}, direct object, or arrays (fallback)
    let ev: any = null

    if (Array.isArray(data)) {
      ev = data.find((e: any) => String(e?.id ?? e?.event_id ?? e?.slug) === String(eventId)) ?? null
    } else if (data && typeof data === "object") {
      const candidate =
        // typical containers
        (data as any).data ??
        (data as any).event ??
        (data as any).result ??
        (data as any).item ??
        (data as any).payload ??
        data

      if (Array.isArray(candidate)) {
        ev = candidate.find((e: any) => String(e?.id ?? e?.event_id ?? e?.slug) === String(eventId)) ?? null
      } else if (candidate && typeof candidate === "object") {
        // if it already looks like the event, prefer it
        const cid = String((candidate as any)?.id ?? (candidate as any)?.event_id ?? (candidate as any)?.slug ?? "")
        ev = cid && cid === String(eventId) ? candidate : candidate
      }
    }

    console.log("[v0] EventDetails selected exists?", !!ev)
    return ev
  }, [data, eventId])

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-destructive">Failed to load event: {error.message}</p>
      </main>
    )
  }
  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p>Loading event…</p>
      </main>
    )
  }
  if (!selected) return notFound()

  const normalizedId = String((selected as any).id ?? (selected as any).event_id ?? eventId ?? "")
  const category = (selected as any).category ?? (selected as any).category_name ?? "General"
  const organizer = (selected as any).organizer ?? {
    name: (selected as any).organizer_name,
    email: (selected as any).organizer_email,
    phone: (selected as any).organizer_phone,
  }
  const address: string | undefined =
    (selected as any).address ??
    (typeof (selected as any).location === "object" ? (selected as any).location?.address : undefined)
  const startTime: string | undefined = (selected as any).start_time ?? (selected as any).startTime
  const endTime: string | undefined = (selected as any).end_time ?? (selected as any).endTime

  console.log("[v0] EventDetails normalized", { normalizedId, category, address, startTime, endTime })

  const image =
    selected.image ||
    selected.banner ||
    selected.image_url ||
    `/placeholder.svg?height=320&width=1200&query=${encodeURIComponent(String(selected.title || "Event"))}`
  const tags = Array.isArray(selected.tags) ? selected.tags : []
  const title = String(selected.title || "Untitled Event")
  const subtitle = selected.subtitle

  const rawDate =
    selected.dateLabel || selected.date_label || selected.event_date || selected.date || selected.start_date

  let dateLong = "TBA"
  if (rawDate) {
    let d: Date | null = null
    if (typeof rawDate === "number") d = new Date(rawDate)
    else if (typeof rawDate === "string") {
      const ts = Number(rawDate)
      if (!Number.isNaN(ts) && /^\d+$/.test(rawDate.trim())) d = new Date(ts)
      else {
        const parsed = new Date(rawDate)
        d = isNaN(parsed.getTime()) ? null : parsed
      }
    }
    dateLong = d ? d.toLocaleString() : String(rawDate)
  }

  const loc = selected.location
  const venue =
    (typeof loc === "object" && (loc?.venue || loc?.name || loc?.address)) ||
    (typeof loc === "string" ? loc : selected.venue) ||
    "—"
  const city = (typeof loc === "object" && loc?.city) || selected.city || ""
  const region = (typeof loc === "object" && loc?.region) || selected.region || ""

  const tickets = (Array.isArray(selected.tickets) ? selected.tickets : []).map((t, idx) => ({
    id: String(t.id ?? idx),
    name: String(t.name ?? t.title ?? "Standard"),
    price: Number(t.price ?? t.amount ?? 0),
    maxPerUser: Number(t.max_per_user ?? 5),
  }))

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <nav className="text-sm text-muted-foreground mb-3" aria-label="Breadcrumb">
        <span>All Events</span> <span aria-hidden> / </span> <span className="text-foreground">{title}</span>
      </nav>

      <div className="relative rounded-lg overflow-hidden">
        <img src={image || "/placeholder.svg"} alt={`${title} hero`} className="w-full h-64 md:h-80 object-cover" />
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-black/60 text-white">
              {category}
            </Badge>
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="bg-black/60 text-white">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-white/90">{subtitle}</p> : null}
        </div>
      </div>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2">
          <p className="leading-relaxed text-pretty">{selected.description || selected.shortDescription || ""}</p>
          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            {/* placeholder actions */}
            <button type="button" className="underline">
              Report Spam
            </button>
            <span className="flex items-center gap-2">
              <Share2 className="w-4 h-4" aria-hidden />
              Share
            </span>
          </div>
        </article>

        <aside className="lg:col-span-1">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" aria-hidden />
              <span>{dateLong}</span>
            </div>

            {startTime || endTime ? (
              <div className="mt-2 text-sm text-muted-foreground">
                Time: {startTime || "—"}
                {endTime ? ` - ${endTime}` : ""}
              </div>
            ) : null}

            <div className="mt-4 flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5" aria-hidden />
              <div>
                <div className="font-medium">{venue}</div>
                <div className="text-muted-foreground">{[city, region].filter(Boolean).join(", ")}</div>
                {address ? <div className="text-muted-foreground">{address}</div> : null}
              </div>
            </div>

            <Link href={`/events/${normalizedId}/register`} className="block mt-5">
              <Button className="w-full">Register</Button>
            </Link>
          </div>

          <div className="mt-4 rounded-lg border p-4 text-sm">
            <div className="font-medium">Organizer</div>
            <div className="mt-1">{organizer?.name || "—"}</div>
            {organizer?.email ? <div className="text-muted-foreground">{organizer.email}</div> : null}
            {organizer?.phone ? <div className="text-muted-foreground">{organizer.phone}</div> : null}
          </div>
        </aside>
      </section>
    </main>
  )
}
