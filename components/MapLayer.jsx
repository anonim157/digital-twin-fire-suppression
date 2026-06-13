"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fireSuppressionUnits } from '../data/locations';

// Membuat icon kustom berbentuk radar berkedip ala Enterprise
const createCustomIcon = (status) => {
  const color = status === 'WARNING' ? '#ff3333' : '#00FFCC';
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="
      background-color: ${color};
      width: 15px; height: 15px;
      border-radius: 50%;
      box-shadow: 0 0 15px ${color};
      border: 2px solid white;
    "></div>`,
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
  });
};

// Komponen cerdas untuk otomatis zoom ke lokasi yang diklik
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function MapLayer({ onSelectUnit, activeCenter, activeZoom }) {
  const [isNight, setIsNight] = useState(true); // Default malam sebelum dicek

  // Efek untuk mengecek waktu lokal pengguna saat peta pertama kali dimuat
  useEffect(() => {
    const currentHour = new Date().getHours();
    // Dianggap malam jika jam 18 (6 sore) ke atas, atau di bawah jam 6 pagi
    if (currentHour >= 18 || currentHour < 6) {
      setIsNight(true);
    } else {
      setIsNight(false);
    }
  }, []);

  // URL Peta Siang (Carto Voyager - Terang & Bersih)
  const lightMap = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  
  // URL Peta Malam (Carto Dark Matter - Gelap dengan kontras jalan/lampu kota)
  const darkMap = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer 
        center={[-2.5, 117.5]} // Titik tengah Indonesia
        zoom={5} 
        style={{ height: '100%', width: '100%', background: isNight ? '#0a0a0a' : '#aad3df' }}
        zoomControl={false}
      >
        {/* Layer peta akan berubah otomatis mengikuti isNight */}
        <TileLayer
          key={isNight ? "night" : "day"} // Kunci agar layer me-refresh saat ganti tema
          url={isNight ? darkMap : lightMap}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        <MapController center={activeCenter} zoom={activeZoom} />

        {fireSuppressionUnits.map((unit) => (
          <Marker 
            key={unit.id} 
            position={unit.coordinates} 
            icon={createCustomIcon(unit.status)}
            eventHandlers={{
              click: () => onSelectUnit(unit),
            }}
          >
            <Popup className="custom-popup">
              <div style={{ color: '#333', fontWeight: 'bold' }}>{unit.name}</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Klik PIN untuk membuka 3D Digital Twin</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}