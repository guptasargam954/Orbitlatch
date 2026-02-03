import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, AdditiveBlending, BackSide, FrontSide, Vector3 } from 'three';
import { useControls } from 'leva';
import { EARTH_RADIUS } from '../utils/orbitalPhysics';

// High-res NASA textures
const TEXTURES = {
    map: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    specular: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    normal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
};

const Atmosphere = () => {
    return (
        <mesh scale={[1.15, 1.15, 1.15]}>
            <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
            <shaderMaterial
                side={BackSide}
                blending={AdditiveBlending}
                transparent
                uniforms={{
                    color: { value: [0.3, 0.6, 1.0] },
                    coefficient: { value: 0.7 },
                    power: { value: 2.5 },
                }}
                vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
                fragmentShader={`
          varying vec3 vNormal;
          uniform vec3 color;
          void main() {
            float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
            gl_FragColor = vec4(color, 1.0) * intensity;
          }
        `}
            />
        </mesh>
    );
};

export const Earth = forwardRef(({ userWorldPosRef }, ref) => {
    const earthRef = useRef();
    const cloudsRef = useRef();
    const markerRef = useRef();

    const [map, specular, normal, cloudsMap] = useLoader(TextureLoader, [
        TEXTURES.map,
        TEXTURES.specular,
        TEXTURES.normal,
        TEXTURES.clouds
    ]);

    // Debug Controls
    const { debugLat, debugLon, debugOffset } = useControls('Ground Station Calibration', {
        debugLat: { value: 19, min: -90, max: 90, step: 0.01, label: 'Latitude' },
        debugLon: { value: 165, min: -180, max: 180, step: 0.01, label: 'Longitude' },
        debugOffset: { value: 90, min: 0, max: 360, step: 90, label: 'Texture Offset' },
    });

    const phi = (90 - debugLat) * (Math.PI / 180);
    const theta = (debugLon + debugOffset) * (Math.PI / 180);

    const x = -EARTH_RADIUS * 1.01 * Math.sin(phi) * Math.cos(theta);
    const z = EARTH_RADIUS * 1.01 * Math.sin(phi) * Math.sin(theta);
    const y = EARTH_RADIUS * 1.01 * Math.cos(phi);

    const markerPos = [x, y, z];

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (earthRef.current) {
            earthRef.current.rotation.y = t * 0.05;
            if (markerRef.current && userWorldPosRef) {
                markerRef.current.getWorldPosition(userWorldPosRef.current);
            }
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = t * 0.055;
        }
    });

    useImperativeHandle(ref, () => earthRef.current);

    return (
        <group>
            {/* Main Earth Sphere */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
                <meshPhongMaterial
                    map={map}
                    specularMap={specular}
                    normalMap={normal}
                    specular={"#333333"}
                    shininess={5}
                />

                {/* Ground Station Marker */}
                <mesh ref={markerRef} position={markerPos}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color="#00ff00" toneMapped={false} />
                    <pointLight distance={1} intensity={5} color="#0f0" />
                </mesh>
            </mesh>

            {/* Clouds Overlay */}
            <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
                <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
                <meshPhongMaterial
                    map={cloudsMap}
                    transparent
                    opacity={0.4}
                    blending={AdditiveBlending}
                    side={FrontSide}
                    depthWrite={false}
                />
            </mesh>

            <Atmosphere />
        </group>
    );
});
