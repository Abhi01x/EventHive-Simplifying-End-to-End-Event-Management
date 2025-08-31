"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, ChevronDown, ChevronLeft, ChevronRight, MapPin, Search, LogOut, Mail } from "lucide-react"
import { events as MOCK_EVENTS } from "@/data/mock-events"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"
import { Alert, AlertDescription } from "@/components/ui/alert"

type EventItem = {
  id: string
  title: string
  category: string
  type: string
  dateLabel: string
  imageUrl: string
  description: string
  location: string
  status?: string
}

const TYPES = ["All", "Free", "Paid", "Registration"] as const
const DATE_PRESETS = ["All", "This Week", "This Month"] as const

const ALL_EVENTS: EventItem[] = MOCK_EVENTS.map((e) => {
  const lowest = e.tickets?.length ? Math.min(...e.tickets.map((t) => t.price)) : 0
  const computedType = lowest === 0 ? "Free" : "Paid"
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    type: e.status === "registration_open" ? (computedType as string) : "Registration",
    dateLabel: e.dateLabel,
    imageUrl: e.image || "/community-event.png",
    description: e.shortDescription || e.subtitle || "",
    location: `${e.location.venue}, ${e.location.city}`,
    status: e.status === "not_open" ? "Registration not yet open" : undefined,
  }
})

