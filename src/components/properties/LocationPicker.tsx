'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  defaultLat?: number
  defaultLng?: number
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 15)
  }, [center, map])
  return null
}

function LocationMarker({ onLocationSelect, position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  const markerRef = useRef<L.Marker>(null)
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker != null) {
        const latlng = marker.getLatLng()
        setPosition(latlng)
        onLocationSelect(latlng.lat, latlng.lng)
      }
    },
  }

  return position === null ? null : (
    <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef} />
  )
}

export default function LocationPicker({ onLocationSelect, defaultLat = 6.5244, defaultLng = 3.3792 }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(new L.LatLng(defaultLat, defaultLng))
  const [mapCenter, setMapCenter] = useState<[number, number]>([defaultLat, defaultLng])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Fetch live autocomplete suggestions from LocationIQ (Free Tier)
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY
        // LocationIQ autocomplete endpoint restricting results to Nigeria (ng)
        const res = await fetch(`https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&countrycodes=ng&limit=5&format=json`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setSuggestions(data)
        } else {
          setSuggestions([])
        }
      } catch (err) {
        console.error("LocationIQ error:", err)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelectSuggestion = (item: any) => {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    const newLatLng = new L.LatLng(lat, lon)
    
    setPosition(newLatLng)
    setMapCenter([lat, lon])
    onLocationSelect(lat, lon)
    setSearchQuery(item.display_name)
    setSuggestions([])
  }

  return (
    <div className="space-y-3">
      {/* Search Input Bar */}
      <div className="relative z-[1000]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search address, street, or landmark..."
          className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:border-[#005C3A] shadow-sm"
        />
        {isSearching && (
          <div className="absolute right-3 top-3 text-xs text-gray-400">Searching...</div>
        )}

        {/* Dropdown Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-[1001]">
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-none truncate"
              >
                📍 {item.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet Map Container */}
      <div className="h-[220px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} />
          <LocationMarker onLocationSelect={onLocationSelect} position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
    </div>
  )
}