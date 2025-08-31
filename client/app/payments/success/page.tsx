"use client"

import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"

export default function PaymentSuccessPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const paymentId = sp.get("payment_id") || sp.get("razorpay_payment_id") || ""
  const orderId = sp.get("order_id") || ""
  const amount = sp.get("amount") || ""

  const handleBackToHome = () => {
    router.push("/")
  }

  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payment Successful</h1>
      <p className="text-sm text-muted-foreground">Thank you! Your payment was completed.</p>
      <div className="border rounded-md p-4 text-sm">
        <div>Order ID: {orderId}</div>
        <div>Payment ID: {paymentId}</div>
        <div>Amount: {amount ? `₹${(Number(amount) / 100).toFixed(2)}` : "-"}</div>
      </div>
      <button onClick={handleBackToHome} className="bg-blue-500 text-white px-4 py-2 rounded">
        Back to Home
      </button>
    </main>
  )
}
