"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Html } from '@react-three/drei';
import { Suspense } from 'react';
import { Model } from '../components/REV1';

export default function IIoTDashboard() {
  return (
    <main style={{ width: '100vw', height: '100vh', backgroundColor: '#111111', position: 'relative' }}>
      
      {/* Teks UI Dashboard */}
      <div style={{ position: 'absolute', top: 30, left: 40, zIndex: 10, fontFamily: 'sans-serif' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#00FFCC', letterSpacing: '1px' }}>
          DIGITAL TWIN - CONTROL TOWER
        </h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#A0A0A0' }}>
          Real-Time Fire Protection & Early Warning System
        </p>
      </div>

      {/* Kanvas 3D */}
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        
        {/* Loading indicator jika file 3D agak besar */}
        <Suspense fallback={
          <Html center>
            <div style={{ color: '#00FFCC', fontFamily: 'monospace' }}>Memuat Panel...</div>
          </Html>
        }>
          
          {/* Stage akan otomatis: 
              1. Mengatur skala model agar pas di layar
              2. Menaruh model pas di titik tengah
              3. Memberikan pencahayaan studio/city yang natural */}
          <Stage environment="city" intensity={0.8} adjustCamera={1.2}>
            <Model />
          </Stage>

        </Suspense>

        {/* Mouse control: autoRotate akan memutar panel perlahan agar keren */}
        <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />
        
      </Canvas>
    </main>
  );
}