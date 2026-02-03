import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

const MOON_RADIUS = 1.737; // Relative to Earth_Radius 6.371
const MOON_DISTANCE = 35;  // Cinematic distance

export const Moon = () => {
    const moonRef = useRef();
    const [moonMap] = useLoader(TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg'
    ]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime() * 0.1; // Slower orbit than satellites
        if (moonRef.current) {
            // Orbital position
            moonRef.current.position.x = Math.cos(t) * MOON_DISTANCE;
            moonRef.current.position.z = Math.sin(t) * MOON_DISTANCE;

            // Self-rotation
            moonRef.current.rotation.y += 0.002;
        }
    });

    return (
        <mesh ref={moonRef}>
            <sphereGeometry args={[MOON_RADIUS, 32, 32]} />
            <meshPhongMaterial
                map={moonMap}
                shininess={0}
                bumpScale={0.05}
            />
        </mesh>
    );
};
