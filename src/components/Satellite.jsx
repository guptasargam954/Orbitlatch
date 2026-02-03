import React, { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color } from 'three';

// Procedural detailed satellite model
export const Satellite = forwardRef(({ connected, status, rssi }, ref) => {
    const ringRef = useRef();

    useFrame(({ clock, camera }) => {
        if (ringRef.current) {
            // Tighter, sleeker pulse
            const s = 1.05 + Math.sin(clock.getElapsedTime() * 10) * 0.08;
            ringRef.current.scale.set(s, s, s);
            ringRef.current.lookAt(camera.position);
        }
    });

    return (
        <group ref={ref}>
            {/* Connected Highlight (Sleek Neon Halo) */}
            {connected && (
                <group ref={ringRef}>
                    {/* Inner Sharp Halo */}
                    <mesh>
                        <ringGeometry args={[0.45, 0.48, 64]} />
                        <meshBasicMaterial color="#00ff00" transparent opacity={0.9} toneMapped={false} />
                    </mesh>
                    {/* Outer Soft Glow Ring */}
                    <mesh>
                        <ringGeometry args={[0.42, 0.55, 64]} />
                        <meshBasicMaterial color="#00ff00" transparent opacity={0.15} toneMapped={false} />
                    </mesh>
                    {/* Micro Beacon */}
                    <mesh>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshBasicMaterial color="#00ff00" toneMapped={false} />
                    </mesh>
                </group>
            )}

            {/* Satellite Bus (Main Body) */}
            <mesh>
                <boxGeometry args={[0.3, 0.4, 0.3]} />
                <meshStandardMaterial
                    color={status === 'failure' ? '#444' : '#ffd700'} // Gold foil
                    metalness={0.9}
                    roughness={0.1}
                    emissive={status === 'failure' ? new Color(0.5, 0, 0) : new Color(0, 0, 0)}
                />
            </mesh>

            {/* Solar Panels (Port & Starboard) */}
            <group position={[0, 0, 0]}>
                {/* Left Panel */}
                <mesh position={[-0.6, 0, 0]}>
                    <boxGeometry args={[0.8, 0.25, 0.02]} />
                    <meshStandardMaterial color="#003366" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Right Panel */}
                <mesh position={[0.6, 0, 0]}>
                    <boxGeometry args={[0.8, 0.25, 0.02]} />
                    <meshStandardMaterial color="#003366" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>

            {/* Communications Dish (Bottom) */}
            <mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.15, 0.2, 16]} />
                <meshStandardMaterial color="#888" metalness={0.7} />
            </mesh>

            {/* Instrument Module (Top) */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.1, 16]} />
                <meshStandardMaterial color="#999" />
            </mesh>

            {/* Failure visual indicator */}
            {status === 'failure' && (
                <pointLight intensity={1} distance={2} color="red" />
            )}
        </group>
    );
});

// Targeted Beam Component (Laser Style)
export const TargetedBeam = ({ startPos, endPos, color }) => {
    const meshRef = useRef();

    useFrame(() => {
        if (!meshRef.current || !startPos || !endPos) return;

        const direction = new Vector3().subVectors(endPos, startPos);
        const length = direction.length();

        meshRef.current.position.copy(startPos).add(direction.multiplyScalar(0.5));
        meshRef.current.lookAt(endPos);
        meshRef.current.rotateX(Math.PI / 2);
        meshRef.current.scale.set(1, length, 1);
    });

    return (
        <mesh ref={meshRef}>
            <cylinderGeometry args={[0.005, 0.005, 1, 8]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.8}
                toneMapped={false} // Important for glow
            />
        </mesh>
    );
};
