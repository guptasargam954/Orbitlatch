import React, { useState, useCallback, useEffect } from 'react';
import { Scene } from './components/Scene';
import { TelemetryTable } from './components/TelemetryTable';

function App() {
    const [view, setView] = useState('simulation');
    const [followMode, setFollowMode] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [simTime, setSimTime] = useState(0);
    const [status, setStatus] = useState({
        connectedId: null,
        visualId: null,
        nextId: null,
        signalQuality: 0,
        weather: 'CLEAR',
        weatherIntensity: 1.0,
        satCount: 0,
        targetAlt: 0,
        targetVel: 0,
        targetLat: 0,
        targetDist: 0,
        userLocation: 'UNKNOWN',
        telemetry: []
    });

    useEffect(() => {
        const timer = setInterval(() => setSimTime(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAlert = useCallback((level, msg) => {
        setAlerts(prev => {
            const newAlert = { level, msg, time: simTime };
            return [newAlert, ...prev].slice(0, 50);
        });
    }, [simTime]);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            background: '#000',
            overflow: 'hidden',
            fontFamily: 'Consolas, monospace',
            color: '#0f0'
        }}>

            <Scene
                onStatusUpdate={setStatus}
                onAlert={handleAlert}
                followId={followMode ? status.visualId : null}
            />

            {/* INTEGRATED MENU BAR */}
            <nav className="main-nav">
                <div className="nav-logo">ORBIT LATCH SIMULATOR V2.1</div>
                <div className="nav-links">
                    <button
                        className={followMode ? 'active' : ''}
                        onClick={() => setFollowMode(!followMode)}
                    >
                        {followMode ? 'EXIT SATELLITE VIEW' : 'DOCK TO SATELLITE'}
                    </button>
                    <button
                        className={view === 'telemetry' ? 'active' : ''}
                        onClick={() => setView(v => v === 'telemetry' ? 'simulation' : 'telemetry')}
                    >
                        {view === 'telemetry' ? 'CLOSE DATA TERMINAL' : 'OPEN DATA TERMINAL'}
                    </button>
                </div>
                <div className="nav-time">{new Date().toLocaleTimeString()}</div>
            </nav>

            {/* SATELLITE CAMERA HUD */}
            {followMode && (
                <div className="satellite-hud">
                    <div className="hud-corner top-left">
                        <div className="rec-indicator">REC [●] LIVE FEED</div>
                        <div className="sat-id">SRC: {status.visualId}</div>
                    </div>
                    <div className="hud-corner top-right">
                        <div className="orbit-data">ALT: {Math.round(status.targetAlt)} KM</div>
                        <div className="orbit-data">LAT: {status.targetLat.toFixed(2)} MS</div>
                    </div>
                    <div className="hud-center">
                        <div className="crosshair"></div>
                        <div className="scanning-line"></div>
                    </div>
                    <div className="hud-bottom">
                        <div className="warning-text">ENCRYPTED LEO LINK STABLE</div>
                    </div>
                </div>
            )}

            {/* DASHBOARD OVERLAY */}
            <div className="ui-container" style={{
                opacity: (view === 'telemetry' || followMode) ? 0.2 : 1,
                pointerEvents: 'none',
                zIndex: 1000
            }}>
                <header>
                    <div>
                        <h1>ORBIT LATCH <span className="sub">SIMULATOR V2.1</span></h1>
                        <div className="sys-status">SYSTEM NORMAL // LEO CONSTEL-01</div>
                    </div>
                </header>

                <div className="connection-panel" style={{ pointerEvents: 'auto' }}>
                    <div className="panel-header">CONNECTION TELEMETRY</div>
                    <div className="row">
                        <span className="label">TARGET ID:</span>
                        <span className="value">{status.connectedId || "SEARCHING..."}</span>
                    </div>
                    <div className="row">
                        <span className="label">SIGNAL:</span>
                        <div className="rssi-bar-container">
                            <div
                                className="rssi-bar"
                                style={{
                                    width: `${status.signalQuality}%`,
                                    backgroundColor: status.signalQuality > 40 ? '#0f0' : '#f00'
                                }}
                            />
                        </div>
                    </div>
                    <div className="grid-row">
                        <div>
                            <span className="label-sm">ALTITUDE</span>
                            <div className="value-lg">{Math.round(status.targetAlt)} km</div>
                        </div>
                        <div>
                            <span className="label-sm">LATENCY</span>
                            <div className="value-lg">{status.targetLat.toFixed(1)} ms</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TELEMETRY OVERLAY */}
            {view === 'telemetry' && (
                <div className="telemetry-overlay">
                    <TelemetryTable
                        data={status.telemetry}
                        alerts={alerts}
                        simTime={simTime}
                        weatherIntensity={status.weatherIntensity}
                    />
                </div>
            )}

            <style>{`
        .main-nav {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 32px;
            background: rgba(0, 0, 0, 0.95);
            border-bottom: 1px solid #060;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 5000;
        }

        .nav-logo { font-weight: bold; font-size: 0.8rem; letter-spacing: 1px; }
        .nav-links { display: flex; gap: 15px; }
        .nav-links button {
            background: none;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 2px 12px;
            cursor: pointer;
            font-size: 0.65rem;
            text-transform: uppercase;
            font-family: inherit;
            transition: background 0.2s;
        }
        .nav-links button:hover { background: rgba(0, 255, 0, 0.1); }
        .nav-links button.active { background: #040; box-shadow: 0 0 10px rgba(0, 255, 0, 0.2); }

        .nav-time { color: #050; font-size: 0.7rem; }

        .ui-container {
          position: absolute;
          top: 32px;
          left: 0;
          width: 100%;
          padding: 1.5rem;
          transition: opacity 0.4s;
        }

        header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid rgba(0, 255, 0, 0.3);
          padding-bottom: 0.5rem;
          background: linear-gradient(90deg, rgba(0,20,0,0.4) 0%, transparent 100%);
        }

        h1 { margin: 0; font-size: 1.1rem; }
        .sub { font-size: 0.65rem; opacity: 0.6; }
        .sys-status { font-size: 0.65rem; opacity: 0.5; margin-top: 2px; }

        .connection-panel {
          position: absolute;
          top: 6rem;
          right: 3rem;
          width: 260px;
          background: rgba(0, 20, 0, 0.9);
          border: 1px solid #060;
          padding: 1.2rem;
          backdrop-filter: blur(4px);
        }
        
        .panel-header { font-size: 0.75rem; margin-bottom: 0.8rem; border-bottom: 1px solid #040; padding-bottom: 0.3rem; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.75rem; }
        .grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .value-lg { font-size: 1.1rem; font-weight: bold; }
        .rssi-bar-container { flex: 1; height: 8px; background: #000; margin-left: 15px; border: 1px solid #333; align-self: center; }
        .rssi-bar { height: 100%; transition: width 0.3s; }
        
        .telemetry-overlay {
            position: absolute;
            top: 32px;
            left: 0;
            width: 100%;
            height: calc(100% - 32px);
            z-index: 4000;
            background: rgba(0, 0, 0, 0.9);
            overflow: hidden;
        }

        .satellite-hud {
            position: absolute;
            top: 32px;
            left: 0;
            width: 100%;
            height: calc(100% - 32px);
            z-index: 1500;
            pointer-events: none;
            border: 2px solid rgba(0, 255, 255, 0.1);
            box-sizing: border-box;
        }

        .hud-corner {
            position: absolute;
            padding: 20px;
            font-family: 'Consolas', monospace;
            color: #0ff;
            text-shadow: 0 0 10px #0ff;
        }
        .top-left { top: 0; left: 0; border-top: 2px solid #0ff; border-left: 2px solid #0ff; width: 300px; height: 100px; }
        .top-right { top: 0; right: 0; border-top: 2px solid #0ff; border-right: 2px solid #0ff; width: 300px; height: 100px; text-align: right; }
        
        .rec-indicator { color: #f00; font-weight: bold; margin-bottom: 5px; animation: blink 1s linear infinite; }
        .sat-id { font-size: 1.2rem; background: rgba(0, 255, 255, 0.1); padding: 5px; }

        .hud-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
        }

        .crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            border: 1px solid rgba(0, 255, 255, 0.5);
            border-radius: 50%;
        }
        .crosshair::before, .crosshair::after {
            content: '';
            position: absolute;
            background: rgba(0, 255, 255, 0.5);
        }
        .crosshair::before { top: 50%; left: -20px; width: 140px; height: 1px; }
        .crosshair::after { top: -20px; left: 50%; width: 1px; height: 140px; }

        .scanning-line {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #0ff, transparent);
            box-shadow: 0 0 15px #0ff;
            animation: scan 4s linear infinite;
        }

        .hud-bottom {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
        }
        .warning-text {
            color: #0ff;
            font-size: 0.8rem;
            letter-spacing: 4px;
            text-transform: uppercase;
        }

        @keyframes scan {
            from { top: 0%; }
            to { top: 100%; }
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
        }
      `}</style>
        </div>
    );
}

export default App;
