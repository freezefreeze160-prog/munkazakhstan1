"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { awardLabelKey, type AwardType } from "@/lib/awards"
import { Award as AwardIcon, Upload, Download, Save } from "lucide-react"

interface TemplateConfig {
  template_url: string
  name_x: number
  name_y: number
  font_size: number
  text_color: string
  show_subtitle: boolean
}

const DEFAULT_CONFIG: Omit<TemplateConfig, "template_url"> = {
  name_x: 0.5,
  name_y: 0.5,
  font_size: 0.06,
  text_color: "#1a1a1a",
  show_subtitle: true,
}

function drawCertificate(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  cfg: TemplateConfig,
  name: string,
  subtitle: string,
) {
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const fontPx = Math.max(8, cfg.font_size * canvas.height)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = cfg.text_color
  ctx.font = `700 ${fontPx}px Georgia, 'Times New Roman', serif`
  ctx.fillText(name, cfg.name_x * canvas.width, cfg.name_y * canvas.height)

  if (cfg.show_subtitle && subtitle) {
    ctx.font = `400 ${fontPx * 0.5}px Georgia, 'Times New Roman', serif`
    ctx.fillText(subtitle, cfg.name_x * canvas.width, cfg.name_y * canvas.height + fontPx * 1.1)
  }
}

export function ConferenceCertificate({
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
  const [loading, setLoading] = useState(true)
  const [templateUrl, setTemplateUrl] = useState<string | null>(null)
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [myName, setMyName] = useState<string | null>(null)
  const [mySubtitle, setMySubtitle] = useState<string>("")
  const imgRef = useRef<HTMLImageElement | null>(null)
  const previewRef = useRef<HTMLCanvasElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const loadState = useCallback(async () => {
    try {
      setLoading(true)
      const { data: tpl } = await supabase
        .from("certificate_templates")
        .select("*")
        .eq("conference_id", conferenceId)
        .maybeSingle()

      if (tpl) {
        setTemplateUrl(tpl.template_url)
        setConfig({
          name_x: tpl.name_x,
          name_y: tpl.name_y,
          font_size: tpl.font_size,
          text_color: tpl.text_color,
          show_subtitle: tpl.show_subtitle,
        })
      }

      if (userId) {
        const [appRes, awardRes] = await Promise.all([
          supabase
            .from("delegate_applications")
            .select("full_name, status")
            .eq("conference_id", conferenceId)
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("conference_awards")
            .select("award_type")
            .eq("conference_id", conferenceId)
            .eq("user_id", userId)
            .maybeSingle(),
        ])
        if (appRes.data?.status === "approved") {
          setMyName(appRes.data.full_name || null)
        }
        if (awardRes.data?.award_type) {
          setMySubtitle(t(awardLabelKey(awardRes.data.award_type as AwardType) as never))
        } else {
          setMySubtitle(t("participant"))
        }
      }
    } catch (err) {
      console.error("Error loading certificate:", err)
    } finally {
      setLoading(false)
    }
  }, [conferenceId, userId, supabase, t])

  useEffect(() => {
    loadState()
  }, [loadState])

  // (Re)load the template image whenever the URL changes
  useEffect(() => {
    if (!templateUrl) {
      imgRef.current = null
      return
    }
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imgRef.current = img
      renderPreview()
    }
    img.src = templateUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateUrl])

  const renderPreview = useCallback(() => {
    if (!isOrganizer || !imgRef.current || !previewRef.current || !templateUrl) return
    drawCertificate(
      previewRef.current,
      imgRef.current,
      { ...config, template_url: templateUrl },
      myName || "Aidana Nurlan",
      config.show_subtitle ? mySubtitle || t("participant") : "",
    )
  }, [config, isOrganizer, myName, mySubtitle, t, templateUrl])

  useEffect(() => {
    renderPreview()
  }, [renderPreview])

  async function handleUploadTemplate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "certificates")
      const res = await fetch("/api/upload-blob", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      const { error } = await supabase.from("certificate_templates").upsert(
        {
          conference_id: conferenceId,
          template_url: data.url,
          ...config,
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "conference_id" },
      )
      if (error) throw error
      setTemplateUrl(data.url)
    } catch (err) {
      console.error("Template upload error:", err)
      alert((err as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function saveConfig() {
    if (!templateUrl || !userId) return
    setSaving(true)
    try {
      const { error } = await supabase.from("certificate_templates").upsert(
        {
          conference_id: conferenceId,
          template_url: templateUrl,
          ...config,
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "conference_id" },
      )
      if (error) throw error
      alert(t("certificate_saved"))
    } catch (err) {
      console.error("Save config error:", err)
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function downloadCertificate() {
    if (!imgRef.current || !templateUrl || !myName) return
    const canvas = document.createElement("canvas")
    drawCertificate(
      canvas,
      imgRef.current,
      { ...config, template_url: templateUrl },
      myName,
      config.show_subtitle ? mySubtitle : "",
    )
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Could not generate certificate")
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificate-${myName.replace(/\s+/g, "_")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, "image/png")
  }

  if (loading) return null
  // Nothing to show for a plain visitor with no template
  if (!isOrganizer && !templateUrl) return null
  if (!isOrganizer && !myName) return null // only approved delegates get a certificate

  return (
    <div className="border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <AwardIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">{t("certificate")}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isOrganizer ? t("certificate_desc") : ""}
      </p>

      {/* Delegate view: download button */}
      {!isOrganizer && (
        <>
          {templateUrl && myName ? (
            <Button onClick={downloadCertificate} className="bg-[#006633] hover:bg-[#004d26]">
              <Download className="w-4 h-4 mr-2" />
              {t("download_certificate")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t("no_certificate_yet")}</p>
          )}
          {/* Hidden image loader for rendering */}
        </>
      )}

      {/* Organizer view: upload + configure + preview */}
      {isOrganizer && (
        <div className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              id="cert-template-upload"
              onChange={handleUploadTemplate}
              disabled={uploading}
            />
            <Button asChild variant="outline" size="sm" disabled={uploading}>
              <label htmlFor="cert-template-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? t("uploading") : templateUrl ? t("replace_template") : t("upload_certificate_template")}
              </label>
            </Button>
          </div>

          {templateUrl && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label className="text-xs">{t("name_position_x")}</Label>
                  <Input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(config.name_x * 100)}
                    onChange={(e) => setConfig((c) => ({ ...c, name_x: Number(e.target.value) / 100 }))}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t("name_position_y")}</Label>
                  <Input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(config.name_y * 100)}
                    onChange={(e) => setConfig((c) => ({ ...c, name_y: Number(e.target.value) / 100 }))}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t("font_size_label")}</Label>
                  <Input
                    type="range"
                    min={2}
                    max={15}
                    value={Math.round(config.font_size * 100)}
                    onChange={(e) => setConfig((c) => ({ ...c, font_size: Number(e.target.value) / 100 }))}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t("text_color_label")}</Label>
                  <input
                    type="color"
                    value={config.text_color}
                    onChange={(e) => setConfig((c) => ({ ...c, text_color: e.target.value }))}
                    className="h-9 w-full rounded-md border bg-background cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={config.show_subtitle}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, show_subtitle: !!v }))}
                />
                {t("show_subtitle_label")}
              </label>

              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("certificate_preview")}</p>
                <canvas
                  ref={previewRef}
                  className="max-w-full h-auto border rounded-lg"
                  style={{ maxHeight: 360 }}
                />
              </div>

              <Button onClick={saveConfig} disabled={saving} className="bg-[#006633] hover:bg-[#004d26]">
                <Save className="w-4 h-4 mr-2" />
                {saving ? t("saving") : t("save")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
