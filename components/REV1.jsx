import React from 'react';
import { useGLTF } from '@react-three/drei';

export function Model(props) {
  // Kita ambil seluruh 'scene' tanpa memanggil nama node satu per satu
  // Ini mencegah error "undefined geometry" 100%
  const { scene } = useGLTF('/REV1.glb');
  
  return (
    <primitive object={scene} {...props} />
  );
}

useGLTF.preload('/REV1.glb');