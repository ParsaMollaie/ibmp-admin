import L from 'leaflet';
import { useEffect } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

// Tehran — used as the default pin/center when no location is set yet.
const DEFAULT_CENTER: [number, number] = [35.6892, 51.389];

// Brand-orange pin, built as an inline SVG so it doesn't depend on Leaflet's bundler-unfriendly default marker images.
const ORANGE_ICON = L.divIcon({
  className: '',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26c0-7.732-6.268-14-14-14z" fill="#ff7600"/>
    <circle cx="14" cy="14" r="5.5" fill="white"/>
  </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
});

type MapPickerProps = {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (latitude: number, longitude: number) => void;
};

const ClickHandler = ({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * Leaflet measures its container once at init. If that measurement happens before the
 * modal's layout has settled (tab/section mount transitions, address rows added/removed,
 * etc.), the map's internal tile offsets go stale and it renders shifted outside its
 * wrapper until something forces a resize. A ResizeObserver keeps it in sync.
 */
const MapResizeHandler = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const raf = requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [map]);

  return null;
};

const MapPicker = ({ latitude, longitude, onChange }: MapPickerProps) => {
  const hasPosition =
    typeof latitude === 'number' && typeof longitude === 'number';
  const position: [number, number] = hasPosition
    ? [latitude as number, longitude as number]
    : DEFAULT_CENTER;

  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        height: 280,
        width: '100%',
        overflow: 'hidden',
        borderRadius: 8,
      }}
      dir="ltr"
    >
      <MapContainer
        center={position}
        zoom={hasPosition ? 14 : 11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker
          position={position}
          icon={ORANGE_ICON}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
        <ClickHandler onChange={onChange} />
        <MapResizeHandler />
      </MapContainer>
    </div>
  );
};

export default MapPicker;
