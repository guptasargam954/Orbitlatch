import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Earth } from './Earth';
import { Constellation } from './Constellation';
import { SolarSystem } from './SolarSystem';
import { Moon } from './Moon';
import { Vector3, Quaternion } from 'three';

const CameraManager = ({ followId, satRefs, onIntroFinish }) => {
    const introFinished = useRef(false);
    const lastT = useRef(0);

    useFrame(({ camera, clock }) => {
        const t = clock.getElapsedTime();

        // 1. FOLLOW MODE (Highest Priority)
        if (followId && satRefs.current[followId]) {
            introFinished.current = true;
            const targetSat = satRefs.current[followId];
            const satPos = new Vector3();
            targetSat.getWorldPosition(satPos);

            // Cinematic Chase Position: High and behind
            const satDir = satPos.clone().normalize();
            const camPos = satPos.clone().add(satDir.multiplyScalar(0.8)).add(new Vector3(0, 0.4, 0));

            camera.position.lerp(camPos, 0.08);

            // Look slightly ahead of the earth center for better horizon
            camera.lookAt(0, -0.2, 0);
            return;
        }

        // 2. INTRO ANIMATION (First 12 seconds)
        if (!introFinished.current && t < 12) {
            const progress = t / 12;
            const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease out

            const startPos = new Vector3(750, 200, -750); // Far in Solar System
            const endPos = new Vector3(0, 5, 20); // Near Earth

            camera.position.lerpVectors(startPos, endPos, eased);

            // Look toward Earth center
            const sunPos = new Vector3(600, 100, -800);
            const earthPos = new Vector3(0, 0, 0);
            const currentLook = new Vector3().lerpVectors(sunPos, earthPos, Math.pow(progress, 0.5));
            camera.lookAt(currentLook);

            if (progress > 0.98) {
                introFinished.current = true;
                if (onIntroFinish) onIntroFinish();
            }
            return;
        }
    });
    return null;
};

export const Scene = ({ onStatusUpdate, onAlert, followId }) => {
    const userWorldPosRef = useRef(new Vector3());
    const satRefs = useRef({});
    const [introActive, setIntroActive] = useState(true);

    return (
        <Canvas
            style={{ background: '#000' }}
            camera={{ position: [750, 200, -750], fov: 45 }}
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[600, 100, -800]} intensity={2.0} />

            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group>
                <Earth userWorldPosRef={userWorldPosRef} />
                <Constellation
                    onStatusUpdate={onStatusUpdate}
                    onAlert={onAlert}
                    userWorldPosRef={userWorldPosRef}
                    satRefs={satRefs}
                />
                <Moon />
            </group>

            <SolarSystem />

            <EffectComposer>
                <Bloom
                    luminanceThreshold={0.5}
                    luminanceSmoothing={0.9}
                    height={300}
                    intensity={1.5}
                />
            </EffectComposer>

            {/* OrbitControls only take over after intro or during follow mode reset */}
            {!followId && (
                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={8}
                    maxDistance={1500}
                    autoRotate={!introActive}
                    autoRotateSpeed={0.5}
                />
            )}

            <CameraManager
                followId={followId}
                satRefs={satRefs}
                onIntroFinish={() => setIntroActive(false)}
            />
        </Canvas>
    );
};
