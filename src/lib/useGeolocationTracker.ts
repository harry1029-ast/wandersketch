'use client';

import { useState, useEffect, useRef } from 'react';
import { Landmark } from '@/types/itinerary';
import { playChime, playVoiceNarrator } from '@/lib/audio';

interface GeolocationTrackerProps {
    landmarks: Landmark[];
    fallbackCoords: [number, number];
    enabled: boolean;
}

export function useGeolocationTracker({
    landmarks,
    fallbackCoords,
    enabled,
}: GeolocationTrackerProps) {
    const [coords, setCoords] = useState<[number, number]>(fallbackCoords);
    const [heading, setHeading] = useState<number | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [isTracking, setIsTracking] = useState<boolean>(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    // Keep landmark array reference stable to prevent infinite render loops
    const landmarksRef = useRef<Landmark[]>(landmarks);
    landmarksRef.current = landmarks;

    const triggeredSpotsRef = useRef<Set<string>>(new Set());
    const prevCoordsRef = useRef<[number, number]>(fallbackCoords);

    // Haversine distance calculation in meters
    const computeDistanceMeters = (
        [lat1, lon1]: [number, number],
        [lat2, lon2]: [number, number]
    ): number => {
        const R = 6371e3;
        const rad = Math.PI / 180;
        const dLat = (lat2 - lat1) * rad;
        const dLon = (lon2 - lon1) * rad;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    useEffect(() => {
        if (!enabled) {
            setIsTracking(false);
            return;
        }

        if (typeof window === 'undefined' || !('geolocation' in navigator)) {
            setGeoError('Geolocation is not supported by your browser.');
            return;
        }

        setIsTracking(true);
        setGeoError(null);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const currentPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];

                // Filter out microscopic GPS jitter (< 0.5m drift) to protect React render cycles
                const drift = computeDistanceMeters(prevCoordsRef.current, currentPos);
                if (drift >= 0.5) {
                    prevCoordsRef.current = currentPos;
                    setCoords(currentPos);
                }

                setHeading(pos.coords.heading);
                setAccuracy(pos.coords.accuracy);

                // Geofencing check against current landmarks (using stable ref)
                landmarksRef.current.forEach((lm) => {
                    const dist = computeDistanceMeters(currentPos, lm.coords);
                    if (dist <= 35 && !triggeredSpotsRef.current.has(lm.id)) {
                        triggeredSpotsRef.current.add(lm.id);
                        playChime('bell');
                        playVoiceNarrator(`Approaching ${lm.name}. ${lm.audioNote}`);
                    }
                });
            },
            (err) => {
                console.warn('Geolocation watch error:', err.message);
                setGeoError(err.message);
                setIsTracking(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 1000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [enabled]); // Only re-subscribe if enabled/disabled state toggles

    return {
        coords,
        heading,
        accuracy,
        isTracking,
        geoError,
    };
}