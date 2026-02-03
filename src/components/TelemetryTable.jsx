import React from 'react';

export const TelemetryTable = ({ data, alerts, simTime, weatherIntensity }) => {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const formatAlertTime = (seconds) => {
        return String(seconds).padStart(4, '0') + 's';
    };

    return (
        <div className="telemetry-screen">
            <div className="console-header">
                <div>ORBIT-LATCH v4.0 :: SATELLITE HANDOVER SIMULATION</div>
                <div>TIME {formatTime(simTime)} | SPACE WEATHER {weatherIntensity.toFixed(1)}x</div>
            </div>

            <div className="console-content">
                <table className="console-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>STATE</th>
                            <th>DIST(km)</th>
                            <th>RSSI</th>
                            <th>LOAD</th>
                            <th>SNR</th>
                            <th>TEMP</th>
                            <th>REL</th>
                            <th>UP</th>
                            <th>FAIL</th>
                            <th>SCORE</th>
                        </tr>
                        <tr>
                            <th colSpan="11">--------------------------------------------------------------------------------------------------</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(sat => (
                            <tr key={sat.id} className={sat.state === 'CONNECTED' ? 'row-connected' : sat.state === 'FAILED' ? 'row-failed' : ''}>
                                <td>{sat.id.split('-')[1] || sat.id}</td>
                                <td>{sat.state}</td>
                                <td>{sat.dist.toFixed(1)}</td>
                                <td>{sat.rssi.toFixed(1)}</td>
                                <td>{sat.load}%</td>
                                <td>{sat.snr.toFixed(1)}</td>
                                <td>{sat.temp.toFixed(1)}</td>
                                <td>{sat.rel.toFixed(2)}</td>
                                <td>{sat.up}</td>
                                <td>{sat.fail}</td>
                                <td>{sat.score.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="alert-section">
                    <div className="alert-header">ALERT HISTORY (All):</div>
                    <div className="separator">---------------------------</div>
                    <div className="alert-list">
                        {alerts.map((alert, i) => (
                            <div key={i} className="alert-line">
                                <span className="a-time">[{formatAlertTime(alert.time)}]</span>
                                <span className="a-level">{alert.level.padEnd(10)}</span>
                                <span className="a-msg">{alert.msg}</span>
                            </div>
                        ))}
                        {alerts.length === 0 && <div>NO ACTIVE ALERTS</div>}
                    </div>
                </div>
            </div>

            <style>{`
        .telemetry-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 5, 0, 0.95);
            color: #fff;
            padding: 20px 40px;
            font-family: 'Consolas', 'Courier New', monospace;
            z-index: 50;
            pointer-events: auto;
            overflow: auto;
        }

        .console-header {
            margin-bottom: 20px;
            font-size: 1.1rem;
            line-height: 1.4;
        }

        .console-content {
            width: 100%;
        }

        .console-table {
            width: 1000px; /* Force fixed width for terminal look */
            border-collapse: collapse;
            margin-bottom: 40px;
        }

        .console-table th {
            text-align: left;
            padding: 5px 0;
            font-weight: normal;
        }

        .console-table td {
            padding: 3px 0;
            font-size: 0.95rem;
        }

        .row-connected {
            color: #fff;
        }
        
        .row-failed {
            opacity: 0.7;
        }

        .alert-section {
            margin-top: 20px;
        }

        .alert-header {
            margin-bottom: 5px;
        }

        .separator {
            margin-bottom: 15px;
        }

        .alert-line {
            display: flex;
            gap: 20px;
            margin-bottom: 5px;
            font-size: 0.95rem;
        }

        .a-time { color: #fff; }
        .a-level { font-weight: bold; }
        .a-msg { color: #fff; }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
        </div>
    );
};
