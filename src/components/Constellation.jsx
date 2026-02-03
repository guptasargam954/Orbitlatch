import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Satellite, TargetedBeam } from './Satellite';
import { generateConstellation, getSatellitePosition, calculateSignalQuality, EARTH_RADIUS } from '../utils/orbitalPhysics';

export const Constellation = ({ onStatusUpdate, onAlert, userWorldPosRef, satRefs: parentSatRefs }) => {
    const [satellites, setSatellites] = useState(() => generateConstellation(20));
    const [connectedId, setConnectedId] = useState(null); // Visual ID
    const [telemetryId, setTelemetryId] = useState(null); // Stable ID for Telemetry
    const [spaceWeather, setSpaceWeather] = useState({ active: false, intensity: 0 });

    const localSatRefs = useRef({});
    const satRefs = parentSatRefs || localSatRefs;
    const lastSwitchTime = useRef(0);
    const lastUpdate = useRef(0);

    // Simulation logic (C code style)
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() < 0.03) {
                const intensity = Math.random() * 5.0;
                setSpaceWeather({ active: true, intensity });
                if (onAlert) onAlert("DANGER", "Solar storm detected - SNR degrading");
                setTimeout(() => setSpaceWeather({ active: false, intensity: 0 }), 8000);
            }

            setSatellites(prev => prev.map(s => {
                let newTemp = s.temperature;
                if (s.id === connectedId) newTemp += 0.8;
                else newTemp = Math.max(25, newTemp - 0.2);

                if (newTemp > 80 && s.status !== 'failure') {
                    if (onAlert) onAlert("CRITICAL", "Thermal overload detected");
                    return { ...s, status: 'failure', temperature: newTemp };
                }
                if (Math.random() < 0.005 && s.status !== 'failure') {
                    if (onAlert) onAlert("CRITICAL", "Satellite failure occurred");
                    return { ...s, status: 'failure' };
                }
                return { ...s, temperature: newTemp };
            }));

            // Per-second System Heartbeat Alert
            if (onAlert) {
                const activeId = telemetryId || connectedId;
                onAlert("STATUS", `Heartbeat: ${activeId ? 'LINK_ACTIVE (' + activeId + ')' : 'LINK_OFFLINE'}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [connectedId, onAlert, telemetryId]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const telemetry = [];
        let bestSat = null;
        let bestQuality = -Infinity;

        if (!userWorldPosRef.current || userWorldPosRef.current.lengthSq() < 1) return;

        satellites.forEach(sat => {
            const pos = getSatellitePosition(sat, t);
            if (satRefs.current[sat.id]) {
                satRefs.current[sat.id].position.copy(pos);
            }

            const dist = pos.distanceTo(userWorldPosRef.current);
            const isVisible = pos.clone().normalize().dot(userWorldPosRef.current.clone().normalize()) > 0.05;

            // Calculate quality
            const quality = calculateSignalQuality(dist, spaceWeather.active ? spaceWeather.intensity : 0);

            let stateStr = sat.status === 'failure' ? 'FAILED' : 'STANDBY';
            if (isVisible && sat.status !== 'failure') {
                if (sat.id === telemetryId) stateStr = 'CONNECTED';
                else stateStr = 'AVAILABLE';
            } else if (!isVisible && sat.status !== 'failure') {
                stateStr = 'STANDBY';
            }

            telemetry.push({
                id: sat.id,
                state: stateStr,
                rssi: quality.rssi,
                snr: quality.snr,
                alt: 550 + (Math.random() * 2),
                vel: 7.6,
                latency: dist * 0.05,
                dist: dist * 1000,
                load: Math.floor(Math.random() * 80),
                temp: sat.temperature,
                rel: 0.8 + (Math.random() * 0.19),
                up: Math.floor(t),
                fail: 0,
                score: (quality.rssi * 0.8) + (quality.snr * 0.2)
            });

            if (isVisible && sat.status !== 'failure' && quality.rssi > bestQuality) {
                bestQuality = quality.rssi;
                bestSat = sat.id;
            }
        });

        // 1. VISUAL CONNECTION
        if (bestSat !== connectedId) {
            setConnectedId(bestSat);
        }

        // 2. TELEMETRY CONNECTION (5-second hold)
        const canHandover = (t - lastSwitchTime.current) > 5;
        const currentTQ = telemetryId ? (telemetry.find(s => s.id === telemetryId)?.rssi || 0) : 0;

        if (bestSat && bestSat !== telemetryId) {
            if (!telemetryId || (canHandover && (bestQuality > currentTQ + 15 || currentTQ <= 0))) {
                setTelemetryId(bestSat);
                lastSwitchTime.current = t;
                if (onAlert) {
                    if (!telemetryId) onAlert("INFO", "User connected to satellite");
                    else onAlert("INFO", "Predictive handover triggered");
                }
            }
        } else if (!bestSat && telemetryId !== null) {
            setTelemetryId(null);
            if (onAlert) onAlert("WARNING", "No satellite available");
        }

        // Send updates to UI
        if (onStatusUpdate && t - lastUpdate.current > 0.4) {
            lastUpdate.current = t;
            const activeStat = telemetry.find(s => s.id === (telemetryId || bestSat)) || {};
            onStatusUpdate({
                connectedId: telemetryId || bestSat,
                visualId: connectedId,
                nextId: bestSat,
                signalQuality: activeStat.rssi || 0,
                weather: spaceWeather.active ? 'STORM' : 'CLEAR',
                weatherIntensity: spaceWeather.intensity || 1.0,
                satCount: satellites.length,
                targetAlt: activeStat.alt || 0,
                targetVel: activeStat.vel || 0,
                targetLat: activeStat.latency || 0,
                targetDist: activeStat.dist || 0,
                userLocation: 'CALIBRATED_SITE',
                telemetry: telemetry
            });
        }
    });

    return (
        <group>
            {satellites.map(sat => (
                <Satellite
                    key={sat.id}
                    ref={(el) => (satRefs.current[sat.id] = el)}
                    rssi={0}
                    connected={connectedId === sat.id}
                    status={sat.status}
                />
            ))}

            {connectedId && satRefs.current[connectedId] && (
                <TargetedBeam
                    startPos={satRefs.current[connectedId].position}
                    endPos={userWorldPosRef.current}
                    color="#00ff00"
                />
            )}
        </group>
    );
};
