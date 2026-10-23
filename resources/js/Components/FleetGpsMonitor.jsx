import React, { useState, useEffect, useRef } from 'react';
import {
    Radio,
    Navigation,
    Gauge,
    Smartphone,
    ExternalLink,
    Copy,
    Check,
    RefreshCw,
    AlertTriangle,
    Clock,
    MapPin,
    User,
    Power,
    SlidersHorizontal,
    Activity,
    Layers,
    X
} from 'lucide-react';

export default function FleetGpsMonitor({ isAdmin = true, vehicles = [] }) {
    const [fleetData, setFleetData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [routeHistory, setRouteHistory] = useState(null);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [copiedKey, setCopiedKey] = useState(null);
    const [configVehicle, setConfigVehicle] = useState(null);
    const [configEnabled, setConfigEnabled] = useState(false);
    const [configDeviceId, setConfigDeviceId] = useState('');
    const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const routePolylineRef = useRef(null);

    // Fetch Live Fleet GPS data
    const fetchFleetLocations = async () => {
        try {
            const res = await fetch('/admin/gps/live-fleet');
            const data = await res.json();
            setFleetData(data.vehicles || []);
            setLastRefreshed(new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Failed to fetch live fleet GPS data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-poll fleet positions every 8 seconds
    useEffect(() => {
        fetchFleetLocations();
        const timer = setInterval(fetchFleetLocations, 8000);
        return () => clearInterval(timer);
    }, []);

    // Dynamically inject Leaflet CSS & JS from CDN for zero-dependency map rendering
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

        const initMap = () => {
            if (!window.L || !mapContainerRef.current || mapInstanceRef.current) return;

            // Default center on Manila / Philippines, zoom level 12
            const map = window.L.map(mapContainerRef.current).setView([14.5995, 120.9842], 12);
            mapInstanceRef.current = map;

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);
        };

        if (!window.L) {
            if (!document.getElementById(leafletJsId)) {
                const script = document.createElement('script');
                script.id = leafletJsId;
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.onload = initMap;
                document.body.appendChild(script);
            }
        } else {
            initMap();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update map markers when fleetData updates
    useEffect(() => {
        if (!window.L || !mapInstanceRef.current) return;
        const map = mapInstanceRef.current;

        fleetData.forEach((v) => {
            if (!v.latitude || !v.longitude) return;

            const markerColor = v.status === 'moving' ? '#10B981' : (v.status === 'idle' ? '#F59E0B' : '#EF4444');
            const customIcon = window.L.divIcon({
                className: 'custom-gps-pin',
                html: `
                    <div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
                        🚗
                    </div>
                `,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });

            if (markersRef.current[v.id]) {
                markersRef.current[v.id].setLatLng([v.latitude, v.longitude]);
                markersRef.current[v.id].setIcon(customIcon);
            } else {
                const marker = window.L.marker([v.latitude, v.longitude], { icon: customIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
                            <strong style="font-size: 13px; color: #111;">${v.name}</strong><br/>
                            <span style="color: #666;">Plate: <strong>${v.plate_number}</strong></span><br/>
                            <span>Speed: <strong>${Math.round(v.speed)} km/h</strong></span><br/>
                            <span>Status: <strong style="text-transform: uppercase; color: ${markerColor}">${v.status}</strong></span><br/>
                            ${v.active_renter ? `<span>Renter: <strong>${v.active_renter}</strong></span>` : ''}
                        </div>
                    `);
                markersRef.current[v.id] = marker;
            }
        });
    }, [fleetData]);

    const handleFocusVehicle = (v) => {
        setSelectedVehicle(v);
        if (mapInstanceRef.current && v.latitude && v.longitude) {
            mapInstanceRef.current.flyTo([v.latitude, v.longitude], 15, { duration: 1.5 });
            if (markersRef.current[v.id]) {
                markersRef.current[v.id].openPopup();
            }
        }
    };

    const handleViewRoute = async (v) => {
        setSelectedVehicle(v);
        setLoadingRoute(true);
        try {
            const res = await fetch(`/admin/gps/route-history/${v.id}`);
            const data = await res.json();
            setRouteHistory(data);

            if (window.L && mapInstanceRef.current && data.coordinates.length > 0) {
                const latLngs = data.coordinates.map(pt => [pt.lat, pt.lng]);

                if (routePolylineRef.current) {
                    routePolylineRef.current.remove();
                }

                routePolylineRef.current = window.L.polyline(latLngs, {
                    color: '#FF3B30',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '8, 8',
                }).addTo(mapInstanceRef.current);

                mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
            }
        } catch (err) {
            console.error('Failed to load route history:', err);
        } finally {
            setLoadingRoute(false);
        }
    };

    const clearRouteTrace = () => {
        setRouteHistory(null);
        if (routePolylineRef.current) {
            routePolylineRef.current.remove();
            routePolylineRef.current = null;
        }
    };

    const copyTransmitterUrl = (trackerKey) => {
        const fullUrl = `${window.location.origin}/tracker/${trackerKey}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedKey(trackerKey);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const openConfigModal = (v) => {
        setConfigVehicle(v);
        setConfigEnabled(!!v.gps_device_id || v.status !== 'offline');
        setConfigDeviceId(v.gps_device_id || `ELFAA-GPS-${v.id}`);
    };

    const filteredVehicles = fleetData.filter(v => {
        if (filterStatus === 'all') return true;
        return v.status === filterStatus;
    });

    return (
        <div className="space-y-6 text-left">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm transition-colors">
                <div>
                    <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-[#FF3B30] animate-pulse" />
                        <h2 className="text-lg font-black uppercase text-zinc-900 dark:text-white tracking-tight">
                            Fleet GPS Live Tracking & Telemetry
                        </h2>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                        Real-time smartphone & IoT tracker monitor • Synchronizes vehicle dispatch coordinates every 8 seconds.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-zinc-400">
                        Last sync: <strong className="text-zinc-800 dark:text-zinc-200">{lastRefreshed}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={fetchFleetLocations}
                        className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        title="Force Refresh Coordinates"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
                {[
                    { id: 'all', label: `All Vehicles (${fleetData.length})` },
                    { id: 'moving', label: `Moving (${fleetData.filter(v => v.status === 'moving').length})`, color: 'text-emerald-500' },
                    { id: 'idle', label: `Parked / Idle (${fleetData.filter(v => v.status === 'idle').length})`, color: 'text-amber-500' },
                    { id: 'offline', label: `Signal Lost (${fleetData.filter(v => v.status === 'offline').length})`, color: 'text-rose-500' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterStatus(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${filterStatus === tab.id
                                ? 'bg-[#FF3B30] text-white shadow-md shadow-[#FF3B30]/30'
                                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid Layout: Map Display on Left / Vehicle Telemetry List on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Interactive Map Frame */}
                <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col relative h-[520px]">
                    <div ref={mapContainerRef} className="w-full h-full z-0" />

                    {/* Active Route Trace Legend Overlay */}
                    {routeHistory && (
                        <div className="absolute top-4 left-4 z-[400] bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-xl flex items-center gap-3 text-xs text-white">
                            <div>
                                <span className="font-black text-[#FF3B30] block">Route Trace Active</span>
                                <span className="text-[10px] text-zinc-400">{routeHistory.vehicle.name} ({routeHistory.coordinates.length} waypoints)</span>
                            </div>
                            <button
                                type="button"
                                onClick={clearRouteTrace}
                                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Live Vehicle Cards Sidebar */}
                <div className="lg:col-span-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {filteredVehicles.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl text-center text-xs font-bold text-zinc-400">
                            No vehicles matching status "{filterStatus}".
                        </div>
                    ) : (
                        filteredVehicles.map(v => (
                            <div
                                key={v.id}
                                className={`p-4 rounded-2xl border transition-all duration-200 ${selectedVehicle?.id === v.id
                                        ? 'bg-zinc-50 dark:bg-zinc-850 border-[#FF3B30] shadow-md'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase leading-tight">
                                            {v.name}
                                        </h4>
                                        <span className="text-[11px] font-bold text-[#FF3B30] uppercase tracking-wider block mt-0.5">
                                            {v.plate_number} • {v.type}
                                        </span>
                                    </div>

                                    {/* Status Pill */}
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${v.status === 'moving'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                            : (v.status === 'idle' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500')
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'moving' ? 'bg-emerald-500 animate-ping' : (v.status === 'idle' ? 'bg-amber-500' : 'bg-rose-500')
                                            }`} />
                                        {v.status === 'moving' ? `${Math.round(v.speed)} km/h` : v.status}
                                    </span>
                                </div>

                                {/* Details Row */}
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">Coordinates</span>
                                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                                            {v.latitude ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}` : 'No signal yet'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-400 block uppercase">Last Ping</span>
                                        <span className="text-zinc-700 dark:text-zinc-300">{v.last_updated}</span>
                                    </div>
                                </div>

                                {v.active_renter && (
                                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                        <User className="w-3 h-3 text-[#FF3B30]" />
                                        <span>Rented to: <strong className="text-zinc-900 dark:text-white">{v.active_renter}</strong></span>
                                    </div>
                                )}

                                {/* Card Actions */}
                                <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleFocusVehicle(v)}
                                        className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        <MapPin className="w-3 h-3" />
                                        Focus Pin
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleViewRoute(v)}
                                        className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                                        title="View Route History"
                                    >
                                        <Activity className="w-3 h-3 text-[#FF3B30]" />
                                        Route
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => copyTransmitterUrl(v.gps_tracker_key)}
                                        className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Copy Mobile Phone Tracker Link"
                                    >
                                        {copiedKey === v.gps_tracker_key ? <Check className="w-3 h-3 text-emerald-500" /> : <Smartphone className="w-3 h-3 text-[#FF3B30]" />}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Transmitter Guide Helper Card */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs text-zinc-300 space-y-2">
                <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#FF3B30]" />
                    <span className="font-black text-white uppercase tracking-wider">How to test with your smartphone:</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                    1. Click the phone icon <strong className="text-white">"Smartphone"</strong> on any car card above to copy its unique transmitter URL.<br />
                    2. Send or open that URL in Google Chrome or Safari on your phone (e.g. <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-red-300 font-mono">http://[YOUR_IP]:8000/tracker/[KEY]</code>).<br />
                    3. Tap <strong className="text-white">"Start GPS Transmission"</strong> on the phone. Mount the phone inside the car, and its live coordinates will automatically pin and move on the map above!
                </p>
            </div>
        </div>
    );
}
