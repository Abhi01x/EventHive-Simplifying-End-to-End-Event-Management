import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR", receipt = `rcpt_${Date.now()}`, notes = {} } = await req.json().catch(() => ({}))
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      console.log("[SERVER][v0] Razorpay keys missing")
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 })
    }
    const amountPaise = Math.round(amount * 100)
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

    console.log("[SERVER][v0] Creating Razorpay order paise:", amountPaise)
    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: amountPaise, currency, receipt, notes }),
    })
    const text = await resp.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      console.log("[SERVER][v0] Razorpay non-json:", text.slice(0, 180))
      return NextResponse.json({ error: "Invalid Razorpay response" }, { status: 502 })
    }
    if (!resp.ok) {
      console.log("[SERVER][v0] Razorpay order error:", resp.status, json)
      return NextResponse.json({ error: "Failed to create order", details: json }, { status: resp.status })
    }
    console.log("[SERVER][v0] Razorpay order created:", json?.id)
    return NextResponse.json(json)
  } catch (e: any) {
    console.log("[SERVER][v0] Razorpay order exception:", e?.message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
