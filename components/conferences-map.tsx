"use client"

import dynamic from "next/dynamic"
import type { MapCityGroup } from "@/components/conferences-map-inner"

const ConferencesMapInner = dynamic(() => import("@/components/conferences-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/40">
      <span className="text-muted-foreground text-sm">…</span>
    </div>
  ),
})

export function ConferencesMap({
  cityGroups,
  labels,
}: {
  cityGroups: MapCityGroup[]
  labels: { conferences: string; learnMore: string }
}) {
  return <ConferencesMapInner cityGroups={cityGroups} labels={labels} />
}
