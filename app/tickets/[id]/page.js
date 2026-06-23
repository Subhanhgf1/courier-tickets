"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { courierPortalApi } from "@/lib/api"
import { getUser, logout, getAccessToken } from "@/lib/auth"
import { 
  ArrowLeft, Shield, Clock, AlertTriangle, Send, FileText, Check, X, Loader2, RefreshCw, LogOut, Settings 
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import ThemeToggle from "@/components/ThemeToggle"

const STATUS_CONFIGS = {
  OPEN: { label: "Open", color: "bg-blue-500/10 text-blue-550 dark:text-blue-400 border-blue-500/20" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  PENDING_COURIER: { label: "Pending Courier", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  PENDING_COMPANY: { label: "Pending Company (Merchant)", color: "bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-500/20" },
  ESCALATED: { label: "Escalated", color: "bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20" },
  CLOSED: { label: "Closed", color: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20" },
  REOPENED: { label: "Reopened", color: "bg-indigo-500/10 text-indigo-655 dark:text-indigo-400 border-indigo-500/20" }
}

export default function TicketDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getProxyUrl = (fileUrl) => {
    try {
      const url = new URL(fileUrl);
      const path = url.searchParams.get("path");
      const token = getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004";
      return `${apiBase}/api/courier-portal/download?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`;
    } catch (e) {
      return fileUrl;
    }
  }

  const getPreviewUrl = (fileUrl) => {
    try {
      return fileUrl.replace("/files/download", "/files/preview");
    } catch (e) {
      return fileUrl;
    }
  }

  // Reply state
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const threadEndRef = useRef(null)

  useEffect(() => {
    const activeUser = getUser()
    if (!activeUser) {
      router.push("/login")
      return
    }
    setUser(activeUser)
  }, [router])

  const fetchTicket = async () => {
    try {
      const res = await courierPortalApi.getTicket(id)
      if (res && res.id) {
        setTicket(res)
        setError("")
      } else {
        setError(res.error || "Failed to load ticket details")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to fetch ticket.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTicket()
    }
  }, [user, id])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [ticket?.responses])

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      setUploading(true)
      const uploaded = []
      for (const file of files) {
        const res = await courierPortalApi.uploadAttachment(file)
        if (res && res.fileUrl) {
          uploaded.push({
            fileName: res.fileName,
            fileUrl: res.fileUrl,
            fileSize: res.fileSize,
            mimeType: res.mimeType
          })
        }
      }
      setAttachments(prev => [...prev, ...uploaded])
    } catch (err) {
      console.error(err)
      alert("File upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!message.trim() && attachments.length === 0) return

    try {
      setSending(true)
      const res = await courierPortalApi.respondToTicket(id, message.trim(), attachments)

      if (res && res.id) {
        setMessage("")
        setAttachments([])
        await fetchTicket()
      } else {
        alert(res.error || "Failed to send response")
      }
    } catch (err) {
      console.error(err)
      alert("Error sending message.")
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true)
      const res = await courierPortalApi.updateStatus(id, newStatus)
      if (res && res.status) {
        await fetchTicket()
      } else {
        alert(res.error || "Failed to update status")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center transition-colors duration-200">
          <span className="font-bold text-slate-900 dark:text-white">Courier Desk</span>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto p-12 text-center text-slate-400 dark:text-slate-500 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-sm">Loading ticket details...</p>
        </main>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-6 text-center transition-colors duration-200">
        <div className="text-red-500 font-bold mb-4">{error || "Ticket not found"}</div>
        <Link href="/tickets">
          <button className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer">
            Back to Tickets
          </button>
        </Link>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIGS[ticket.currentStatus] || {}
  const isResolutionBreached = ticket.resolutionBreached || (ticket.resolutionDeadline && new Date() > new Date(ticket.resolutionDeadline) && ticket.currentStatus !== 'RESOLVED' && ticket.currentStatus !== 'CLOSED');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center gap-2 min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/tickets">
              <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">{ticket.ticketNumber}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-9 md:pl-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            {isResolutionBreached && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-[10px] sm:text-xs font-semibold gap-1">
                <AlertTriangle className="h-3 w-3" /> SLA Breached
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user.role === 'ADMIN' && (
            <Link href="/settings">
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition text-xs font-semibold cursor-pointer">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </Link>
          )}
          <ThemeToggle />
          <button 
            onClick={logout} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition duration-200 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-[75vh]">
          <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-4 space-y-4 shadow-xl transition-colors duration-200">
            {/* Description */}
            <div className="bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-850 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-350">Merchant Staff ({ticket.creator.first_name})</span>
                <span>{format(new Date(ticket.createdAt), "PPpp")}</span>
              </div>
              <div className="text-sm whitespace-pre-line text-slate-800 dark:text-slate-200 mb-3 font-normal">
                {ticket.customerRemarks}
              </div>
              {ticket.attachments && ticket.attachments.filter(att => !att.responseId).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Initial Attachments
                  </span>
                  <div className="flex flex-col gap-3">
                    {/* Images preview */}
                    {ticket.attachments.filter(att => !att.responseId && att.mimeType?.startsWith("image/")).length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {ticket.attachments
                          .filter(att => !att.responseId && att.mimeType?.startsWith("image/"))
                          .map((att) => (
                            <div 
                              key={att.id} 
                              className="relative group overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-blue-500/50 transition duration-200"
                            >
                              <img 
                                src={getPreviewUrl(att.fileUrl)} 
                                alt={att.fileName} 
                                className="h-28 w-auto object-cover max-w-[200px]"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-2">
                                <span className="text-[9px] text-white truncate text-center block font-medium">
                                  {att.fileName}
                                </span>
                                <a 
                                  href={getProxyUrl(att.fileUrl)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] py-1 font-semibold block"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Non-images list */}
                    {ticket.attachments.filter(att => !att.responseId && !att.mimeType?.startsWith("image/")).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ticket.attachments
                          .filter(att => !att.responseId && !att.mimeType?.startsWith("image/"))
                          .map((att) => {
                            const sizeKB = att.fileSize ? `${(att.fileSize / 1024).toFixed(0)} KB` : "";
                            return (
                              <div key={att.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-950 transition">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="p-1 rounded bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30">
                                    <FileText className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0 text-xs">
                                    <a 
                                      href={getProxyUrl(att.fileUrl)} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline block truncate max-w-[180px]"
                                      title={att.fileName}
                                    >
                                      {att.fileName}
                                    </a>
                                    {sizeKB && <span className="text-[10px] text-slate-500">{sizeKB}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation Thread */}
            {ticket.responses.map((response) => {
              const isCourierAuthor = !!response.authorCourierUserId
              const authorName = isCourierAuthor 
                ? `${response.authorCourierUser.name} (${user.courierPartnerName} Support)` 
                : `Merchant Staff (${response.authorUser.first_name})`
              
              const dateStr = format(new Date(response.createdAt), "PPpp")

              return (
                <div 
                  key={response.id} 
                  className={`p-4 rounded-xl border text-sm ${
                    isCourierAuthor 
                      ? "bg-blue-50/30 dark:bg-blue-950/20 border-blue-105/30 dark:border-blue-900/30"
                      : "bg-slate-50 dark:bg-slate-950/50 border-slate-150 dark:border-slate-850"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-550 mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-350">{authorName}</span>
                    <span>{dateStr}</span>
                  </div>
                  <div className="whitespace-pre-line text-slate-800 dark:text-slate-200 mb-3">
                    {response.message}
                  </div>
                  {response.attachments && response.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Attachments
                      </span>
                      <div className="flex flex-col gap-3">
                        {/* Images preview */}
                        {response.attachments.filter(att => att.mimeType?.startsWith("image/")).length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {response.attachments
                              .filter(att => att.mimeType?.startsWith("image/"))
                              .map((att) => (
                                <div 
                                  key={att.id} 
                                  className="relative group overflow-hidden rounded-lg border border-slate-255 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-blue-500/50 transition duration-200"
                                >
                                  <img 
                                    src={getPreviewUrl(att.fileUrl)} 
                                    alt={att.fileName} 
                                    className="h-28 w-auto object-cover max-w-[200px]"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-2">
                                    <span className="text-[9px] text-white truncate text-center block font-medium">
                                      {att.fileName}
                                    </span>
                                    <a 
                                      href={getProxyUrl(att.fileUrl)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] py-1 font-semibold block"
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Non-images list */}
                        {response.attachments.filter(att => !att.mimeType?.startsWith("image/")).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {response.attachments
                              .filter(att => !att.mimeType?.startsWith("image/"))
                              .map((att) => {
                                const sizeKB = att.fileSize ? `${(att.fileSize / 1024).toFixed(0)} KB` : "";
                                return (
                                  <div key={att.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 transition">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="p-1 rounded bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30">
                                        <FileText className="h-4 w-4" />
                                      </span>
                                      <div className="min-w-0 text-xs">
                                        <a 
                                          href={getProxyUrl(att.fileUrl)} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline block truncate max-w-[180px]"
                                          title={att.fileName}
                                        >
                                          {att.fileName}
                                        </a>
                                        {sizeKB && <span className="text-[10px] text-slate-505">{sizeKB}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={threadEndRef} />
          </div>

          {/* Reply Form */}
          {ticket.currentStatus !== 'CLOSED' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl transition-colors duration-200">
              <form onSubmit={handleSendReply} className="space-y-4">
                <textarea
                  rows={3}
                  required
                  placeholder="Type your reply to the merchant..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors duration-200"
                />

                {uploading && (
                  <div className="text-xs text-blue-500 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading attachment to FileStore...</span>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded px-2.5 py-1 text-slate-700 dark:text-slate-300 transition-colors duration-200">
                        <FileText className="h-3 w-3 text-blue-500" />
                        <span className="max-w-[120px] truncate">{att.fileName}</span>
                        <button type="button" onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <input
                      type="file"
                      multiple
                      id="courier-file-input"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="courier-file-input" className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold hover:underline">
                      Add File Attachment
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={sending || uploading || (!message.trim() && attachments.length === 0)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {sending ? "Sending..." : "Send Message"}
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar context */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm transition-colors duration-200">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Investigation Context</h3>
            
            <div className="border-b border-slate-150 dark:border-slate-800 pb-3">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Tracking ID</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{ticket.trackingNumber}</span>
            </div>

            {ticket.orderReference && (
              <div className="border-b border-slate-150 dark:border-slate-800 pb-3">
                <span className="text-xs text-slate-500 block uppercase tracking-wider">Order Reference</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">{ticket.orderReference}</span>
              </div>
            )}

            <div className="border-b border-slate-150 dark:border-slate-800 pb-3">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Issue Type</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{ticket.issueType.name}</span>
            </div>

            {/* Display Unpaid/Priority details on the ticket context sidebar */}
            {ticket.order && (
              <div className="border-b border-slate-150 dark:border-slate-800 pb-3 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Unpaid Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                    {ticket.order.total_amount !== null 
                      ? `${Math.max(0, Number(ticket.order.total_amount) - Number(ticket.order.paid_amount || 0)).toLocaleString()} PKR`
                      : "0 PKR"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-505 block uppercase tracking-wider">Priority Status</span>
                  {(() => {
                    const totalAmount = Number(ticket.order.total_amount || 0);
                    const paidAmount = Number(ticket.order.paid_amount || 0);
                    const isPaid = ticket.order.payment_status?.toLowerCase() === 'paid' || (totalAmount - paidAmount) <= 0;
                    return (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 uppercase ${
                        isPaid 
                          ? "bg-green-150 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {isPaid ? "Non-COD Priority" : "COD Priority"}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs text-slate-500 block uppercase tracking-wider">SLA Resolution Limit</span>
              <span className="font-semibold text-slate-600 dark:text-slate-350 text-xs">
                {ticket.resolutionDeadline ? format(new Date(ticket.resolutionDeadline), "PPpp") : "N/A"}
              </span>
            </div>
          </div>

          {/* Live Courier Tracking from trackmyorder.pk */}
          {ticket.liveTracking && ticket.liveTracking.success !== false && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm transition-colors duration-200">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin-slow" />
                Live Courier Status
              </h3>
              
              <div className="grid grid-cols-3 gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Live Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase mt-1">
                    {ticket.liveTracking.status || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Courier Code</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block mt-1">
                    {ticket.liveTracking.courier}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Transit Time</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block mt-1">
                    {ticket.liveTracking.duration_hour !== null && ticket.liveTracking.duration_hour !== undefined
                      ? `${Number(ticket.liveTracking.duration_hour).toFixed(1)} hrs`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {(ticket.liveTracking.origin || ticket.liveTracking.destination) && (
                <div className="border-b border-slate-150 dark:border-slate-800 pb-3">
                  <span className="text-[10px] text-slate-550 block uppercase tracking-wider mb-1">Route</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">{ticket.liveTracking.origin?.city || "N/A"}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{ticket.liveTracking.destination?.city || "N/A"}</span>
                  </div>
                </div>
              )}

              {ticket.liveTracking.receiver?.name && (
                <div className="border-b border-slate-150 dark:border-slate-800 pb-3">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Receiver</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs block">{ticket.liveTracking.receiver.name}</span>
                </div>
              )}

              {ticket.liveTracking.history && ticket.liveTracking.history.length > 0 ? (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold mb-2">Tracking History</span>
                  <div className="space-y-3 relative pl-3.5 border-l border-slate-200 dark:border-slate-800">
                    {ticket.liveTracking.history.map((event, index) => {
                      const isLatest = index === 0;
                      return (
                        <div key={index} className="relative">
                          <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-950 ${
                            isLatest 
                              ? "bg-blue-500 animate-pulse" 
                              : "bg-slate-300 dark:bg-slate-800"
                          }`} />
                          <div className={`font-semibold text-xs ${isLatest ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {event.status || "EVENT"}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {event.description}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 font-medium">
                            {format(new Date(event.datetime), "PPpp")}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-2 text-xs">No tracking events found.</div>
              )}
            </div>
          )}

          {/* Status Controls */}
          {ticket.currentStatus !== 'CLOSED' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-sm transition-colors duration-200">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Actions & Status</h3>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 block uppercase tracking-wider">Update Progress</label>
                <select
                  disabled={updatingStatus}
                  value={ticket.currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING_COMPANY">Pending Company Action</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
