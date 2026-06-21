"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    if (getUser()) {
      router.push("/tickets")
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="flex min-h-screen bg-slate-950 items-center justify-center text-slate-500 text-sm">
      Loading Courier Partner Desk...
    </div>
  )
}
