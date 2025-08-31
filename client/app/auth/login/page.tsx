"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trophy, Mail, Lock, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response.")
      }

      const data = await response.json()

      if (data.success === true || data.message === "login success") {
        if (data.token) {
          localStorage.setItem("authToken", data.token)
          localStorage.setItem("token", data.token)
        }
        if (data.user) {
          localStorage.setItem("userData", JSON.stringify(data.user))
        }

        try {
          router.replace("/dashboard")
        } catch {}
        setTimeout(() => {
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth")) {
            window.location.assign("/dashboard")
          }
        }, 300)
        return
      } else {
        setError(data.message || data.msg || data.error || "Login failed")
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.")
      } else if (err.message.includes("Failed to fetch")) {
        setError("Cannot connect to server.")
      } else if (err.message.includes("non-JSON response")) {
        setError("Server error. Please try again later.")
      } else {
        setError(err.message || "An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 transition-all">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex justify-center items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-extrabold text-foreground tracking-tight">EventHive</span>
          </div>

          <Badge variant="outline" className="text-sm px-3 py-1 bg-accent/30 text-accent border-accent/20">
            Welcome Back, Champion!
          </Badge>
        </div>

        {/* Card */}
        <Card className="shadow-xl border border-border rounded-lg">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-semibold">Sign In</CardTitle>
            <CardDescription>Access your account by signing in below</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end text-sm">
                <Link href="#" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-muted/40 border-0 shadow-none text-center">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-2">Demo Credentials</p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>
                <strong>User:</strong> user@eventhive.com / password123
              </p>
              <p>
                <strong>Admin:</strong> admin@eventhive.com / password123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
