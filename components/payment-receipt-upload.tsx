"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react"

interface Receipt {
  id: string
  receipt_url: string
  status: "submitted" | "confirmed" | "rejected"
  created_at: string
}

export function PaymentReceiptUpload({
  conferenceId,
  userId,
}: {
  conferenceId: string
  userId: string
}) {
  const { t } = useLanguage()
  const supabase = createBrowserClient()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [hasApplication, setHasApplication] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, userId])

  async function loadState() {
    try {
      setLoading(true)
      const [appRes, receiptRes] = await Promise.all([
        supabase
          .from("delegate_applications")
          .select("id")
          .eq("conference_id", conferenceId)
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("payment_receipts")
          .select("id, receipt_url, status, created_at")
          .eq("conference_id", conferenceId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      setHasApplication(!!appRes.data)
      setReceipt((receiptRes.data as Receipt) || null)
    } catch (err) {
      console.error("Error loading payment state:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "receipts")
      const res = await fetch("/api/upload-blob", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      // Get application id if any (optional link)
      const { data: app } = await supabase
        .from("delegate_applications")
        .select("id, full_name")
        .eq("conference_id", conferenceId)
        .eq("user_id", userId)
        .maybeSingle()

      const { error } = await supabase.from("payment_receipts").insert({
        conference_id: conferenceId,
        application_id: app?.id || null,
        user_id: userId,
        receipt_url: data.url,
        full_name: app?.full_name || null,
        status: "submitted",
      })
      if (error) throw error

      alert(t("receipt_uploaded"))
      await loadState()
    } catch (err) {
      console.error("Receipt upload error:", err)
      alert((err as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  if (loading) return null

  // Only relevant for users who applied to this conference
  if (!hasApplication) {
    return <p className="text-sm text-muted-foreground">{t("apply_first_to_pay")}</p>
  }

  const statusBadge = () => {
    if (!receipt) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          {t("payment_not_submitted")}
        </Badge>
      )
    }
    if (receipt.status === "confirmed") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          {t("payment_confirmed")}
        </Badge>
      )
    }
    if (receipt.status === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          {t("payment_rejected")}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        <Clock className="w-3.5 h-3.5 mr-1" />
        {t("payment_submitted")}
      </Badge>
    )
  }

  const canUpload = !receipt || receipt.status === "rejected"

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">{t("payment_status_label")}:</span>
        {statusBadge()}
      </div>

      {receipt && (
        <a
          href={receipt.receipt_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {t("view_receipt")}
        </a>
      )}

      {canUpload && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            id="receipt-upload"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button asChild variant="outline" size="sm" disabled={uploading}>
            <label htmlFor="receipt-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? t("uploading") : receipt ? t("reupload_receipt") : t("upload_receipt")}
            </label>
          </Button>
        </div>
      )}
    </div>
  )
}
