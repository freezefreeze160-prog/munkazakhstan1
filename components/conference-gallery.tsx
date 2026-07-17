"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { ImagePlus, Trash2, X } from "lucide-react"

interface Photo {
  id: string
  image_url: string
  caption: string | null
  uploaded_by: string
}

export function ConferenceGallery({
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
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId])

  async function loadPhotos() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from("conference_photos")
        .select("id, image_url, caption, uploaded_by")
        .eq("conference_id", conferenceId)
        .order("created_at", { ascending: false })
      setPhotos(data || [])
    } catch (err) {
      console.error("Error loading photos:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !userId) return
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("folder", "gallery")
        const res = await fetch("/api/upload-blob", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Upload failed")

        const { error } = await supabase.from("conference_photos").insert({
          conference_id: conferenceId,
          image_url: data.url,
          uploaded_by: userId,
        })
        if (error) throw error
      }
      await loadPhotos()
    } catch (err) {
      console.error("Photo upload error:", err)
      alert((err as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleDelete(photo: Photo) {
    if (!confirm(t("confirm_delete_photo"))) return
    try {
      const { error } = await supabase.from("conference_photos").delete().eq("id", photo.id)
      if (error) throw error
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err) {
      console.error("Delete photo error:", err)
      alert((err as Error).message)
    }
  }

  if (loading) return null

  // Hide the whole section if there are no photos and the viewer can't add any
  if (photos.length === 0 && !isOrganizer) return null

  return (
    <div className="border rounded-lg p-5">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">{t("photo_gallery")}</h3>
        </div>
        {isOrganizer && (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="gallery-upload"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild variant="outline" size="sm" disabled={uploading}>
              <label htmlFor="gallery-upload" className="cursor-pointer">
                <ImagePlus className="w-4 h-4 mr-2" />
                {uploading ? t("uploading_photos") : t("add_photos")}
              </label>
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t("photo_gallery_desc")}</p>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no_photos")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={photo.image_url}
                alt={photo.caption || "conference photo"}
                loading="lazy"
                onClick={() => setLightbox(photo)}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              />
              {isOrganizer && (photo.uploaded_by === userId || isOrganizer) && (
                <button
                  onClick={() => handleDelete(photo)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox.image_url}
            alt={lightbox.caption || "conference photo"}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
