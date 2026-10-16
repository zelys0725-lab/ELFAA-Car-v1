import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Radio, 
    Navigation, 
    Gauge, 
    Power, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    Smartphone, 
    Clock, 
    Activity,
    Compass,
    Signal,
    MapPin,
    ExternalLink,
    Map as MapIcon,
    LocateFixed,
    Layers,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

export default function Transmitter({ vehicle, activeBooking }) {
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [currentCoords, setCurrentCoords] = useState(
        vehicle.last_latitude && vehicle.last_longitude ? {
            latitude: parseFloat(vehicle.last_latitude),
            longitude: parseFloat(vehicle.last_longitude)
        } : null
    );
    const [currentSpeed, setCurrentSpeed] = useState(parseFloat(vehicle.current_speed || 0));
    const [currentHeading, setCurrentHeading] = useState(null);
    const [currentAccuracy, setCurrentAccuracy] = useState(null);
    const [pingCount, setPingCount] = useState(0);
    const [lastPingTime, setLastPingTime] = useState(
        vehicle.last_gps_updated_at ? new Date(vehicle.last_gps_updated_at).toLocaleTimeString() : null
    );
    const [transmissionInterval, setTransmissionInterval] = useState(5); // seconds
    const [statusLog, setStatusLog] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [wakeLockActive, setWakeLockActive] = useState(false);
    const [showMap, setShowMap] = useState(true);
    const [mapInitialized, setMapInitialized] = useState(false);

    const watchIdRef = useRef(null);
    const intervalTimerRef = useRef(null);
    const wakeLockRef = useRef(null);
    const latestCoordsRef = useRef(null);

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const trailPolylineRef = useRef(null);
    const trailCoordsRef = useRef([]);

    // Keep ref updated for timer pings
    useEffect(() => {
        latestCoordsRef.current = currentCoords;
    }, [currentCoords]);

    // Screen Wake Lock API to prevent phone display from turning off during thesis tests
    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                setWakeLockActive(true);
            } catch (err) {
                console.warn('Wake Lock error:', err);
                setWakeLockActive(false);
            }
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
                setWakeLockActive(false);
            } catch (err) {
                console.warn('Wake lock release error:', err);
            }
        }
    };

    const addLog = (msg, type = 'info') => {
        const time = new Date().toLocaleTimeString();
        setStatusLog(prev => [{ time, msg, type }, ...prev.slice(0, 9)]);
    };

    const sendPingToServer = async (coords, speed, heading) => {
        if (!coords) return;

        try {
            const payload = {
                tracker_key: vehicle.gps_tracker_key,
                latitude: coords.latitude,
                longitude: coords.longitude,
                speed: speed,
                heading: heading,
            };

            const res = await fetch('/api/gps/ping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                setPingCount(c => c + 1);
                setLastPingTime(new Date().toLocaleTimeString());
                addLog(`Ping synced: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} (${speed.toFixed(1)} km/h)`, 'success');
                setErrorMessage(null);
            } else {
                setErrorMessage(data.message || 'Server rejected GPS ping');
                addLog(`Sync error: ${data.message || 'Unknown error'}`, 'error');
            }
        } catch (err) {
            setErrorMessage('Network connection lost or backend unreachable');
            addLog('Network ping failed', 'error');
        }
    };

    // Dynamically load Leaflet for in-app map visualization
    useEffect(() => {
        const leafletCssId = 'leaflet-cdn-css';
        const leafletJsId = 'leaflet-cdn-js';

        if (!document.getElementById(leafletCssId)) {
            const link = document.createElement('link');
            link.id = leafletCssId;
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        const initLeafletMap = () => {
            if (!window.L || !mapContainerRef.current || mapInstanceRef.current) return;

            const initLat = currentCoords ? currentCoords.latitude : 14.5995;
            const initLng = currentCoords ? currentCoords.longitude : 120.9842;
            const initZoom = currentCoords ? 15 : 12;

            const map = window.L.map(mapContainerRef.current, {
                zoomControl: true,
                attributionControl: false
            }).setView([initLat, initLng], initZoom);

            mapInstanceRef.current = map;

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            // Add vehicle marker if we have coords
            if (currentCoords) {
                const customIcon = window.L.divIcon({
                    className: 'transmitter-gps-pin',
                    html: `
                        <div style="background-color: #FF3B30; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(255,59,48,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px; position: relative;">
                            🚗
                            <div style="position: absolute; inset: -6px; border-radius: 50%; border: 2px solid #FF3B30; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                        </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                });

                markerRef.current = window.L.marker([initLat, initLng], { icon: customIcon }).addTo(map);
                markerRef.current.bindPopup(`<b>${vehicle.name}</b><br>Plate: ${vehicle.plate_number}`).openPopup();

                trailCoordsRef.current = [[initLat, initLng]];
                trailPolylineRef.current = window.L.polyline(trailCoordsRef.current, {
                    color: '#FF3B30',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '6, 8',
                }).addTo(map);
            }

            setMapInitialized(true);
        };

        if (!window.L) {
            if (!document.getElementById(leafletJsId)) {
                const script = document.createElement('script');
                script.id = leafletJsId;
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.onload = initLeafletMap;
                document.body.appendChild(script);
            }
        } else {
            initLeafletMap();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update map marker when new coordinates arrive
    useEffect(() => {
        if (!currentCoords || !window.L || !mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        const latLng = [currentCoords.latitude, currentCoords.longitude];

        if (markerRef.current) {
            markerRef.current.setLatLng(latLng);
        } else {
            const customIcon = window.L.divIcon({
                className: 'transmitter-gps-pin',
                html: `
                    <div style="background-color: #FF3B30; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(255,59,48,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px; position: relative;">
                        🚗
                        <div style="position: absolute; inset: -6px; border-radius: 50%; border: 2px solid #FF3B30; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            markerRef.current = window.L.marker(latLng, { icon: customIcon }).addTo(map);
            markerRef.current.bindPopup(`<b>${vehicle.name}</b><br>Plate: ${vehicle.plate_number}`).openPopup();
        }

        // Add to path trail
        trailCoordsRef.current.push(latLng);
        if (trailPolylineRef.current) {
            trailPolylineRef.current.setLatLngs(trailCoordsRef.current);
        } else {
            trailPolylineRef.current = window.L.polyline(trailCoordsRef.current, {
                color: '#FF3B30',
                weight: 4,
                opacity: 0.8,
                dashArray: '6, 8',
            }).addTo(map);
        }

        // Pan map smoothly to new position
        map.panTo(latLng, { animate: true });
    }, [currentCoords]);

    const recenterMap = () => {
        if (currentCoords && mapInstanceRef.current) {
            mapInstanceRef.current.setView([currentCoords.latitude, currentCoords.longitude], 16, { animate: true });
        }
    };

    const startTracking = () => {
        if (!('geolocation' in navigator)) {
            setErrorMessage('Geolocation is not supported by your phone browser.');
            return;
        }

        setErrorMessage(null);
        setIsTransmitting(true);
        requestWakeLock();
        addLog('Acquiring high-accuracy GPS fix...', 'info');

        // Watch device position continuously
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const speedKph = pos.coords.speed ? pos.coords.speed * 3.6 : 0;
                setCurrentCoords(pos.coords);
                setCurrentSpeed(speedKph);
                setCurrentHeading(pos.coords.heading);
                setCurrentAccuracy(pos.coords.accuracy);

                // If first ping, send immediately
                if (pingCount === 0) {
                    sendPingToServer(pos.coords, speedKph, pos.coords.heading);
                }
            },
            (err) => {
                let msg = 'Failed to get location';
                if (err.code === 1) msg = 'Location permission denied. Please allow GPS access in your browser.';
                if (err.code === 2) msg = 'GPS signal unavailable. Ensure location is enabled in phone settings.';
                if (err.code === 3) msg = 'GPS request timed out. Searching for satellites...';
                setErrorMessage(msg);
                addLog(msg, 'error');
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000,
            }
        );

        // Schedule periodic ping transmission
        intervalTimerRef.current = setInterval(() => {
            if (latestCoordsRef.current) {
                const speed = latestCoordsRef.current.speed ? latestCoordsRef.current.speed * 3.6 : 0;
                sendPingToServer(latestCoordsRef.current, speed, latestCoordsRef.current.heading);
            }
        }, transmissionInterval * 1000);
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (intervalTimerRef.current !== null) {
            clearInterval(intervalTimerRef.current);
            intervalTimerRef.current = null;
        }
        releaseWakeLock();
        setIsTransmitting(false);
        addLog('GPS transmission paused.', 'info');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
            if (intervalTimerRef.current !== null) clearInterval(intervalTimerRef.current);
            releaseWakeLock();
        };
    }, []);

    const activeLat = currentCoords ? currentCoords.latitude : null;
    const activeLng = currentCoords ? currentCoords.longitude : null;
    const googleMapsUrl = activeLat && activeLng 
        ? `https://www.google.com/maps?q=${activeLat},${activeLng}` 
        : null;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 font-sans select-none">
            <Head title={`GPS Transmitter • ${vehicle.plate_number}`} />

            {/* Top Brand Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FF3B30] flex items-center justify-center text-white shadow-lg shadow-[#FF3B30]/30 font-black">
                        <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider text-white block">
                            ELFAA Fleet GPS
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                            Mobile Vehicle Transmitter
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-[#FF3B30]" />
                    <span className="text-zinc-300">Device: {vehicle.gps_device_id || 'ELFAA-01'}</span>
                </div>
            </div>

            {/* Main Center Console */}
            <div className="max-w-md w-full mx-auto my-auto space-y-4 py-3">
                
                {/* Vehicle Identification Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">
                                {vehicle.name}
                            </h2>
                            <p className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider">
                                Plate: {vehicle.plate_number} • {vehicle.type}
                            </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            vehicle.gps_enabled 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                            {vehicle.gps_enabled ? 'GPS Enabled' : 'GPS Disabled'}
                        </span>
                    </div>

                    {activeBooking && (
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-medium text-zinc-400">
                            <span>Active Renter: <strong className="text-white">{activeBooking.renter}</strong></span>
                            <span>Trip: {activeBooking.start_date}</span>
                        </div>
                    )}
                </div>

                {/* Primary Transmission Status Display */}
                <div className={`p-5 rounded-3xl border transition-all duration-300 text-center relative overflow-hidden shadow-2xl ${
                    isTransmitting 
                        ? 'bg-gradient-to-b from-emerald-950/40 via-zinc-900 to-zinc-950 border-emerald-500/40 shadow-emerald-500/10' 
                        : 'bg-zinc-900/60 border-zinc-800'
                }`}>
                    {/* Pulsing Signal Wave when active */}
                    {isTransmitting && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            Live Sync Active
                        </div>
                    )}

                    <div className="my-1">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Gauge className="w-4 h-4 text-zinc-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                                Current Speed
                            </span>
                        </div>
                        <div className="text-5xl font-black tracking-tight text-white tabular-nums drop-shadow-md">
                            {Math.round(currentSpeed)}
                            <span className="text-lg font-bold text-zinc-500 ml-1.5">km/h</span>
                        </div>
                    </div>

                    {/* Coordinates & Accuracy */}
                    <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-zinc-800/80 text-left">
                        <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-850">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Latitude</span>
                            <span className="text-xs font-mono font-bold text-zinc-200">
                                {currentCoords ? currentCoords.latitude.toFixed(6) : 'Searching...'}
                            </span>
                        </div>
                        <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-850">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Longitude</span>
                            <span className="text-xs font-mono font-bold text-zinc-200">
                                {currentCoords ? currentCoords.longitude.toFixed(6) : 'Searching...'}
                            </span>
                        </div>
                    </div>

                    {/* Telemetry pill row */}
                    <div className="flex justify-between items-center pt-2.5 text-[10px] font-bold text-zinc-400">
                        <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3 text-[#FF3B30]" />
                            Pings: <strong className="text-white tabular-nums">{pingCount}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            Last: <strong className="text-white">{lastPingTime || 'None'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                            <Signal className="w-3 h-3 text-emerald-400" />
                            ±{currentAccuracy ? Math.round(currentAccuracy) : '--'}m
                        </span>
                    </div>
                </div>

                {/* IN-APP INTERACTIVE MAP & GOOGLE MAPS SHORTCUT */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
                    <div className="px-3.5 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#FF3B30]" />
                            <span className="text-xs font-black uppercase tracking-wider text-white">
                                Live Map View
                            </span>
                            {currentCoords && (
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    GPS Locked
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {googleMapsUrl && (
                                <a
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                                    title="Open coordinates in Google Maps application"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Google Map
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={recenterMap}
                                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                title="Recenter map"
                            >
                                <LocateFixed className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMap(!showMap)}
                                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                title="Toggle map visibility"
                            >
                                {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {showMap && (
                        <div className="relative w-full h-56 bg-zinc-950">
                            <div ref={mapContainerRef} className="w-full h-full z-10" />

                            {!currentCoords && (
                                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center">
                                    <MapPin className="w-8 h-8 text-[#FF3B30] animate-bounce mb-2" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        Waiting for GPS Satellites
                                    </span>
                                    <span className="text-[11px] text-zinc-400 max-w-xs mt-1">
                                        Tap "Start GPS Transmission" below to locate your vehicle on the live map.
                                    </span>
                                </div>
                            )}

                            {/* Floating Google Maps Overlay Pill */}
                            {googleMapsUrl && (
                                <div className="absolute bottom-2 left-2 z-20">
                                    <a
                                        href={googleMapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2.5 py-1 rounded-full bg-zinc-950/90 hover:bg-black text-white border border-zinc-700/80 shadow-lg text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md transition-all hover:scale-105"
                                    >
                                        <span>📍 View on Google Maps</span>
                                        <ExternalLink className="w-2.5 h-2.5 text-[#FF3B30]" />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Main Action Start/Stop Button */}
                <div>
                    {!isTransmitting ? (
                        <button
                            type="button"
                            onClick={startTracking}
                            className="w-full h-12 rounded-2xl bg-[#FF3B30] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-[#FF3B30]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                            <Power className="w-4 h-4" />
                            Start GPS Transmission
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={stopTracking}
                            className="w-full h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider border border-zinc-700 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                            <Power className="w-4 h-4 text-rose-500" />
                            Stop Transmission
                        </button>
                    )}
                </div>

                {/* Transmission Controls & Interval */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
                    <span className="font-bold text-zinc-300 text-[11px]">Ping Frequency:</span>
                    <div className="flex gap-1.5">
                        {[3, 5, 10, 30].map(sec => (
                            <button
                                key={sec}
                                type="button"
                                onClick={() => setTransmissionInterval(sec)}
                                className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] transition-colors ${
                                    transmissionInterval === sec 
                                        ? 'bg-[#FF3B30] text-white shadow' 
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {sec}s
                            </button>
                        ))}
                    </div>
                </div>

                {/* Wake Lock Screen Indicator */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full ${wakeLockActive ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                    <span>{wakeLockActive ? 'Display Wake Lock Active (Screen will not dim while driving)' : 'Screen lock normal'}</span>
                </div>

                {/* Activity Console Log */}
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block mb-0.5">
                        Live Transmission Log
                    </span>
                    <div className="space-y-1 max-h-20 overflow-y-auto font-mono text-[10px]">
                        {statusLog.length === 0 ? (
                            <span className="text-zinc-600 block">Waiting to begin transmission...</span>
                        ) : (
                            statusLog.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                                    <span className={log.type === 'error' ? 'text-rose-400' : (log.type === 'success' ? 'text-emerald-400' : 'text-zinc-400')}>
                                        {log.msg}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Notice with Admin Fleet Map Link */}
            <div className="text-center text-[10px] text-zinc-600 font-semibold pt-3 border-t border-zinc-900 flex flex-col items-center gap-1">
                <span>ELFAA Car Rental • Vehicle Telemetry &amp; GPS Tracking Subsystem</span>
                <a 
                    href="/admin/dashboard" 
                    className="text-[#FF3B30] hover:underline font-bold"
                >
                    Open Fleet Live GPS Tracking in Admin Portal &rarr;
                </a>
            </div>
        </div>
    );
}
