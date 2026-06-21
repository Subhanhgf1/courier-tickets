"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUser, logout } from "@/lib/auth"
import { 
  LogOut, Shield, ArrowLeft, Users, Mail, UserCheck
} from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const activeUser = getUser()
    if (!activeUser) {
      router.push("/login")
      return
    }
    setUser(activeUser)
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/tickets">
            <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-base leading-none">Settings & User Management</h1>
            <span className="text-xs text-slate-400">{user.courierPartnerName}</span>
          </div>
        </div>

        <button 
          onClick={logout} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-red-400 hover:border-red-900/50 transition duration-200 text-xs font-semibold"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </header>

      {/* Main panel */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6 mt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />

          <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
            <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Team Members & Access</h2>
              <p className="text-xs text-slate-400">Configure access for Leopards Courier support representatives.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-slate-950 p-4 border border-slate-850 rounded-lg">
              <UserCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Role-Based Gating</h4>
                <p className="text-xs text-slate-400 mt-1">
                  You are currently logged in as a <span className="text-emerald-400 font-semibold">{user.role}</span>.
                  Only administrators can request additional portal credentials.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-950 p-4 border border-slate-850 rounded-lg">
              <Mail className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">How to Add Representatives</h4>
                <p className="text-xs text-slate-400 mt-1">
                  To provision new accounts or modify credentials for your support staff, please request your Nakson Group account manager to register the team members. 
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Send requests with employee names and emails to: <span className="text-blue-400 font-medium">admin@nakson.services</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
