"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import Link from "next/link"
import { KAZAKHSTAN_CENTER, KAZAKHSTAN_DEFAULT_ZOOM } from "@/lib/city-coordinates"

export interface MapConference {
  id: string
  name: string
  date: string
}

export interface MapCityGroup {
  region: number
  cityName: string
  lat: number
  lng: number
  conferences: MapConference[]
}

function makeIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: #006633;
        color: #fff;
        border: 2px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        font-weight: 700;
        font-size: 13px;
      ">
        <span style="transform: rotate(45deg);">${count}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  })
}

export default function ConferencesMapInner({
  cityGroups,
  labels,
}: {
  cityGroups: MapCityGroup[]
  labels: { conferences: string; learnMore: string }
}) {
  return (
    <MapContainer
      center={[KAZAKHSTAN_CENTER.lat, KAZAKHSTAN_CENTER.lng]}
      zoom={KAZAKHSTAN_DEFAULT_ZOOM}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cityGroups.map((group) => (
        <Marker key={group.region} position={[group.lat, group.lng]} icon={makeIcon(group.conferences.length)}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>
                {group.cityName}
                <span style={{ fontWeight: 400, color: "#666" }}>
                  {" "}
                  · {group.conferences.length} {labels.conferences}
                </span>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {group.conferences.map((conf) => (
                  <li key={conf.id}>
                    <Link
                      href={`/conferences/${conf.id}`}
                      style={{ color: "#006633", fontWeight: 600, textDecoration: "none" }}
                    >
                      {conf.name}
                    </Link>
                    {conf.date && <div style={{ fontSize: 12, color: "#666" }}>{conf.date}</div>}
                  </li>
                ))}
              </ul>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
