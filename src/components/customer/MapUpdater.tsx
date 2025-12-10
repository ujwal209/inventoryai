'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapUpdater({ center }: { center: { lat: number, lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}
