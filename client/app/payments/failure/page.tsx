"use client"

import { useSearchParams } from "next/navigation"

export default function PaymentFailurePage() {
  const sp = useSearchParams()
  const reason = sp.get("reason") || "Payment cancelled or failed."

  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payment Not Completed</h1>
      <p className="text-sm text-muted-foreground">{reason}</p>
      <div className="mt-2">
        <a href="/" className="text-blue-600 underline">
          Go home
        </a>
      </div>
      {/* Additional content can be added here */}
    </main>
  )
}
