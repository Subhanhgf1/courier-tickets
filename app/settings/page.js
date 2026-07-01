"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUser, logout } from "@/lib/auth"
import { courierPortalApi } from "@/lib/api"
import { 
  LogOut, ArrowLeft, Users, UserCheck, UserPlus, AlertCircle, CheckCircle, ShieldCheck, Trash2
} from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // User creation form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("SUPPORT_REP")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const activeUser = getUser()
    if (!activeUser) {
      router.push("/login")
      return
    }
    setUser(activeUser)
  }, [router])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const res = await courierPortalApi.getUsers()
      if (res && Array.isArray(res)) {
        setUsers(res)
      } else if (res && res.error) {
        console.error("Failed to fetch users:", res.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUsers()
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!name || !email || !password) {
      setError("Please fill out all required fields.")
      return
    }

    try {
      setSubmitting(true)
      const res = await courierPortalApi.createUser({ name, email, password, role })
      if (res && !res.error) {
        setSuccess(`User ${res.name} successfully created as ${res.role === 'ADMIN' ? 'Administrator' : 'Support Representative'}.`)
        setName("")
        setEmail("")
        setPassword("")
        setRole("SUPPORT_REP")
        fetchUsers() // Refresh list
      } else {
        setError(res?.error || "Failed to create user. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setError("")
      setSuccess("")
      const res = await courierPortalApi.deleteUser(userId)
      if (res && !res.error) {
        setSuccess(`User "${userName}" was successfully deleted.`)
        fetchUsers() // Refresh list
      } else {
        setError(res?.error || `Failed to delete user: ${userName}`)
      }
    } catch (err) {
      setError("An unexpected error occurred while deleting user.")
      console.error(err)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-55 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Header bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <Link href="/tickets">
            <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-base leading-none text-slate-900 dark:text-white">Settings & User Management</h1>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user.courierPartnerName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={logout} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition duration-200 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Main panel */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          {/* Left Column: Form (only for Admins) */}
          {user.role === 'ADMIN' ? (
            <div className="w-full lg:w-5/12 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl transition-colors duration-200">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Team Member</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Provision a new account for support desk staff.</p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-xs font-medium mb-4">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 text-xs font-medium mb-4">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@leopards.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      System Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300 transition"
                    >
                      <option value="SUPPORT_REP">Support Representative</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition duration-200 cursor-pointer shadow-lg shadow-blue-500/20 animate-none"
                  >
                    {submitting ? "Creating User..." : "Create User"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-5/12 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl transition-colors duration-200">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="h-10 w-10 bg-yellow-500/10 border border-yellow-500/20 text-yellow-650 dark:text-yellow-400 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Role-Based Access</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your role: {user.role}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Only users with the <span className="font-semibold text-blue-600 dark:text-blue-400">ADMIN</span> role can create new users or manage team credentials. If you need to register a new user, please contact an administrator of your portal or Nakson Group support.
                </p>
              </div>
            </div>
          )}

          {/* Right Column: Registered Users Table */}
          <div className="w-full lg:w-7/12 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Team Members</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">All registered users for {user.courierPartnerName}.</p>
                  </div>
                </div>
              </div>

              {loadingUsers ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent animate-spin rounded-full mx-auto" />
                  <p className="text-xs">Loading team directory...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm">No registered team members found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pr-4">Name / Email</th>
                        <th className="pb-3 pr-4">Role</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Joined</th>
                        {user.role === 'ADMIN' && <th className="pb-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition">
                          <td className="py-3.5 pr-4">
                            <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                          </td>
                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10 dark:border-blue-500/20">
                                <ShieldCheck className="h-3 w-3" /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-650 dark:text-slate-400 bg-slate-500/5 dark:bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/10 dark:border-slate-500/20">
                                Support Rep
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            {u.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20 uppercase tracking-wider">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-450 border border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          {user.role === 'ADMIN' && (
                            <td className="py-3.5 text-right whitespace-nowrap">
                              {u.id !== user.id ? (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic mr-2 font-medium">You</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}

