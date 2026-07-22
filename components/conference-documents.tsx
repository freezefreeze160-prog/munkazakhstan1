"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Upload, Download, Trash2, BookOpen } from "lucide-react"

interface ConferenceDocument {
  id: string
  conference_id: string
  uploaded_by: string
  doc_type: "background_guide" | "position_paper"
  title: string
  file_url: string
  file_name: string | null
  file_size: number | null
  committee_id: string | null
  created_at: string
}

interface Committee {
  id: string
  name: string
}

export function ConferenceDocuments({
  conferenceId,
  userId,
  isOrganizer,
}: {
  conferenceId: string
  userId: string | null
  isOrganizer: boolean
}) {
  const { t } = useLanguage()
  const supabase = createBrowserClient()
  const [documents, setDocuments] = useState<ConferenceDocument[]>([])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [pendingCommittee, setPendingCommittee] = useState<Record<string, string>>({})
  const guideInputRef = useRef<HTMLInputElement>(null)
  const paperInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId])

  async function loadData() {
    try {
      setLoading(true)
      const [docsRes, commRes] = await Promise.all([
        supabase
          .from("conference_documents")
          .select("*")
          .eq("conference_id", conferenceId)
          .order("created_at", { ascending: false }),
        supabase.from("conference_committees").select("id, name").eq("conference_id", conferenceId),
      ])
      setDocuments(docsRes.data || [])
      setCommittees(commRes.data || [])
    } catch (err) {
      console.error("Error loading documents:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, docType: "background_guide" | "position_paper") {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingType(docType)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("conference_id", conferenceId)
      fd.append("doc_type", docType)
      fd.append("title", file.name)
      const committeeId = pendingCommittee[docType]
      if (committeeId && committeeId !== "all") {
        fd.append("committee_id", committeeId)
      }

      const res = await fetch("/api/upload-document", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      alert(t("document_uploaded"))
      await loadData()
    } catch (err) {
      console.error("Upload error:", err)
      alert((err as Error).message)
    } finally {
      setUploadingType(null)
      if (guideInputRef.current) guideInputRef.current.value = ""
      if (paperInputRef.current) paperInputRef.current.value = ""
    }
  }

  async function handleDelete(doc: ConferenceDocument) {
    if (!confirm(t("confirm_delete_document"))) return
    try {
      const { error } = await supabase.from("conference_documents").delete().eq("id", doc.id)
      if (error) throw error
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      console.error("Delete error:", err)
      alert((err as Error).message)
    }
  }

  function committeeName(committeeId: string | null): string | null {
    if (!committeeId) return null
    return committees.find((c) => c.id === committeeId)?.name || null
  }

  function formatSize(bytes: number | null): string {
    if (!bytes) return ""
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  const guides = documents.filter((d) => d.doc_type === "background_guide")
  const papers = documents.filter((d) => d.doc_type === "position_paper")

  function renderDoc(doc: ConferenceDocument) {
    const canDelete = userId && (doc.uploaded_by === userId || isOrganizer)
    const comm = committeeName(doc.committee_id)
    return (
      <div
        key={doc.id}
        className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-background hover:border-primary/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
          <p className="text-xs text-muted-foreground">
            {comm ? `${comm} • ` : ""}
            {formatSize(doc.file_size)}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
            <Download className="w-4 h-4" />
          </a>
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(doc)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Background Guides */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">{t("background_guides")}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t("background_guides_desc")}</p>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : guides.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">{t("no_documents")}</p>
        ) : (
          <div className="space-y-2 mb-3">{guides.map(renderDoc)}</div>
        )}

        {isOrganizer && (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end mt-2">
            {committees.length > 0 && (
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">{t("select_committee_optional")}</Label>
                <Select
                  value={pendingCommittee["background_guide"] || "all"}
                  onValueChange={(v) => setPendingCommittee((p) => ({ ...p, background_guide: v }))}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_committees")}</SelectItem>
                    {committees.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <input
                ref={guideInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="guide-upload"
                onChange={(e) => handleUpload(e, "background_guide")}
                disabled={uploadingType !== null}
              />
              <Button asChild variant="outline" disabled={uploadingType !== null}>
                <label htmlFor="guide-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingType === "background_guide" ? t("uploading_document") : t("upload_guide")}
                </label>
              </Button>
            </div>
          </div>
        )}
        {isOrganizer && <p className="text-xs text-muted-foreground mt-2">{t("file_pdf_doc_only")}</p>}
      </div>

      {/* Position Papers — private submissions, visible only to organizers.
          Delegates upload their own from the dashboard ("My applications"). */}
      {isOrganizer && (
      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">{t("position_papers")}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t("position_papers_desc")}</p>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : papers.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">{t("no_documents")}</p>
        ) : (
          <div className="space-y-2 mb-3">{papers.map(renderDoc)}</div>
        )}

        {userId ? (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end mt-2">
            {committees.length > 0 && (
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">{t("select_committee_optional")}</Label>
                <Select
                  value={pendingCommittee["position_paper"] || "all"}
                  onValueChange={(v) => setPendingCommittee((p) => ({ ...p, position_paper: v }))}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_committees")}</SelectItem>
                    {committees.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <input
                ref={paperInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="paper-upload"
                onChange={(e) => handleUpload(e, "position_paper")}
                disabled={uploadingType !== null}
              />
              <Button asChild variant="outline" disabled={uploadingType !== null}>
                <label htmlFor="paper-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingType === "position_paper" ? t("uploading_document") : t("upload_position_paper")}
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("login_to_upload")}</p>
        )}
        {userId && <p className="text-xs text-muted-foreground mt-2">{t("file_pdf_doc_only")}</p>}
      </div>
      )}
    </div>
  )
}
