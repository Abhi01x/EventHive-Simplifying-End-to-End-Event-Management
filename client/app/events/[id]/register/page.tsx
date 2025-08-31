"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loadScript } from "@/lib/load-script"
import { buildApiUrl } from "@/lib/api-config"

type Ticket = {
  id: string
  label: string
  price: number
  maxPerUser?: number
  totalQty?: number
  salesStart?: string
  salesEnd?: string
}
type TicketsResponse = any

function authHeaders() {
  const tok =
    typeof window !== "undefined" ? localStorage.getItem("authToken") || localStorage.getItem("token") || "" : ""
  const hasBearer = /^bearer\s+/i.test(tok)
  return {
    ...(tok ? { Authorization: hasBearer ? tok : `Bearer ${tok}` } : {}),
    ...(tok ? { "x-access-token": tok.replace(/^bearer\s+/i, "") } : {}),
  }
}

async function fetchTickets(eventId: string) {
  console.log(
    "[v0] get-tickets fetch -> /api/user/get-tickets body:",
    { event_id: eventId },
    "hasToken:",
    !!authHeaders().Authorization,
  )
  const res = await fetch("/api/user/get-tickets", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ event_id: eventId }),
  })
  const ct = res.headers.get("content-type") || ""
  console.log("[v0] get-tickets status:", res.status, "content-type:", ct)
  let json: TicketsResponse | null = null
  try {
    json = await res.json()
  } catch {
    console.log("[v0] get-tickets no JSON body")
  }
  if (json) console.log("[v0] get-tickets json keys:", Object.keys(json))
  if (!res.ok) throw new Error((json as any)?.msg || (json as any)?.message || "Failed to fetch tickets")
  return json
}

function normalizeTickets(data: TicketsResponse): Ticket[] {
  let list: any = []
  if (Array.isArray(data)) list = data
  else if (Array.isArray((data as any)?.tickets)) list = (data as any).tickets
  else if (Array.isArray((data as any)?.data)) list = (data as any).data
  else if (data && typeof data === "object") list = Object.values(data as Record<string, any>)

  const mapped: Ticket[] = (list as any[]).map((t, i) => {
    const id = String(t.ticket_id ?? t.id ?? t._id ?? i)
    const label = String(t.ticket_type ?? t.type ?? t.name ?? t.title ?? `Ticket #${i + 1}`)
    const priceRaw = t.price ?? t.amount ?? t.ticket_price ?? 0
    const price = Number.isFinite(Number(priceRaw)) ? Number(priceRaw) : 0
    const maxPerUser =
      Number(
        t.quantityper_user ?? // API sample
          t.max_per_user ??
          t.maxPerUser ??
          t.max ??
          5,
      ) || 5
    const totalQty = Number(t.total_quantity ?? t.totalQty ?? t.remaining ?? undefined)
    const salesStart = t.sales_start ?? t.salesStart ?? undefined
    const salesEnd = t.sales_end ?? t.salesEnd ?? undefined
    return { id, label, price, maxPerUser, totalQty, salesStart, salesEnd }
  })

  if (!mapped.length) {
    console.log("[v0] get-tickets empty -> using mock tickets")
    return [
      { id: "standard", label: "Standard", price: 0, maxPerUser: 5 },
      { id: "vip", label: "VIP", price: 500, maxPerUser: 5 },
    ]
  }
  console.log("[v0] Loaded ticket types:", mapped.map((m) => `${m.label}(${m.price})`).join(", "))
  return mapped
}