function EventCard({ e }: { e: EventItem }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.imageUrl || "/placeholder.svg"} alt={`${e.title} banner`} className="h-40 w-full object-cover" />
          <Badge className="absolute left-3 top-3 bg-white text-foreground shadow"> {e.category} </Badge>
          <span className="absolute right-3 top-3 rounded-md bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
            {e.dateLabel}
          </span>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-lg font-semibold leading-tight line-clamp-1">{e.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden />
              <span className="line-clamp-1">{e.location}</span>
            </div>
            {e.status && (
              <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">{e.status}</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{e.dateLabel}</span>
            <Button asChild size="sm" aria-label={`Register for ${e.title}`}>
              <Link href={`/events/${e.id}`}>Register now</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [type, setType] = useState<string>("All")
  const [datePreset, setDatePreset] = useState<string>("All")
  const [page, setPage] = useState(1)
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [avatarSeed, setAvatarSeed] = useState<string>("user")

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!token) {
      router.push("/auth/login")
      return
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem("userData") : null
    if (stored) {
      try {
        const u = JSON.parse(stored) || {}
        setUserName(u.name || u.username || "User")
        setUserEmail(u.email || "")
        setAvatarSeed(u.email || u.name || "user")
      } catch {
        setUserName("User")
        setUserEmail("")
        setAvatarSeed("user")
      }
    } else {
      setUserName("User")
      setUserEmail("")
      setAvatarSeed("user")
    }
  }, [router])

  const { data: me } = useSWR(
    typeof window !== "undefined" && localStorage.getItem("authToken") ? "/api/auth/me" : null,
    async (url: string) => {
      const token = localStorage.getItem("authToken")
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch user")
      return res.json()
    },
    { revalidateOnFocus: false },
  )

  useEffect(() => {
    if (!me) return
    // Normalize various shapes from external API
    const user = me?.data || me?.user || me?.profile || me // try common keys
    const name =
      user?.name || user?.fullName || user?.username || user?.first_name
        ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
        : undefined
    const email = user?.email || user?.mail || ""
    if (name) setUserName(name)
    if (email) {
      setUserEmail(email)
      setAvatarSeed(email)
    }
  }, [me])

  async function handleLogout() {
    try {
      const token = localStorage.getItem("authToken")
      if (token) {
        const url = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT)
        // best-effort; ignore failures
        await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }).catch(() => {})
      }
    } finally {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userData")
      localStorage.removeItem("pendingUserData")
      localStorage.removeItem("pendingUserId")
      localStorage.removeItem("userEmail")
      router.push("/auth/login")
    }
  }

  const {
    data: eventsResponse,
    error: eventsError,
    isLoading: eventsLoading,
  } = useSWR(
    typeof window !== "undefined" && localStorage.getItem("authToken") ? "/api/user/get-event" : null,
    async (url: string) => {
      const tokenRaw =
        localStorage.getItem("authToken") || localStorage.getItem("token") || localStorage.getItem("access_token") || ""
      const hasBearer = /^bearer\s+/i.test(tokenRaw)
      const authValue = tokenRaw ? (hasBearer ? tokenRaw : `Bearer ${tokenRaw}`) : ""
      const xToken = tokenRaw ? tokenRaw.replace(/^bearer\s+/i, "") : ""

      console.log("[v0] SWR fetch ->", url, { hasToken: !!tokenRaw, hasBearer })
      const res = await fetch(url, {
        headers: {
          ...(authValue ? { Authorization: authValue } : {}),
          ...(xToken ? { "x-access-token": xToken } : {}),
          Accept: "application/json",
        },
      })
      console.log("[v0] SWR response status:", res.status)

      const ct = res.headers.get("content-type") || ""
      console.log("[v0] SWR content-type:", ct)

      if (!ct.includes("application/json")) {
        const text = await res.text()
        console.warn("[v0] SWR non-JSON body (first 200):", text.slice(0, 200))
        const hint = text.includes("Cannot GET /api/user/get-event")
          ? "Route not available: /api/user/get-event"
          : "Non-JSON response from /api/user/get-event"
        throw new Error(hint)
      }

      const json: any = await res.json()
      console.log("[v0] SWR json keys:", json && typeof json === "object" ? Object.keys(json) : null)

      if (!res.ok) {
        throw new Error(json?.message || json?.msg || json?.error || `Failed to fetch events (status ${res.status})`)
      }
      return json
    },
    { revalidateOnFocus: false },
  )

  const allEvents: EventItem[] = useMemo(() => {
    const normalize = (e: any, idx: number): EventItem => {
      const id = String(e?.id ?? e?.event_id ?? e?._id ?? e?.slug ?? `event-${idx}`)
      const title = e?.title ?? e?.name ?? "Untitled Event"
      const category = e?.category ?? e?.sport ?? e?.type ?? "General"
      const isFree =
        e?.is_free === true ||
        e?.price === 0 ||
        e?.lowest_price === 0 ||
        (Array.isArray(e?.tickets) && e.tickets.some((t: any) => Number(t?.price) === 0))
      const computedType = e?.status === "registration_open" ? (isFree ? "Free" : "Paid") : "Registration"
      const rawDate =
        e?.dateLabel ??
        e?.date_label ??
        e?.event_date ??
        e?.date ??
        e?.start_date ??
        e?.startDate ??
        e?.dateTime ??
        e?.datetime ??
        e?.eventDate

      let dateLabel: string
      if (rawDate) {
        let d: Date | null = null
        if (typeof rawDate === "number") {
          d = new Date(rawDate)
        } else if (typeof rawDate === "string") {
          // handle numeric timestamp strings and ISO/date strings
          const ts = Number(rawDate)
          if (!Number.isNaN(ts) && /^\d+$/.test(rawDate.trim())) {
            d = new Date(ts)
          } else {
            const parsed = new Date(rawDate)
            d = isNaN(parsed.getTime()) ? null : parsed
          }
        } else if (rawDate instanceof Date) {
          d = rawDate
        }
        dateLabel = d ? d.toLocaleDateString() : String(rawDate)
      } else {
        dateLabel = "TBA"
      }
      console.log("[v0] normalized date", { id, event_date: e?.event_date, dateLabel })

      const imageUrl = e?.image ?? e?.banner ?? e?.image_url ?? "/community-event.png"
      const description = e?.shortDescription ?? e?.subtitle ?? e?.description ?? ""
      const locationStr =
        e?.location?.address ??
        e?.location?.name ??
        (e?.location && typeof e?.location === "string" ? e.location : null) ??
        ([e?.venue, e?.city].filter(Boolean).join(", ") || "—")
      const status =
        e?.status === "not_open" || e?.registration_open === false ? "Registration not yet open" : undefined

      return {
        id,
        title,
        category,
        type: computedType as string,
        dateLabel,
        imageUrl,
        description,
        location: locationStr,
        status,
      }
    }

    const raw = eventsResponse
    // Try a wide set of common shapes
    const candidates: any[] =
      (Array.isArray(raw) && raw) ||
      (Array.isArray(raw?.data) && raw?.data) ||
      (Array.isArray(raw?.events) && raw?.events) ||
      (Array.isArray(raw?.data?.events) && raw?.data?.events) ||
      (Array.isArray(raw?.result) && raw?.result) ||
      (Array.isArray(raw?.items) && raw?.items) ||
      (Array.isArray(raw?.data?.data) && raw?.data?.data) ||
      (Array.isArray(raw?.payload) && raw?.payload) ||
      (Array.isArray(raw?.list) && raw?.list) ||
      []

    if (candidates.length > 0) {
      console.log("[v0] normalized events count:", candidates.length)
      return candidates.map(normalize)
    }

    if (eventsError) {
      console.warn("[v0] events error:", eventsError?.message)
    } else {
      console.log("[v0] events empty response shape:", raw)
    }

    // Do not silently fallback to mocks; show empty state instead
    return []
  }, [eventsResponse, eventsError])

  const categories = useMemo(() => {
    const set = new Set<string>(["All"])
    for (const e of allEvents) set.add(e.category || "General")
    return Array.from(set)
  }, [allEvents])

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      const matchesCategory = category === "All" || e.category === category
      const matchesType = type === "All" || e.type === type
      const text = `${e.title} ${e.description} ${e.location}`.toLowerCase()
      const matchesQuery = query.trim() === "" || text.includes(query.toLowerCase())
      const matchesDate = datePreset === "All" ? true : true
      return matchesCategory && matchesType && matchesQuery && matchesDate
    })
  }, [allEvents, category, type, query, datePreset])

  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  function changePage(next: number) {
    setPage(Math.max(1, Math.min(totalPages, next)))
  }

  const visibleNumbers = useMemo(() => {
    const nums: number[] = []
    const span = 3
    const from = Math.max(1, currentPage - span)
    const to = Math.min(totalPages, currentPage + span)
    for (let n = from; n <= to; n++) nums.push(n)
    return nums
  }, [currentPage, totalPages])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">EH</div>
            <span className="text-xl font-bold">EventHive</span>
          </div>

          <div className="hidden md:block text-sm font-medium text-muted-foreground">My bookings</div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>

            {userEmail && <span className="hidden md:block text-sm text-muted-foreground">{userEmail}</span>}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`}
                  alt={`${userName || "User"} avatar`}
                  className="h-9 w-9 rounded-full border cursor-pointer"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-64">
                <div className="px-2 py-2 text-sm">
                  <div className="font-medium">{userName || "User"}</div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{userEmail || "—"}</span>
                  </div>
                </div>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 bg-transparent">
                  Category <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {categories.map((c) => (
                  <DropdownMenuItem
                    key={c}
                    onClick={() => {
                      setCategory(c)
                      setPage(1)
                    }}
                  >
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 bg-transparent">
                  Date <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {DATE_PRESETS.map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() => {
                      setDatePreset(d)
                      setPage(1)
                    }}
                  >
                    {d}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 bg-transparent">
                  Event Type <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {TYPES.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => {
                      setType(t)
                      setPage(1)
                    }}
                  >
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="search events"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              className="pl-8"
              aria-label="Search events"
            />
          </div>
        </div>

        {eventsLoading && (
          <Alert className="mb-4">
            <AlertDescription>Loading events…</AlertDescription>
          </Alert>
        )}
        {eventsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Failed to load events{eventsError?.message ? `: ${eventsError.message}` : ""}. Please try again or contact
              support.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
          {pageItems.length === 0 && (
            <div className="col-span-full rounded-md border p-6 text-center text-sm text-muted-foreground">
              No events match your filters.
            </div>
          )}
        </div>

        <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
          <Button variant="outline" size="icon" onClick={() => changePage(currentPage - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {visibleNumbers[0] > 1 && (
            <>
              <Button variant="ghost" onClick={() => changePage(1)}>
                1
              </Button>
              <span className="px-1 text-muted-foreground">…</span>
            </>
          )}

          {visibleNumbers.map((n) => (
            <Button
              key={n}
              variant={n === currentPage ? "default" : "ghost"}
              onClick={() => changePage(n)}
              aria-current={n === currentPage ? "page" : undefined}
            >
              {n}
            </Button>
          ))}

          {visibleNumbers[visibleNumbers.length - 1] < totalPages && (
            <>
              <span className="px-1 text-muted-foreground">…</span>
              <Button variant="ghost" onClick={() => changePage(totalPages)}>
                {totalPages}
              </Button>
            </>
          )}

          <Button variant="outline" size="icon" onClick={() => changePage(currentPage + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>

        <div className="mt-10 flex items-center justify-center">
          <Link
            href="#"
            aria-disabled
            className="text-sm text-muted-foreground hover:underline aria-disabled:cursor-not-allowed aria-disabled:opacity-70"
          >
            My bookings (coming soon)
          </Link>
        </div>
      </main>

      {/* Footer welcome line removed */}
    </div>
  )
}
