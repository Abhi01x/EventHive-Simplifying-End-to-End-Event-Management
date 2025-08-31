import { NextResponse } from "next/server"

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || "" // server-only env var
  if (!keyId) {
    return NextResponse.json({ error: "Razorpay key not configured" }, { status: 500 })
  }
  return NextResponse.json({ keyId })
}
