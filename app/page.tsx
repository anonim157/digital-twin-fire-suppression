// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import { Model } from '../components/REV1';
import { 
  MapPin, Search, Bell, Settings, ShieldCheck, Thermometer, Wind, 
  CloudFog, Clock, Server, ChevronLeft, Power, MousePointerClick, 
  AlertTriangle, Factory, ShieldAlert, Eye, EyeOff, Menu, X
} from 'lucide-react';

// ============================================================================
// KONFIGURASI AWAL & DATA ASSET
// ============================================================================

const MapWithNoSSR = dynamic(() => import('../components/MapLayer'), { ssr: false });

const initialUnits = [
  { id: 'UNIT-KALTIM-01', name: 'PLTD Batakan', region: 'Kalimantan Timur', coordinates: [-1.2379, 116.8529], status: 'SAFE', sensors: { T: 32.5, CO: 15.2, SM: 0.0 }, lastMaintenance: '2026-05-10', ip: '10.14.22.45' },
  { id: 'UNIT-BDG-04', name: 'PLN Pusharlis Dayeuhkolot', region: 'Bandung, Jawa Barat', coordinates: [-6.9945, 107.6300], status: 'WARNING', sensors: { T: 45.8, CO: 40.5, SM: 5.2 }, lastMaintenance: '2025-11-22', ip: '192.168.180.12' },
  { id: 'UNIT-SMG-02', name: 'Gardu Induk Semarang', region: 'Semarang, Jawa Tengah', coordinates: [-7.0051, 110.4381], status: 'SAFE', sensors: { T: 35.1, CO: 18.4, SM: 0.0 }, lastMaintenance: '2026-06-01', ip: '192.168.1.88' }
];

// ============================================================================
// KOMPONEN UI GLOBAL (REUSABLE)
// ============================================================================

const GlassPanel = ({ children, style, className = "" }) => (
  <div style={{
    background: 'rgba(13, 17, 23, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)', ...style
  }} className={className}>{children}</div>
);

const ProgressBar = ({ value, max, color, label }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#8b949e', fontWeight: '500' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{label}</span>
        <span style={{ color: color, fontWeight: '700', fontFamily: 'monospace', fontSize: '13px' }}>{value.toFixed(1)} <span style={{ opacity: 0.5, fontSize: '10px' }}>/ {max}</span></span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', background: color, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
};

// ============================================================================
// APLIKASI UTAMA (DASHBOARD)
// ============================================================================

