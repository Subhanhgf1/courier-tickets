"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { courierPortalApi } from "@/lib/api"
import { getUser, logout } from "@/lib/auth"
import { 
  LogOut, Shield, Search, RefreshCw, MessageSquare, AlertTriangle, Clock, CheckCircle, ArrowRight 
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const STATUS_CONFIGS = {
  OPEN: { label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  PENDING_COURIER: { label: "Pending Courier", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  PENDING_COMPANY: { label: "Pending Company (Merchant)", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  ESCALATED: { label: "Escalated", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  CLOSED: { label: "Closed", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  REOPENED: { label: "Reopened", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" }
}

const PRIORITY_CONFIGS = {
  LOW: { label: "Low", color: "text-slate-400" },
  MEDIUM: { label: "Medium", color: "text-blue-400" },
  HIGH: { label: "High", color: "text-orange-400" },
  CRITICAL: { label: "Critical", color: "text-red-400 font-bold" }
}

export default function TicketsListPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const activeUser = getUser()
    if (!activeUser) {
      router.push("/login")
      return
    }
    setUser(activeUser)
  }, [router])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 15
      }
      if (status) params.status = status
      if (search) params.search = search

      const res = await courierPortalApi.getTickets(params)
      if (res && res.tickets) {
        setTickets(res.tickets)
        setTotalPages(res.pagination.totalPages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTickets()
    }
  }, [user, page, status])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchTickets()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Courier Partner Desk</h1>
            <span className="text-xs text-slate-400">{user.courierPartnerName} ({user.name})</span>
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

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Assigned Disputes & Investigations</h2>
          <p className="text-sm text-slate-400">Review tickets raised by Nakson Group merchants for LCS deliveries.</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center space-x-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by ticket, tracking, order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-200">
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <button 
              onClick={fetchTickets} 
              className="border border-slate-800 bg-slate-950 hover:bg-slate-900 p-2 rounded-lg text-slate-400 transition"
              title="Refresh list"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tickets list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-sm">Fetching assigned tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
              <MessageSquare className="h-12 w-12 text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">No Tickets Found</h3>
              <p className="text-sm text-slate-400 max-w-xs">No active investigations have been assigned to your portal account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 font-semibold text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4">Ticket</th>
                    <th className="p-4">Reference Info</th>
                    <th className="p-4">Issue Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">SLA status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {tickets.map((ticket) => {
                    const statusConfig = STATUS_CONFIGS[ticket.currentStatus] || {}
                    const priorityConfig = PRIORITY_CONFIGS[ticket.priority] || {}
                    const timeAgo = formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
                    
                    const isResolutionBreached = ticket.resolutionBreached || (ticket.resolutionDeadline && new Date() > new Date(ticket.resolutionDeadline) && ticket.currentStatus !== 'RESOLVED' && ticket.currentStatus !== 'CLOSED');

                    return (
                      <tr key={ticket.id} className="hover:bg-slate-800/20 transition duration-150">
                        <td className="p-4">
                          <Link href={`/tickets/${ticket.id}`} className="font-bold text-blue-400 hover:text-blue-300 hover:underline">
                            {ticket.ticketNumber}
                          </Link>
                          <div className="text-xs text-slate-500 mt-1">Created {timeAgo}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-white">Tracking: {ticket.trackingNumber}</div>
                          {ticket.orderReference && (
                            <div className="text-xs text-slate-500 mt-0.5">Order Ref: {ticket.orderReference}</div>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-200">
                          {ticket.issueType.name}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center text-xs font-semibold ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                        </td>
                        <td className="p-4">
                          {isResolutionBreached ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30 text-xs font-semibold gap-1">
                              <AlertTriangle className="h-3 w-3" /> SLA Breached
                            </span>
                          ) : ticket.currentStatus === 'RESOLVED' || ticket.currentStatus === 'CLOSED' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 text-xs font-semibold gap-1">
                              <CheckCircle className="h-3 w-3" /> Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-slate-400 font-semibold gap-1">
                              <Clock className="h-3 w-3 text-blue-500 animate-pulse" /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/tickets/${ticket.id}`}>
                            <button className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition duration-200">
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              Previous
            </button>
            <div className="text-xs text-slate-400 font-medium">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
