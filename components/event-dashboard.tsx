"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EventCard } from "./event-card"
import { ChevronLeft, ChevronRight, ChevronDown, Search } from "lucide-react"
import Link from "next/link"
import { events as SHARED_EVENTS } from "@/data/mock-events"

type EventItem = {
  id: string
  title: string
  category: string
  type: "Free" | "Paid" | "Registration"
  date: string
  imageUrl: string
  description: string
  location: string
  status?: string
}

const ALL_EVENTS: EventItem[] = SHARED_EVENTS.map((e) => {
  const lowest = e.tickets?.length ? Math.min(...e.tickets.map((t) => t.price)) : 0
  const computedType = e.status === "registration_open" ? (lowest === 0 ? "Free" : "Paid") : "Registration"
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    type: computedType,
    date: e.dateLabel,
    imageUrl: e.image || "/community-event.png",
    description: e.shortDescription || e.subtitle || "",
    location: `${e.location.venue}, ${e.location.city}`,
    status: e.status === "not_open" ? "Registration not yet open" : undefined,
  }
})

const CATEGORIES = ["All", ...Array.from(new Set(ALL_EVENTS.map((e) => e.category)))] as const
const TYPES = ["All", "Free", "Paid", "Registration"] as const
const DATES = ["All", "This Week", "This Month"] as const

export function EventDashboard() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All")
  const [type, setType] = useState<(typeof TYPES)[number]>("All")
  const [datePreset, setDatePreset] = useState<(typeof DATES)[number]>("All")
  const [page, setPage] = useState(1)
  const pageSize = 9

  const filtered = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return ALL_EVENTS.filter((e) => {
      const matchesCategory = category === "All" || e.category === category
      const matchesType = type === "All" || e.type === type
      const text = `${e.title} ${e.description} ${e.location}`.toLowerCase()
      const matchesQuery = query.trim() === "" || text.includes(query.toLowerCase())

      // simple date preset simulation (since dates are labels)
      let matchesDate = true
      if (datePreset !== "All") {
        // naive parsing just to vary filtering by presets
        const simulatedDate = now // pretend all are in current month for demo
        if (datePreset === "This Week") {
          matchesDate = simulatedDate >= startOfWeek && simulatedDate <= endOfWeek
        } else if (datePreset === "This Month") {
          matchesDate = simulatedDate <= endOfMonth
        }
      }
      return matchesCategory && matchesType && matchesQuery && matchesDate
    })
  }, [category, type, query, datePreset])

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
    <section>
      {/* Filters + Search */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1 bg-transparent">
                Category <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {CATEGORIES.map((c) => (
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
              {DATES.map((d) => (
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

        <div className="relative w-full md:w-80">
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

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((e) => (
          <div key={e.id} className="flex flex-col">
            <EventCard event={e} />
            <div className="mt-3 flex justify-end">
              <Button asChild size="sm" aria-label={`Register for ${e.title}`}>
                <Link href={`/events/${e.id}`}>Register now</Link>
              </Button>
            </div>
          </div>
        ))}
        {pageItems.length === 0 && (
          <div className="col-span-full rounded-md border p-6 text-center text-sm text-muted-foreground">
            No events match your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
        <Button variant="outline" size="icon" onClick={() => changePage(currentPage - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Leading ellipsis */}
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

        {/* Trailing ellipsis */}
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
    </section>
  )
}
