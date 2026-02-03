import { Vector3 } from 'three';

export const EARTH_RADIUS = 6.371; // in simulation units (1 unit = 1000 km)
export const GM = 398.6;

export const generateConstellation = (count = 20) => {
  const satellites = [];
  for (let i = 0; i < count; i++) {
    const altitude = 0.4 + Math.random() * 1.6;
    satellites.push({
      id: `SAT-${i + 101}`,
      altitude: altitude,
      inclination: (Math.random() * 180 - 90) * (Math.PI / 180),
      raan: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.sqrt(GM / (EARTH_RADIUS + altitude)) * 0.05,
      status: 'active',
      temperature: 50,
    });
  }
  return satellites;
};

export const getSatellitePosition = (satellite, time) => {
  const r = EARTH_RADIUS + satellite.altitude;
  const theta = satellite.phase + satellite.speed * time;
  const pos = new Vector3(r * Math.cos(theta), 0, r * Math.sin(theta));
  pos.applyAxisAngle(new Vector3(1, 0, 0), satellite.inclination);
  pos.applyAxisAngle(new Vector3(0, 1, 0), satellite.raan);
  return pos;
};

export const calculateSignalQuality = (distOrPos, targetPosOrIntensity) => {
  let dist;
  let intensity = 0;

  if (typeof distOrPos === 'number') {
    dist = distOrPos;
    intensity = targetPosOrIntensity || 0;
  } else {
    dist = distOrPos.distanceTo(targetPosOrIntensity);
  }

  if (dist > 4.0) return { rssi: 0, snr: 0 };

  const rssi = Math.max(0, 100 - (dist * 20) - (intensity * 10));
  const snr = Math.max(0, rssi - (Math.random() * 20));

  return { rssi, snr };
};
