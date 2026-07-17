// Latitude / longitude for each region (city) used across the app.
// Keys match the region numbers in lib/roles.ts.
export const CITY_COORDINATES: Record<number, { lat: number; lng: number }> = {
  1: { lat: 43.238, lng: 76.889 }, // Almaty
  2: { lat: 51.169, lng: 71.449 }, // Astana
  3: { lat: 42.317, lng: 69.59 }, // Shymkent
  18: { lat: 50.411, lng: 80.227 }, // Semey
  19: { lat: 53.284, lng: 69.386 }, // Kokshetau
  20: { lat: 45.017, lng: 78.374 }, // Taldykorgan
  21: { lat: 51.233, lng: 51.367 }, // Uralsk
  22: { lat: 49.948, lng: 82.628 }, // Ust-Kamenogorsk
  23: { lat: 50.283, lng: 57.167 }, // Aktobe
  24: { lat: 49.807, lng: 73.085 }, // Karaganda
  25: { lat: 42.9, lng: 71.367 }, // Taraz
  26: { lat: 44.848, lng: 65.482 }, // Kyzylorda
  27: { lat: 52.287, lng: 76.967 }, // Pavlodar
  28: { lat: 47.117, lng: 51.883 }, // Atyrau
  29: { lat: 53.214, lng: 63.632 }, // Kostanay
  30: { lat: 54.867, lng: 69.15 }, // Petropavlovsk
  31: { lat: 43.641, lng: 51.198 }, // Aktau
  32: { lat: 43.297, lng: 68.252 }, // Turkestan
}

// Center of Kazakhstan for the initial map view.
export const KAZAKHSTAN_CENTER: { lat: number; lng: number } = { lat: 48.0, lng: 68.0 }
export const KAZAKHSTAN_DEFAULT_ZOOM = 5
