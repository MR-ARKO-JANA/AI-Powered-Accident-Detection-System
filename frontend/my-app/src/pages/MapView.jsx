import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { accidentAPI, locationAPI } from '../services/api';

// Fix default marker icons for Leaflet + webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (emoji, color) => {
    return L.divIcon({
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${emoji}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const severityColors = {
    severe: '#DC2626', moderate: '#F59E0B', minor: '#3B82F6'
};

const MapView = () => {
    const [accidents, setAccidents] = useState([]);
    const [locations, setLocations] = useState([]);
    const [layers, setLayers] = useState({ accidents: true, hospitals: true, police: true });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, locRes] = await Promise.all([
                    accidentAPI.getAll({ limit: 100 }),
                    locationAPI.getAll()
                ]);
                setAccidents(accRes.data.data);
                setLocations(locRes.data.data);
            } catch (error) {
                console.error('Map data fetch error:', error);
            }
        };
        fetchData();
    }, []);

    const toggleLayer = (layer) => {
        setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    const hospitals = locations.filter(l => l.type === 'hospital');
    const police = locations.filter(l => l.type === 'police');

    // Calculate center from data
    const allCoords = [
        ...accidents.map(a => [a.location?.lat, a.location?.lng]).filter(c => c[0] && c[1]),
        ...locations.map(l => [l.coordinates?.lat, l.coordinates?.lng]).filter(c => c[0] && c[1])
    ];
    const center = allCoords.length > 0
        ? [allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length, allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length]
        : [22.5726, 88.3639]; // Default: Kolkata

    return (
        <div className="page-container" style={{ padding: '16px' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Map View</h1>
                    <p className="page-subtitle">Accident locations, hospitals & police stations</p>
                </div>
            </div>

            <div className="map-controls">
                <button className={`map-toggle ${layers.accidents ? 'active' : ''}`} onClick={() => toggleLayer('accidents')}>
                    🚗 Accidents ({accidents.length})
                </button>
                <button className={`map-toggle ${layers.hospitals ? 'active' : ''}`} onClick={() => toggleLayer('hospitals')}>
                    🏥 Hospitals ({hospitals.length})
                </button>
                <button className={`map-toggle ${layers.police ? 'active' : ''}`} onClick={() => toggleLayer('police')}>
                    🚔 Police ({police.length})
                </button>
            </div>

            <div className="map-container">
                <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {/* Accident Markers */}
                    {layers.accidents && accidents.map((accident) => {
                        if (!accident.location?.lat || !accident.location?.lng) return null;
                        const sev = accident.severity?.toLowerCase() || 'minor';
                        return (
                            <Marker
                                key={accident._id}
                                position={[accident.location.lat, accident.location.lng]}
                                icon={createIcon('🚗', severityColors[sev] || '#3B82F6')}
                            >
                                <Popup>
                                    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '200px' }}>
                                        <strong style={{ color: severityColors[sev] }}>
                                            {sev.toUpperCase()} Accident
                                        </strong>
                                        <br />
                                        <span style={{ fontSize: '12px' }}>
                                            {accident.location.address || 'Unknown location'}
                                        </span>
                                        <br />
                                        <span style={{ fontSize: '11px', color: '#666' }}>
                                            {new Date(accident.detectedAt || accident.createdAt).toLocaleString()}
                                        </span>
                                        <br />
                                        <a href={`/accidents/${accident._id}`} style={{ fontSize: '12px' }}>
                                            View Details →
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Hospital Markers */}
                    {layers.hospitals && hospitals.map((loc) => (
                        <Marker
                            key={loc._id}
                            position={[loc.coordinates.lat, loc.coordinates.lng]}
                            icon={createIcon('🏥', '#2563EB')}
                        >
                            <Popup>
                                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <strong>🏥 {loc.name}</strong><br />
                                    <span style={{ fontSize: '12px' }}>📞 {loc.contactNumber}</span><br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>{loc.address}</span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Police Markers */}
                    {layers.police && police.map((loc) => (
                        <Marker
                            key={loc._id}
                            position={[loc.coordinates.lat, loc.coordinates.lng]}
                            icon={createIcon('🚔', '#16A34A')}
                        >
                            <Popup>
                                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <strong>🚔 {loc.name}</strong><br />
                                    <span style={{ fontSize: '12px' }}>📞 {loc.contactNumber}</span><br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>{loc.address}</span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapView;
