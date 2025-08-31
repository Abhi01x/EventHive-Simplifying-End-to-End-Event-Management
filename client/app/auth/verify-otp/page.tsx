"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trophy, ArrowLeft, Loader2, Mail } from "lucide-react"
import { buildApiUrl } from "@/lib/api-config"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const router = useRouter()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const email = localStorage.getItem("userEmail")
    const storedUserId = localStorage.getItem("pendingUserId")

    if (email) {
      setUserEmail(email)
    }
    if (storedUserId) {
      setUserId(storedUserId)
    }

    if (!email) {
      router.push("/auth/signup")
    }
  }, [router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const otpCode = otp.join("")
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits")
      setIsLoading(false)
      return
    }

    try {
      const verifyEndpoint = "/auth/verify-otp"
      console.log("[v0] Making OTP verification request to:", buildApiUrl(verifyEndpoint))

      const requestBody = {
        email: userEmail,
        otp: otpCode,
      }

      if (userId) {
        requestBody.id = userId
      }

      const response = await fetch(buildApiUrl(verifyEndpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] Response status:", response.status)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.log("[v0] Non-JSON response:", textResponse.substring(0, 200))
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] OTP verification response:", data)

      if (data.success === true && data.msg !== "OTP sent to your email") {
        // Only proceed if the response indicates actual verification success
        if (data.user) {
          localStorage.setItem("userData", JSON.stringify(data.user))
        } else {
          const pendingUserData = localStorage.getItem("pendingUserData")
          if (pendingUserData) {
            const userData = JSON.parse(pendingUserData)
            userData.verification = 1
            localStorage.setItem("userData", JSON.stringify(userData))
          } else {
            const basicUserData = {
              id: userId,
              email: userEmail,
              verification: 1,
              role: "user",
            }
            localStorage.setItem("userData", JSON.stringify(basicUserData))
          }
        }

        if (data.token) {
          localStorage.setItem("authToken", data.token)
          localStorage.setItem("token", data.token)
        }

        localStorage.removeItem("pendingUserData")
        localStorage.removeItem("pendingUserId")
        localStorage.removeItem("userEmail")

        console.log("[v0] OTP verification successful, redirecting to dashboard")
        try {
          router.replace("/dashboard")
        } catch {}
        setTimeout(() => {
          if (typeof window !== "undefined" && window.location.pathname.includes("/verify-otp")) {
            window.location.assign("/dashboard")
          }
        }, 300)
        return
      } else if (data.msg === "OTP sent to your email") {
        setError("The system sent a new OTP instead of verifying. Please check your email for the new code.")
      } else {
        setError(data.msg || data.message || "Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      if (error instanceof Error) {
        if (error.message.includes("HTML instead of JSON")) {
          setError("Server error: The verification endpoint may not exist or is returning an error page.")
        } else if (error.message.includes("Failed to fetch")) {
          setError("Network error: Unable to connect to the server. Please check your internet connection.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    console.log("[v0] Resend OTP requested for:", userEmail)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Signup
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">EventHive</span>
          </div>
          <Badge className="bg-secondary/10 text-secondary border-secondary/20">Verify Your Account</Badge>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Enter Verification Code</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              We sent a 6-digit code to {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-center block">Enter 6-digit OTP</Label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold"
                      required
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Account"
                )}
              </Button>

              <div className="text-center">
                <button type="button" onClick={resendOTP} className="text-sm text-primary hover:underline">
                  Didn't receive the code? Resend OTP
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
