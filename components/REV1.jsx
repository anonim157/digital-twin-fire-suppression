import React, { useState } from 'react';
import { useGLTF, Html, Clone } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';

export function Model({ sensorData, showLabels, scale = 1, ...props }) {
  const { scene } = useGLTF('/REV1.glb');
  const [hovered, setHovered] = useState(false);
  
  // Animasi perbesaran mekanis yang sangat mulus
  const { animatedScale } = useSpring({
    animatedScale: scale,
    config: { mass: 1.2, tension: 180, friction: 22 }
  });
  
  // UI Hologram 3D Panel
  const HologramPanel = ({ title, value, unit, color }) => (
    <div style={{
      background: 'rgba(5, 8, 12, 0.85)',
      border: `2px solid ${color}`,
      padding: '8px 16px',
      borderRadius: '6px',
      color: '#fff',
      fontFamily: '"SF Mono", "Fira Code", monospace',
      boxShadow: `0 0 25px ${color}55, inset 0 0 10px ${color}33`,
      pointerEvents: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '90px',
      height: '75px',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ fontSize: '11px', color: '#8b949e', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '4px' }}>
        {title}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '900', color: color, textShadow: `0 0 15px ${color}` }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
      <div style={{ fontSize: '10px', color: color, opacity: 0.8, marginTop: '2px' }}>
        {unit}
      </div>
    </div>
  );

  // Logika Ambang Batas Warna (Thresholds)
  const tColor = sensorData?.T > 50 ? '#ef4444' : sensorData?.T > 40 ? '#f59e0b' : '#10b981';
  const coColor = sensorData?.CO > 50 ? '#ef4444' : sensorData?.CO > 30 ? '#f59e0b' : '#10b981';
  const smColor = sensorData?.SM > 10 ? '#ef4444' : sensorData?.SM > 2 ? '#f59e0b' : '#10b981';

  return (
    <a.group 
      scale={animatedScale} 
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      {...props}
    >
      {/* Box Indikator Sorotan */}
      {hovered && !showLabels && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 1, 1]} />
          <meshBasicMaterial color="#10b981" wireframe opacity={0.4} transparent />
        </mesh>
      )}

      {/* Render Model GLB */}
      <Clone object={scene} />
      
      {/* Render Hologram Data jika Panel Sedang Aktif */}
      {showLabels && (
        <group position={[0, 0.6, 0]}> 
          {/* distanceFactor=4 membuat skala layar menyesuaikan ruang 3D */}
          <Html transform sprite center position={[-0.7, 0, 0]} distanceFactor={4}>
            <HologramPanel title="TEMP" value={sensorData?.T} unit="°C" color={tColor} />
          </Html>
          
          <Html transform sprite center position={[0, 0, 0]} distanceFactor={4}>
            <HologramPanel title="CARBON" value={sensorData?.CO} unit="PPM" color={coColor} />
          </Html>
          
          <Html transform sprite center position={[0.7, 0, 0]} distanceFactor={4}>
            <HologramPanel title="SMOKE" value={sensorData?.SM} unit="%" color={smColor} />
          </Html>
        </group>
      )}
    </a.group>
  );
}

useGLTF.preload('/REV1.glb');