export default function EnterpriseDashboard() {
  const [units, setUnits] = useState(initialUnits);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [mapCenter, setMapCenter] = useState([-2.5, 117.5]);
  const [mapZoom, setMapZoom] = useState(5);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState(null);
  const [systemHealth, setSystemHealth] = useState(100);
  const [cameraTarget, setCameraTarget] = useState([0, 0, 0]);

  const [showSearchControls, setShowSearchControls] = useState(true);
  
  // STATE BARU: Deteksi HP dan Menu Mobile
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Fungsi Deteksi Ukuran Layar HP
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile(); // Cek saat pertama kali dimuat
    window.addEventListener('resize', checkMobile); // Cek ulang saat layar diputar/di-resize

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const sensorInterval = setInterval(() => {
      setUnits(prevUnits => prevUnits.map(unit => {
        const tDiff = (Math.random() * 0.6 - 0.3);
        const coDiff = (Math.random() * 1.5 - 0.7);
        const smDiff = unit.status === 'WARNING' ? (Math.random() * 0.5 - 0.2) : 0;
        let newT = Math.max(20, Math.min(80, unit.sensors.T + tDiff));
        let newCO = Math.max(0, Math.min(100, unit.sensors.CO + coDiff));
        let newSM = Math.max(0, Math.min(100, unit.sensors.SM + smDiff));
        
        let newStatus = 'SAFE';
        if (newT > 50 || newCO > 50 || newSM > 10) newStatus = 'DANGER';
        else if (newT > 40 || newCO > 30 || newSM > 2) newStatus = 'WARNING';
        
        return { ...unit, status: newStatus, sensors: { T: newT, CO: newCO, SM: newSM } };
      }));
      setSystemHealth(prev => Math.max(92, Math.min(100, prev + (Math.random() * 2 - 1))));
    }, 2000);
    
    return () => { 
      clearInterval(timeInterval); 
      clearInterval(sensorInterval); 
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const activeUnitData = useMemo(() => selectedUnit ? units.find(u => u.id === selectedUnit.id) : null, [selectedUnit, units]);
  
  const filteredUnits = useMemo(() => units.filter(unit => {
    const matchSearch = unit.name.toLowerCase().includes(searchQuery.toLowerCase()) || unit.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === 'ALL' || unit.status === filterStatus;
    return matchSearch && matchFilter;
  }), [units, searchQuery, filterStatus]);

  const handleUnitSelect = (unit) => {
    setMapCenter(unit.coordinates);
    setMapZoom(16);
    setShowMobileMenu(false); // Tutup sidebar otomatis saat lokasi dipilih (khusus HP)
    setTimeout(() => {
      setSelectedUnit(unit);
      setActivePanelIndex(null); 
      setCameraTarget([0, 0, 0]); 
    }, 1800); 
  };

  const handleBackToMap = () => {
    setSelectedUnit(null);
    setActivePanelIndex(null);
    setCameraTarget([0, 0, 0]);
    setMapZoom(5);
    setMapCenter([-2.5, 117.5]);
  };

  const handlePanelClick = (e, index, position) => {
    e.stopPropagation(); 
    if (activePanelIndex === index) {
      setActivePanelIndex(null);
      setCameraTarget([0, 0, 0]); 
    } else {
      setActivePanelIndex(index);
      setCameraTarget(position); 
    }
  };

  const getStatusColor = (status) => {
    if (status === 'SAFE') return '#10b981';   
    if (status === 'WARNING') return '#f59e0b'; 
    return '#ef4444';                           
  };

  // ============================================================================
  // RENDER SECTIONS
  // ============================================================================

  const renderHeader = () => (
    <header style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0d1117', display: 'flex', alignItems: 'center', padding: isMobile ? '0 16px' : '0 24px', justifyContent: 'space-between', zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Tombol Hamburger Menu (Hanya Muncul di HP) */}
        {isMobile && (
          <Menu 
            size={24} 
            color="#f0f6fc" 
            style={{ cursor: 'pointer', marginRight: '8px' }} 
            onClick={() => setShowMobileMenu(true)} 
          />
        )}

        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo-digibot.png" alt="DigiBot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        
        {/* Sembunyikan Judul Text di HP agar tidak sumpek */}
        {!isMobile && (
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#f0f6fc' }}>DIGITAL TWIN</h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Enterprise Fire Suppression</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '16px' : '24px' }}>
        
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8b949e', fontWeight: '600' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: systemHealth > 95 ? '#10b981' : '#f59e0b', boxShadow: `0 0 10px ${systemHealth > 95 ? '#10b981' : '#f59e0b'}` }} />
            NET: {systemHealth.toFixed(1)}%
          </div>
        )}

        {/* Sembunyikan Jam di HP */}
        {!isMobile && mounted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#8b949e', background: '#161b22', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Clock size={16} color="#10b981" />
            <span style={{ fontWeight: '500' }}>{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span style={{ color: '#30363d' }}>|</span>
            <span style={{ color: '#f0f6fc', fontWeight: '700', width: '65px', textAlign: 'center', display: 'inline-block', fontFamily: 'monospace', fontSize: '14px' }}>{currentTime.toLocaleTimeString('id-ID')}</span>
          </div>
        )}
        
        {!isMobile && <div style={{ width: '1px', height: '24px', background: '#30363d' }} />}
        
        <Bell size={18} color="#8b949e" style={{ cursor: 'pointer' }} />
        {!isMobile && <Settings size={18} color="#8b949e" style={{ cursor: 'pointer' }} />}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#21262d', border: '2px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', color: '#c9d1d9' }}>DA</div>
        </div>
      </div>
    </header>
  );

  const renderSidebar = () => (
    <aside style={{ 
      width: isMobile ? '85%' : '320px', // Di HP lebarnya 85% layaknya laci Android
      maxWidth: '350px',
      position: isMobile ? 'absolute' : 'relative',
      left: 0, top: 0, bottom: 0,
      background: '#0d1117', 
      borderRight: '1px solid rgba(255,255,255,0.08)', 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 60, // Harus di atas peta pada versi Mobile
      transform: isMobile ? (showMobileMenu ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isMobile && showMobileMenu ? '10px 0 30px rgba(0,0,0,0.5)' : 'none'
    }}>
      
      <div style={{ padding: '15px 20px 5px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 'bold', letterSpacing: '1px' }}>SYSTEM REGISTRY</span>
        
        {/* Tombol Tutup/X hanya untuk Mobile, Tombol Hide Search untuk Desktop */}
        {isMobile ? (
          <X size={22} color="#8b949e" onClick={() => setShowMobileMenu(false)} style={{ cursor: 'pointer' }} />
        ) : (
          <button 
            onClick={() => setShowSearchControls(!showSearchControls)} 
            style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '11px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', outline: 'none' }}
          >
            {showSearchControls ? <><EyeOff size={12} /> Hide Search</> : <><Eye size={12} /> Show Search</>}
          </button>
        )}
      </div>

      {(showSearchControls || isMobile) && (
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} color="#8b949e" style={{ position: 'absolute', left: '14px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="Search Asset ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#010409', border: '1px solid #30363d', color: '#f0f6fc', padding: '10px 10px 10px 38px', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'SAFE', 'WARNING', 'DANGER'].map(status => (
              <button 
                key={status} onClick={() => setFilterStatus(status)}
                style={{ flex: 1, padding: '8px 0', fontSize: '10px', fontWeight: '700', background: filterStatus === status ? '#21262d' : 'transparent', color: filterStatus === status ? '#f0f6fc' : '#8b949e', border: filterStatus === status ? '1px solid #30363d' : '1px solid transparent', borderRadius: '6px' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '11px', color: '#8b949e', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '4px' }}>DEPLOYED UNITS ({filteredUnits.length})</div>
        
        {filteredUnits.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8b949e', fontSize: '13px', marginTop: '30px' }}>No units match current filter.</div>
        ) : (
          filteredUnits.map(unit => {
            const color = getStatusColor(unit.status);
            const isActive = selectedUnit?.id === unit.id;
            return (
              <div 
                key={unit.id} onClick={() => handleUnitSelect(unit)}
                style={{ background: isActive ? '#161b22' : '#010409', border: `1px solid ${isActive ? color : '#30363d'}`, borderRadius: '10px', padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '70%' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#f0f6fc' }}>{unit.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8b949e' }}><MapPin size={12} /> {unit.region}</div>
                  </div>
                  <div style={{ background: `${color}15`, color: color, padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', border: `1px solid ${color}40` }}>
                    {unit.status}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  );

  const render3DViewport = () => (
    <section style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* Background Gelap penutup Peta saat menu Mobile Terbuka */}
      {isMobile && showMobileMenu && (
        <div 
          onClick={() => setShowMobileMenu(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 55, backdropFilter: 'blur(3px)' }} 
        />
      )}

      {activeUnitData && (
        <div style={{ position: 'absolute', top: isMobile ? 16 : 24, left: isMobile ? 16 : 24, zIndex: 10 }}>
          <button onClick={handleBackToMap} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(13, 17, 23, 0.8)', color: '#f0f6fc', border: '1px solid #30363d', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
            <ChevronLeft size={18} /> {isMobile ? 'Back' : 'Global Map View'}
          </button>
        </div>
      )}

      {activeUnitData && activePanelIndex === null && (
        <div style={{ position: 'absolute', bottom: isMobile ? 40 : 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '10px 20px', borderRadius: '30px', fontSize: isMobile ? '11px' : '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'none', animation: 'pulse 2s infinite' }}>
          <MousePointerClick size={18} /> {isMobile ? 'Tap a module to view telemetry' : 'Select a physical module to establish telemetry uplink'}
        </div>
      )}

      <div style={{ flex: 1, position: 'relative' }}>
        {!activeUnitData ? (
          <MapWithNoSSR onSelectUnit={handleUnitSelect} activeCenter={mapCenter} activeZoom={mapZoom} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #e2e8f0 0%, #94a3b8 100%)' }}>
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 42 }}>
              <Suspense fallback={<Html center><div style={{ color: '#1e293b', fontFamily: 'monospace', fontWeight: '800' }}>BOOTING 3D ENGINE...</div></Html>}>
                
                <ambientLight intensity={1.8} />
                <directionalLight position={[10, 20, 10]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} />
                <directionalLight position={[-10, 10, -10]} intensity={1} color="#e0f2fe" />
                <Environment preset="warehouse" />
                <ContactShadows position={[0, -0.1, 0]} opacity={0.6} scale={20} blur={2.5} far={15} color="#334155" />

                <group onPointerMissed={() => { setActivePanelIndex(null); setCameraTarget([0, 0, 0]); }}>
                  <Model position={[-1.5, 0, -1.5]} rotation={[0, 0, 0]} sensorData={activeUnitData.sensors} showLabels={activePanelIndex === 0} scale={activePanelIndex === 0 ? 1.35 : 1} onClick={(e) => handlePanelClick(e, 0, [-1.5, 0, -1.5])} />
                  <Model position={[1.5, 0, -1.5]} rotation={[0, 0, 0]} sensorData={activeUnitData.sensors} showLabels={activePanelIndex === 1} scale={activePanelIndex === 1 ? 1.35 : 1} onClick={(e) => handlePanelClick(e, 1, [1.5, 0, -1.5])} />
                  <Model position={[-1.5, 0, 1.5]} rotation={[0, 0, 0]} sensorData={activeUnitData.sensors} showLabels={activePanelIndex === 2} scale={activePanelIndex === 2 ? 1.35 : 1} onClick={(e) => handlePanelClick(e, 2, [-1.5, 0, 1.5])} />
                  <Model position={[1.5, 0, 1.5]} rotation={[0, 0, 0]} sensorData={activeUnitData.sensors} showLabels={activePanelIndex === 3} scale={activePanelIndex === 3 ? 1.35 : 1} onClick={(e) => handlePanelClick(e, 3, [1.5, 0, 1.5])} />
                </group>
              </Suspense>
              
              <OrbitControls 
                makeDefault autoRotate={false} target={cameraTarget} 
                maxPolarAngle={Math.PI / 2.1} minDistance={1} maxDistance={25} enableDamping dampingFactor={0.05} 
              />
            </Canvas>
          </div>
        )}
      </div>
    </section>
  );

  const renderRightPanel = () => {
    if (!activeUnitData || activePanelIndex === null) return null;
    return (
      <aside style={{ 
        width: isMobile ? '100%' : '400px', 
        position: isMobile ? 'absolute' : 'relative',
        bottom: isMobile ? 0 : 'auto', // Di HP menempel di bawah
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 0,
        height: isMobile ? '70%' : '100%', // Di HP mengisi 70% layar bawah
        background: '#0d1117', 
        borderLeft: '1px solid rgba(255,255,255,0.08)', 
        borderTop: isMobile ? '2px solid #30363d' : 'none',
        borderTopLeftRadius: isMobile ? '24px' : '0',
        borderTopRightRadius: isMobile ? '24px' : '0',
        padding: '24px', 
        overflowY: 'auto', 
        zIndex: 50, 
        animation: isMobile ? 'slideUp 0.3s ease-out' : 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
      }}>
        
        {/* Tombol Tutup Khusus Mobile */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '5px', background: '#30363d', borderRadius: '10px' }} />
            <X size={24} color="#8b949e" style={{ position: 'absolute', right: '20px', top: '20px' }} onClick={() => setActivePanelIndex(null)} />
          </div>
        )}

        <GlassPanel style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#f0f6fc', fontWeight: '800' }}>{activeUnitData.name}</h2>
              <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Factory size={14} /> MODULE {activePanelIndex + 1}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>
              {activeUnitData.status === 'SAFE' ? <ShieldCheck size={26} color="#10b981" /> : <ShieldAlert size={26} color="#ef4444"/>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px', color: '#8b949e', borderTop: '1px solid #30363d', paddingTop: '16px' }}>
            <div><Server size={12} style={{display:'inline', marginRight:'4px'}}/> {activeUnitData.ip}</div>
            <div><strong>ID:</strong> {activeUnitData.id}</div>
          </div>
        </GlassPanel>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
          <h3 style={{ margin: 0, fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Live Stream Telemetry</h3>
        </div>
        <GlassPanel style={{ padding: '24px', marginBottom: '24px' }}>
          <ProgressBar label={<><Thermometer size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'6px'}}/> Chamber Temperature</>} value={activeUnitData.sensors.T} max={100} color={activeUnitData.sensors.T > 50 ? '#ef4444' : activeUnitData.sensors.T > 40 ? '#f59e0b' : '#10b981'} />
          <ProgressBar label={<><Wind size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'6px'}}/> Carbon Monoxide (CO)</>} value={activeUnitData.sensors.CO} max={100} color={activeUnitData.sensors.CO > 50 ? '#ef4444' : activeUnitData.sensors.CO > 30 ? '#f59e0b' : '#10b981'} />
          <ProgressBar label={<><CloudFog size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'6px'}}/> Particle Smoke Density</>} value={activeUnitData.sensors.SM} max={100} color={activeUnitData.sensors.SM > 10 ? '#ef4444' : activeUnitData.sensors.SM > 2 ? '#f59e0b' : '#10b981'} />
        </GlassPanel>

        <h3 style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontWeight: '700' }}>Event Matrix</h3>
        <GlassPanel style={{ padding: '20px', marginBottom: '24px', height: '180px', overflowY: 'hidden', position: 'relative', background: '#010409' }}>
          <div style={{ fontSize: '12px', fontFamily: '"SF Mono", "Fira Code", monospace', color: '#8b949e', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ color: '#10b981', display: 'flex', gap: '8px' }}><span>[{currentTime.toLocaleTimeString()}]</span> <span>Heartbeat ACK received</span></div>
            <div style={{ display: 'flex', gap: '8px' }}><span>[{new Date(currentTime.getTime() - 2000).toLocaleTimeString()}]</span> <span>Validating valve continuity...</span></div>
            <div style={{ display: 'flex', gap: '8px' }}><span>[{new Date(currentTime.getTime() - 8000).toLocaleTimeString()}]</span> <span>Telemetry stream synced</span></div>
            {activeUnitData.status !== 'SAFE' ? (
              <div style={{ color: '#f59e0b', display: 'flex', gap: '8px' }}><span>[{currentTime.toLocaleTimeString()}]</span> <span><AlertTriangle size={12} style={{display:'inline'}}/> SENSOR THRESHOLD ANOMALY</span></div>
            ) : (
              <div style={{ color: '#30363d', display: 'flex', gap: '8px' }}><span>[{new Date(currentTime.getTime() - 25000).toLocaleTimeString()}]</span> <span>System nominal</span></div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(transparent, #010409)' }}/>
        </GlassPanel>

        <h3 style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', fontWeight: '700' }}>Critical Override</h3>
        <button style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '18px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '15px', fontWeight: '800', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'inset 0 0 15px rgba(239, 68, 68, 0.15)' }}>
          <Power size={20} /> INITIATE SUPPRESSION
        </button>
      </aside>
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#010409', color: '#c9d1d9', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      {renderHeader()}
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {renderSidebar()}
        {render3DViewport()}
        {renderRightPanel()}
      </div>

      {/* COPYRIGHT WATERMARK (Disesuaikan posisinya di HP) */}
      <div style={{
        position: 'absolute', 
        bottom: '12px', 
        right: isMobile ? '12px' : (activePanelIndex !== null ? '420px' : '20px'), 
        zIndex: 100,
        fontSize: '10px',
        fontWeight: 'bold',
        color: 'rgba(0,0,0, 0.3)', 
        letterSpacing: '1.5px',
        pointerEvents: 'none',
        transition: 'right 0.4s ease'
      }}>
        © CREATED BY DICKY ARDIANSYAH
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #8b949e; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { 
          0% { transform: translateX(100%); opacity: 0; filter: blur(5px); } 
          100% { transform: translateX(0); opacity: 1; filter: blur(0); } 
        }
        @keyframes slideUp { 
          0% { transform: translateY(100%); opacity: 0; } 
          100% { transform: translateY(0); opacity: 1; } 
        }
        @keyframes pulse { 
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } 
        }
      `}} />
    </div>
  );
}