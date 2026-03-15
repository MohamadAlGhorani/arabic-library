import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HiOutlineBuildingStorefront,
  HiOutlineMapPin,
  HiOutlinePhone,
} from 'react-icons/hi2';
import { getLocations } from '../services/api';
import LocationDetailModal from '../components/LocationDetailModal';

// Fix default marker icon (leaflet CSS path issue with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Locations() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    getLocations()
      .then((res) => setLocations(res.data))
      .catch((err) => console.error('Failed to load locations:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400" role="status">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        {t('reports.loading')}
      </div>
    );
  }

  // Only locations with coordinates appear on the map
  const mappable = locations.filter((loc) => loc.lat != null && loc.lng != null);

  // Compute map center: average of all mappable locations, or default (Netherlands)
  const defaultCenter = [52.37, 4.9]; // Amsterdam
  const center = mappable.length > 0
    ? [
        mappable.reduce((sum, l) => sum + l.lat, 0) / mappable.length,
        mappable.reduce((sum, l) => sum + l.lng, 0) / mappable.length,
      ]
    : defaultCenter;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        {t('locations.title')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {t('locations.subtitle')}
      </p>

      {/* Map */}
      {mappable.length > 0 && (
        <div className="rounded-xl overflow-hidden shadow-lg mb-8 border border-gray-200 dark:border-gray-700">
          <MapContainer
            center={center}
            zoom={mappable.length === 1 ? 14 : 10}
            scrollWheelZoom={false}
            style={{ height: '400px', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappable.map((loc) => (
              <Marker key={loc._id} position={[loc.lat, loc.lng]}>
                <Popup>
                  <div className="text-center min-w-[150px]">
                    <p className="font-semibold text-gray-800 mb-1">{loc.name}</p>
                    {loc.address && (
                      <p className="text-xs text-gray-500 mb-2">{loc.address}</p>
                    )}
                    <button
                      onClick={() => setSelectedLocation(loc)}
                      className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      {t('locations.viewDetails')}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Location cards grid */}
      {locations.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">
          {t('locations.noLocations')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <button
              key={loc._id}
              onClick={() => setSelectedLocation(loc)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden text-start cursor-pointer border border-gray-100 dark:border-gray-700"
            >
              {/* Card image */}
              <div className="h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {loc.image ? (
                  <img
                    src={loc.image}
                    alt={loc.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
                    <HiOutlineBuildingStorefront className="w-12 h-12" />
                  </div>
                )}
              </div>
              {/* Card body */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5">
                  {loc.name}
                </h3>
                {loc.address && (
                  <p className="flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <HiOutlineMapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{loc.address}</span>
                  </p>
                )}
                {loc.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <HiOutlinePhone className="w-4 h-4 shrink-0" />
                    {loc.phone}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedLocation && (
        <LocationDetailModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}
