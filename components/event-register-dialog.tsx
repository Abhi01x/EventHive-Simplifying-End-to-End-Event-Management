"use client"

import * as React from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

// Mock ticket tiers and pricing if event.tickets is not provided
const MOCK_TIERS = [
  { key: "standard", label: "Standard", price: 0, maxPerUser: 5 },
  { key: "vip", label: "VIP", price: 500, maxPerUser: 5 },
]

type EventInfo = {
  id: string | number
  title: string
  dateLabel?: string
  venue?: string
  tickets?: Array<any> | null
}

function normalizeTiers(tickets?: Array<any> | null) {
  if (!tickets || !Array.isArray(tickets) || tickets.length === 0) return MOCK_TIERS
  return tickets.map((t, i) => {
    const key = String(t?.key ?? t?.id ?? t?.tier ?? t?.name ?? `tier-${i}`).toLowerCase()
    const label = String(t?.label ?? t?.name ?? t?.tier ?? `Tier ${i + 1}`)
    const price = Number(t?.price ?? t?.amount ?? 0)
    const maxPerUser = Number(t?.max_per_user ?? t?.maxPerUser ?? 5) || 5
    return { key, label, price, maxPerUser }
  })
}

export default function EventRegisterDialog({ event }: { event: EventInfo }) {
  const tiers = React.useMemo(() => normalizeTiers(event?.tickets), [event])
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<"tickets" | "attendees">("tickets")
  const [selectedTier, setSelectedTier] = React.useState(tiers[0]?.key ?? "standard")
  const [qty, setQty] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  const tier = React.useMemo(() => tiers.find((t) => t.key === selectedTier) ?? tiers[0], [tiers, selectedTier])
  const maxQty = Math.min(5, tier?.maxPerUser ?? 5)
  const total = (tier?.price ?? 0) * qty

  // Attendees forms array
  const [attendees, setAttendees] = React.useState(
    Array.from({ length: qty }, () => ({ name: "", email: "", phone: "", gender: "Male" })),
  )
  React.useEffect(() => {
    // Keep attendees length in sync with qty
    setAttendees((prev) => {
      const next = [...prev]
      if (qty > prev.length) {
        for (let i = prev.length; i < qty; i++) next.push({ name: "", email: "", phone: "", gender: "Male" })
      } else if (qty < prev.length) {
        next.length = qty
      }
      return next
    })
  }, [qty])

  function reset() {
    setStep("tickets")
    setSelectedTier(tiers[0]?.key ?? "standard")
    setQty(1)
    setAttendees([{ name: "", email: "", phone: "", gender: "Male" }])
  }

  const handleBookNow = () => {
    console.log("[v0] BookNow -> tier:", tier, "qty:", qty)
    setStep("attendees")
  }

  const handleMakePayment = async () => {
    setLoading(true)
    try {
      const payload = {
        eventId: event.id,
        tier: tier?.key,
        qty,
        total,
        attendees,
      }
      console.log("[v0] Booking payload:", payload)
      // No API yet; simulate success
      await new Promise((r) => setTimeout(r, 800))
      toast({
        title: "Booking created",
        description: `Reserved ${qty} ${tier?.label} ticket(s). Total: ₹${total}`,
      })
      setOpen(false)
      reset()
    } catch (e: any) {
      toast({
        title: "Booking failed",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Register</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        {step === "tickets" ? (
          <>
            <DialogHeader>
              <DialogTitle>Tickets</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.key} value={t.key}>
                        {t.label} {t.price ? `— ₹${t.price}` : "— Free"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Select value={String(qty)} onValueChange={(v) => setQty(Math.min(Number(v) || 1, maxQty))}>
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
                  <span className="font-medium">{tier?.price ? `₹${total}` : "Free"}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
              <Button onClick={handleBookNow}>Book Now</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Attendees</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {attendees.map((a, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={a.name}
                      onChange={(e) => {
                        const v = e.target.value
                        setAttendees((prev) => prev.map((x, i) => (i === idx ? { ...x, name: v } : x)))
                      }}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={a.email}
                      onChange={(e) => {
                        const v = e.target.value
                        setAttendees((prev) => prev.map((x, i) => (i === idx ? { ...x, email: v } : x)))
                      }}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile</Label>
                    <Input
                      value={a.phone}
                      onChange={(e) => {
                        const v = e.target.value
                        setAttendees((prev) => prev.map((x, i) => (i === idx ? { ...x, phone: v } : x)))
                      }}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={a.gender}
                      onValueChange={(v) =>
                        setAttendees((prev) => prev.map((x, i) => (i === idx ? { ...x, gender: v } : x)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  {qty} × {tier?.label} — {tier?.price ? `₹${tier?.price} each` : "Free"}
                </p>
                <p className="font-semibold">{tier?.price ? `Total: ₹${total}` : "Free"}</p>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="secondary" onClick={() => setStep("tickets")}>
                Back
              </Button>
              <Button onClick={handleMakePayment} disabled={loading}>
                {loading ? "Processing..." : "Make Payment"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