export default function RegisterPage() {
  const params = useParams<{ id: string }>()
  const eventId = params?.id
  const router = useRouter()

  const { data, error, isLoading } = useSWR(eventId ? ["tickets", eventId] : null, () => fetchTickets(eventId!))
  const tickets = useMemo(() => (data ? normalizeTickets(data) : []), [data])

  // Selection
  const [ticketId, setTicketId] = useState<string | undefined>()
  const selected = tickets.find((t) => t.id === ticketId) || tickets[0]
  const [qty, setQty] = useState(1)
  const maxQty = Math.min(selected?.maxPerUser ?? 5, 5)
  const total = (selected?.price ?? 0) * (qty || 0)

  useEffect(() => {
    if (tickets.length && !ticketId) {
      setTicketId(tickets[0].id)
      setQty(1)
    }
  }, [tickets, ticketId])

  // Attendees
  const [step, setStep] = useState<"tickets" | "attendees" | "done">("tickets")
  const [attendees, setAttendees] = useState(
    Array.from({ length: qty }, () => ({ name: "", email: "", mobile: "", gender: "" })),
  )
  useEffect(() => {
    setAttendees((prev) => {
      const next = Array.from({ length: qty }, (_, i) => prev[i] || { name: "", email: "", mobile: "", gender: "" })
      return next
    })
  }, [qty])
  const onMakePayment = async () => {
    try {
      console.log("[v0] Submitting booking to /user/book-tickets", { event_id: eventId, ticket: selected, qty, attendees });
  
      if (!selected) {
        alert("Please select a ticket type");
        return;
      }
  
      const formData = new FormData();
      formData.append("event_id", eventId || "");
      formData.append("ticket_id", selected.id);
      formData.append("ticket_label", selected.label);
      formData.append("ticket_price", String(selected.price));
      formData.append("qty", String(qty));
      formData.append("total", String(total));
  
      attendees.forEach((attendee, index) => {
        formData.append(`attendees[${index}][name]`, attendee.name);
        formData.append(`attendees[${index}][email]`, attendee.email);
        formData.append(`attendees[${index}][mobile]`, attendee.mobile);
        formData.append(`attendees[${index}][gender]`, attendee.gender);
      });
  
      // Log the FormData content
      console.log("FormData content:");
      formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
  
      const authValue = localStorage.getItem("authToken") || "";
      const xToken = localStorage.getItem("xToken") || "";
  
      // Building the request headers dynamically
      const headers = {
        ...(authValue ? { Authorization: `Bearer ${authValue}` } : {}),
        ...(xToken ? { "x-access-token": xToken } : {}),
        Accept: "application/json",  // Always include this for API response in JSON format
      };
  
      // Perform the fetch request with the headers
      const res = await fetch(buildApiUrl("/user/book-ticket"), {
        method: "POST",
        headers: headers,  // Pass the constructed headers here
        body: formData,    // Make sure the form data is correct
      });
  
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Booking failed: ${errText}`);
      }
  
      const result = await res.json();
      console.log("Booking response:", result);
  
      alert("Booking successful!");
      setStep("done");
      router.push(`/bookings/confirmation`); // optionally redirect
    } catch (err: any) {
      console.error("Booking error:", err);
      alert(err?.message || "Failed to book tickets");
    }
  };
  
  

  const fmtPrice = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "0.00")
  const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString() : "—")

  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Register</h1>
        <Link href={`/events/${eventId}`} className="text-sm underline opacity-80 hover:opacity-100">
          Back to event
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm opacity-80">Loading ticket types…</p>}
          {error && <p className="text-sm text-red-500">Failed to load tickets: {String(error.message || error)}</p>}

          {/* Debug: API response */}
          {/* Kept console logs only */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={selected?.id} onValueChange={(v) => setTicketId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} {t.price ? `- ₹${fmtPrice(t.price)}` : "(Free)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity (max {maxQty})</Label>
              <Select value={String(qty)} onValueChange={(v) => setQty(Math.min(Number(v), maxQty))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selected && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <div>
                Selected: <strong>{selected.label}</strong> • Price: ₹{fmtPrice(selected.price)}
              </div>
              <div className="opacity-80">
                Per user limit: {selected.maxPerUser ?? 5}
                {typeof selected.totalQty === "number" ? ` • Available: ${selected.totalQty}` : null}
              </div>
              {(selected.salesStart || selected.salesEnd) && (
                <div className="opacity-80">
                  Sales: {fmtDate(selected.salesStart)} → {fmtDate(selected.salesEnd)}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm opacity-80">
              Price per ticket: ₹{fmtPrice(selected?.price ?? 0)} • Total: <strong>₹{fmtPrice(total)}</strong>
            </div>
            {step === "tickets" && (
              <Button
                onClick={() => {
                  console.log("[v0] Continue to attendees", { event_id: eventId, ticket: selected, qty })
                  setStep("attendees")
                }}
              >
                Book Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {step === "attendees" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendees.map((a, i) => (
              <div key={i} className="rounded-md border p-3 space-y-3">
                <div className="text-sm font-medium">Ticket #{i + 1}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${i}`}>Name</Label>
                    <Input
                      id={`name-${i}`}
                      value={a.name}
                      onChange={(e) =>
                        setAttendees((prev) => prev.map((p, idx) => (idx === i ? { ...p, name: e.target.value } : p)))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`email-${i}`}>Email</Label>
                    <Input
                      id={`email-${i}`}
                      type="email"
                      value={a.email}
                      onChange={(e) =>
                        setAttendees((prev) => prev.map((p, idx) => (idx === i ? { ...p, email: e.target.value } : p)))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`mobile-${i}`}>Mobile</Label>
                    <Input
                      id={`mobile-${i}`}
                      value={a.mobile}
                      onChange={(e) =>
                        setAttendees((prev) => prev.map((p, idx) => (idx === i ? { ...p, mobile: e.target.value } : p)))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select
                      value={a.gender}
                      onValueChange={(v) =>
                        setAttendees((prev) => prev.map((p, idx) => (idx === i ? { ...p, gender: v } : p)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {selected?.label} × {qty} = <strong>₹{fmtPrice(total)}</strong>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("tickets")}>
                  Back
                </Button>
                <Button onClick={onMakePayment}>Make Payment</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
