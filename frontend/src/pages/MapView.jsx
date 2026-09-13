import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet'
import TopBar from '../components/TopBar.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { usePolling } from '../hooks/usePolling.js'
import api from '../api/client.js'

const STATUS_COLOR = {
  empty: '#33C481', medium: '#F2C230', full: '#F0883E', critical: '#E5484D',
}

export default function MapView() {
  const bins = usePolling(() => api.getBins(), 15000)
  const [showRoute, setShowRoute] = useState(false)
  const route = usePolling(() => showRoute ? api.getOptimizedRoute('full') : Promise.resolve(null), 20000, [showRoute])

  const located = useMemo(() => (bins.data || []).filter(b => b.latitude && b.longitude), [bins.data])
  const center = located.length ? [located[0].latitude, located[0].longitude] : [13.0827, 80.2707]

  const routeLine = useMemo(() => {
    if (!route.data?.stops?.length) return []
    const pts = route.data.stops.map(s => [s.latitude, s.longitude])
    if (route.data.facility) {
      return [[route.data.facility.latitude, route.data.facility.longitude], ...pts, [route.data.facility.latitude, route.data.facility.longitude]]
    }
    return pts
  }, [route.data])

  return (
    <>
      <TopBar liveCount={located.length} lastRefresh={bins.lastUpdated?.toLocaleTimeString()} />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <h1 className="page-title">Bin Map</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>Geographic view of the bin network.</p>
          </div>
          <button className="btn" onClick={() => setShowRoute(v => !v)}>
            {showRoute ? 'Hide Collection Route' : 'Show Collection Route'}
          </button>
        </div>

        {located.length === 0 ? (
          <div className="panel empty-state">No bins with GPS coordinates yet.</div>
        ) : (
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <MapContainer center={center} zoom={12} style={{ height: 560, width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              />
              {located.map(b => (
                <CircleMarker
                  key={b.bin_id}
                  center={[b.latitude, b.longitude]}
                  radius={9}
                  pathOptions={{ color: STATUS_COLOR[b.status] || '#8D9AB8', fillColor: STATUS_COLOR[b.status] || '#8D9AB8', fillOpacity: 0.85, weight: 2 }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{b.bin_id}</div>
                    <div>{b.location}</div>
                    <div>Fill: {b.current_fill_percentage}%</div>
                    <div>Status: {b.status}</div>
                  </Popup>
                </CircleMarker>
              ))}
              {showRoute && routeLine.length > 1 && (
                <Polyline positions={routeLine} pathOptions={{ color: '#F2A93B', weight: 3, dashArray: '6 6' }} />
              )}
            </MapContainer>
          </div>
        )}

        <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <StatusPill status={status} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
