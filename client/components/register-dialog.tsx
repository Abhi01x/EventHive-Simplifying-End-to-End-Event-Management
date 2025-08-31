"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TicketType = {
  id: string
  name: string
  price: number
  currency?: string
  maxPerUser?: number
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  eventTitle: string
  tickets: TicketType[]
}

type Attendee = { name: string; phone: string; email: string; gender: string }

export function RegisterDialog({ open, onOpenChange, eventTitle, tickets }: Props) {
  const [step, setStep] = useState<"tickets" | "attendees">("tickets")
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(tickets.map((t) => [t.id, 0])))

  const totalCount = useMemo(() => Object.values(qty).reduce((a, b) => a + (Number(b) || 0), 0), [qty])

  const selectedTickets = useMemo(() => {
    return tickets
      .map((t) => ({
        ...t,
        count: qty[t.id] || 0,
      }))
      .filter((t) => t.count > 0)
  }, [tickets, qty])

  const [attendees, setAttendees] = useState<Attendee[]>([])
  const totalAmount = useMemo(
    () => selectedTickets.reduce((sum, t) => sum + t.count * (Number(t.price) || 0), 0),
    [selectedTickets],
  )

  function resetAll() {
    setStep("tickets")
    setQty(Object.fromEntries(tickets.map((t) => [t.id, 0])))
    setAttendees([])
  }

  function handleClose() {
    resetAll()
    onOpenChange(false)
  }

  function proceedToAttendees() {
    const count = totalCount
    const arr: Attendee[] = Array.from({ length: count }).map(() => ({
      name: "",
      phone: "",
      email: "",
      gender: "",
    }))
    setAttendees(arr)
    setStep("attendees")
  }

  function updateQty(id: string, value: number, max?: number) {
    const v = Math.max(0, Math.min(max ?? 99, value || 0))
    setQty((q) => ({ ...q, [id]: v }))
  }

  function updateAttendee(index: number, field: keyof Attendee, value: string) {
    setAttendees((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function handlePayment() {
    console.log("[v0] Make Payment payload:", {
      eventTitle,
      tickets: selectedTickets,
      attendees,
      totalAmount,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-2xl">
        {step === "tickets" && (
          <>
            <DialogHeader>
              <DialogTitle>Tickets</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {tickets.map((t) => {
                const max = t.maxPerUser ?? 5
                return (
                  <div key={t.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t.currency ?? "₹"} {Number(t.price || 0).toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Max per user: {max}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`qty-${t.id}`} className="sr-only">
                        Quantity
                      </Label>
                      <Select value={String(qty[t.id] || 0)} onValueChange={(val) => updateQty(t.id, Number(val), max)}>
                        <SelectTrigger id={`qty-${t.id}`} className="w-20">
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: (t.maxPerUser ?? 5) + 1 }).map((_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Selected: {totalCount} • Total: ₹ {totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={proceedToAttendees} disabled={totalCount === 0}>
                Register
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "attendees" && (
          <>
            <DialogHeader>
              <DialogTitle>Attendees</DialogTitle>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
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

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setStep("tickets")}>
                Cancel
              </Button>
              <Button onClick={handlePayment}>Make Payment</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
