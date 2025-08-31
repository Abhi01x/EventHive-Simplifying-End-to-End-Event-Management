"use client"

import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWR from "swr"

type TicketTier = {
  id: string
  tier?: string
  name?: string
  title?: string
  price?: number
  amount?: number
  currency?: string
  saleEnd?: string
  maxPerUser?: number
  max_per_user?: number
  max?: number
}
type EventLite = {
  id: string
  title: string
  tickets: TicketTier[]
}

type Attendee = { name: string; phone: string; email: string; gender: string }

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
  }
}

export function RegisterDialog({ event, className }: { event: EventLite; className?: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"tickets" | "attendees">("tickets")
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const { toast } = useToast()

  const [selectedTierId, setSelectedTierId] = useState(
    () => (Array.isArray(event?.tickets) && event.tickets[0]?.id) || "",
  )

  const {
    data: ticketsApi,
    error: ticketsApiError,
    isLoading: ticketsApiLoading,
  } = useSWR(
    open && event?.id ? ["get-tickets", event.id] : null,
    async () => {
      const body = { event_id: event.id } // keep it strict; most backends expect event_id
      const auth = getAuthHeader()
      console.log("[v0] get-tickets fetch -> /api/user/get-tickets", body, {
        hasAuth: Boolean(auth.Authorization || (auth as any)["x-access-token"]),
        eventId: event.id,
      })
      const res = await fetch("/api/user/get-tickets", {
        method: "POST",
        headers: { ...auth, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
      })
      console.log("[v0] get-tickets status:", res.status, "content-type:", res.headers.get("content-type"))
      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json")) {
        const text = await res.text()
        console.warn("[v0] get-tickets non-JSON:", text.slice(0, 200))
        throw new Error("Non-JSON response from get-tickets")
      }
      const json = await res.json()
      try {
        console.log(
          "[v0] get-tickets json keys:",
          json && typeof json === "object" ? Object.keys(json) : ["<non-object>"],
        )
      } catch {}
      return json
    },
    { revalidateOnFocus: false },
  )

  const ticketsFromApi = useMemo(() => {
    const src = ticketsApi as any
    if (!src) return []
    const candidate = Array.isArray(src)
      ? src
      : (src.data ?? src.tickets ?? src.result ?? src.items ?? src.payload ?? null)
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === "object") {
      const values = Object.values(candidate)
      return Array.isArray(values) ? values : []
    }
    return []
  }, [ticketsApi])

  const sourceTickets = useMemo(
    () => (ticketsFromApi.length ? ticketsFromApi : Array.isArray(event?.tickets) ? event.tickets : []),
    [ticketsFromApi, event?.tickets],
  )

  const normalizedTickets = useMemo(() => {
    const list = Array.isArray(sourceTickets) ? sourceTickets : []
    const norm = list.map((t: TicketTier | any, idx: number) => {
      const id = String(t?.id ?? t?.ticket_id ?? t?._id ?? idx)
      const label = t?.tier || t?.name || t?.title || t?.ticket_type || t?.type || "Standard"
      const rawPrice = t?.price ?? t?.amount ?? t?.rate ?? 0
      const price = Number(typeof rawPrice === "string" ? rawPrice.replace(/[^\d.]/g, "") : rawPrice) || 0
      const currency = t?.currency || "₹"
      const max =
        (typeof t?.maxPerUser === "number" && t?.maxPerUser) ??
        (typeof t?.max_per_user === "number" && t?.max_per_user) ??
        (typeof t?.max_ticket_per_user === "number" && t?.max_ticket_per_user) ??
        (typeof t?.maxTickets === "number" && t?.maxTickets) ??
        (typeof t?.limit === "number" && t?.limit) ??
        (typeof t?.max === "number" && t?.max) ??
        5
      const saleEnd = t?.saleEnd || t?.sales_end || t?.sale_ends_on
      return { id, label, price, currency, saleEnd, max }
    })

    // Fallback if API returns nothing
    if (!norm.length) {
      const fallback = [{ id: "std", label: "Standard", price: 0, currency: "₹", saleEnd: undefined, max: 5 }]
      console.log("[v0] get-tickets fallback used:", fallback)
      return fallback
    }

    console.log("[v0] get-tickets normalized:", norm)
    return norm
  }, [sourceTickets])

  const currentTier = useMemo(
    () => normalizedTickets.find((t) => t.id === selectedTierId) ?? normalizedTickets[0],
    [normalizedTickets, selectedTierId],
  )
  const maxQty = Math.min(5, currentTier?.max ?? 5)
  const [qtySingle, setQtySingle] = useState(1)

  const total = useMemo(
    () => normalizedTickets.reduce((sum, t) => sum + (quantities[t.id] || 0) * (t.price || 0), 0),
    [normalizedTickets, quantities],
  )

  const totalCount = useMemo(
    () => normalizedTickets.reduce((sum, t) => sum + (quantities[t.id] || 0), 0),
    [normalizedTickets, quantities],
  )

  useEffect(() => {
    // Sync dropdown quantity with totals
    const newQuantities = normalizedTickets.reduce(
      (acc, ticket) => {
        acc[ticket.id] = quantities[ticket.id] || 0
        return acc
      },
      {} as Record<string, number>,
    )
    setQuantities(newQuantities)
  }, [normalizedTickets])

  useEffect(() => {
    if (!currentTier) return
    setQtySingle((prev) => Math.min(prev || 1, maxQty))
    setQuantities({ [currentTier.id]: Math.min(qtySingle, maxQty) })
  }, [currentTier, qtySingle, maxQty])

  useEffect(() => {
    if (!normalizedTickets.length) return
    setSelectedTierId((prev) => (prev && normalizedTickets.some((t) => t.id === prev) ? prev : normalizedTickets[0].id))
  }, [normalizedTickets])

  function inc(id: string) {
    setQuantities((q) => {
      const ticket = normalizedTickets.find((t) => t.id === id)
      const max = ticket?.max ?? 5
      const next = Math.min(max, (q[id] || 0) + 1)
      return { ...q, [id]: next }
    })
  }
  function dec(id: string) {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }))
  }

  function closeDialog() {
    // reset on close
    setStep("tickets")
    setQuantities({})
    setAttendees([])
    setOpen(false)
  }

  function toAttendees() {
    const count = qtySingle
    console.log("[v0] register -> toAttendees count:", count)
    if (count <= 0) return
    const arr: Attendee[] = Array.from({ length: count }).map(() => ({
      name: "",
      phone: "",
      email: "",
      gender: "",
    }))
    setAttendees(arr)
    setStep("attendees")
  }

  function updateAttendee(i: number, field: keyof Attendee, value: string) {
    setAttendees((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  function handleMakePayment() {
    // Mock submit – replace with API call if backend is ready
    console.log("[v0] Make Payment payload:", {
      eventId: event.id,
      title: event.title,
      tickets: normalizedTickets.map((t) => ({ id: t.id, label: t.label, qty: quantities[t.id] || 0, price: t.price })),
      attendees,
      total,
    })
    toast({
      title: "Proceeding to payment",
      description: `Tickets: ${totalCount} • Total: ₹${total.toFixed(2)}`,
    })
    closeDialog()
  }

  return (
    <>
      <Button className={cn(className)} onClick={() => setOpen(true)} aria-haspopup="dialog">
        Register
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tickets-title">
          <div className="absolute inset-0 bg-black/40" onClick={closeDialog} />
          <div className="absolute inset-x-4 md:right-6 top-20 md:top-24 md:w-[720px] rounded-lg bg-background border shadow-lg mx-auto md:mx-0">
            {/* Tickets step */}
            {step === "tickets" && (
              <>
                <div className="p-4 border-b">
                  <h2 id="tickets-title" className="text-lg font-semibold">
                    Tickets
                  </h2>
                  <p className="text-sm text-muted-foreground">{event.title}</p>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ticketsApiLoading ? (
                    <div className="col-span-full text-sm text-muted-foreground">Loading tickets…</div>
                  ) : ticketsApiError ? (
                    <div className="col-span-full text-sm text-destructive">
                      Failed to load tickets. Using defaults if available.
                    </div>
                  ) : null}
                  {/* Dev-only hint */}
                  <div className="col-span-full text-xs text-muted-foreground">
                    {normalizedTickets.length ? (
                      <span>
                        Loaded {normalizedTickets.length} ticket type(s). First: {normalizedTickets[0]?.label} —{" "}
                        {normalizedTickets[0]?.price ? `₹${normalizedTickets[0]?.price}` : "Free"}
                      </span>
                    ) : (
                      <span>No ticket types returned; using fallback.</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={selectedTierId}
                      onValueChange={(v) => {
                        setSelectedTierId(v)
                        // reset qty to 1 when type changes
                        setQtySingle(1)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        {normalizedTickets.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label} {t.price ? `— ₹${Number(t.price).toFixed(2)}` : "— Free"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentTier?.saleEnd ? (
                      <p className="text-xs text-muted-foreground">Sales ends on {currentTier.saleEnd}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Select
                      value={String(qtySingle)}
                      onValueChange={(v) => setQtySingle(Math.min(Number(v) || 1, maxQty))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Qty" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Max {maxQty} per user</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="h-10 flex items-center rounded border px-3">
                      <span className="font-medium">
                        {currentTier?.price ? `₹ ${(currentTier.price * qtySingle).toFixed(2)}` : "Free"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 flex items-center justify-between">
                  <div className="text-sm">
                    Selected: <span className="font-medium">{qtySingle}</span> • Total:{" "}
                    <span className="font-semibold">
                      {currentTier?.price ? `₹ ${(currentTier.price * qtySingle).toFixed(2)}` : "Free"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={closeDialog}>
                      Close
                    </Button>
                    <Button onClick={toAttendees} disabled={qtySingle <= 0}>
                      Book Now
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Attendees step */}
            {step === "attendees" && (
              <>
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Attendees</h2>
                  <p className="text-sm text-muted-foreground">{event.title}</p>
                </div>

                <div className="p-4 max-h-[60vh] overflow-auto space-y-4">
                  {attendees.map((a, idx) => (
                    <div key={idx} className="rounded-md border p-3">
                      <div className="mb-2 text-sm font-medium">Ticket #{idx + 1}</div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor={`name-${idx}`}>Name</Label>
                          <Input
                            id={`name-${idx}`}
                            value={a.name}
                            onChange={(e) => updateAttendee(idx, "name", e.target.value)}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`email-${idx}`}>Email</Label>
                          <Input
                            id={`email-${idx}`}
                            type="email"
                            value={a.email}
                            onChange={(e) => updateAttendee(idx, "email", e.target.value)}
                            placeholder="name@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`phone-${idx}`}>Phone</Label>
                          <Input
                            id={`phone-${idx}`}
                            value={a.phone}
                            onChange={(e) => updateAttendee(idx, "phone", e.target.value)}
                            placeholder="+91 99999 99999"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`gender-${idx}`}>Gender</Label>
                          <Select value={a.gender} onValueChange={(val) => updateAttendee(idx, "gender", val)}>
                            <SelectTrigger id={`gender-${idx}`}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4 flex items-center justify-between">
                  <div className="text-sm">
                    Tickets: <span className="font-medium">{totalCount}</span> • Total:{" "}
                    <span className="font-semibold">
                      {currentTier?.price ? `₹ ${(currentTier.price * totalCount).toFixed(2)}` : "Free"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setStep("tickets")}>
                      Cancel
                    </Button>
                    <Button onClick={handleMakePayment}>Make Payment</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
