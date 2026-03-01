import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCalendarDays, HiOutlineClock, HiOutlinePlus, HiOutlineXMark, HiOutlineCheck } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getSettings, updateSettings, getLocations } from '../../services/api';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function ManageSettings() {
  const { t } = useTranslation();
  const { admin, isSuperAdmin } = useAuth();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [openDays, setOpenDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ from: '09:00', to: '10:00' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Determine location ID to use
  const locationId = isSuperAdmin ? selectedLocation : admin?.location?._id;

  useEffect(() => {
    if (isSuperAdmin) {
      getLocations().then((res) => {
        setLocations(res.data);
        if (res.data.length > 0) {
          setSelectedLocation(res.data[0]._id);
        }
      });
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!locationId) return;
    getSettings(locationId).then((res) => {
      setOpenDays(res.data.openDays);
      setTimeSlots(res.data.timeSlots);
    });
  }, [locationId]);

  const dayNames = [
    t('settings.sunday'),
    t('settings.monday'),
    t('settings.tuesday'),
    t('settings.wednesday'),
    t('settings.thursday'),
    t('settings.friday'),
    t('settings.saturday'),
  ];

  const toggleDay = (day) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const addSlot = () => {
    const slot = `${newSlot.from} - ${newSlot.to}`;
    if (!timeSlots.includes(slot)) {
      setTimeSlots((prev) => [...prev, slot].sort());
    }
  };

  const removeSlot = (slot) => {
    setTimeSlots((prev) => prev.filter((s) => s !== slot));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings({ openDays, timeSlots, locationId });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>
        {isSuperAdmin && locations.length > 0 && (
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>{loc.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Open Days */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <HiOutlineCalendarDays className="w-5 h-5 text-emerald-600" />
          {t('settings.openDays')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                openDays.includes(day)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dayNames[day]}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <HiOutlineClock className="w-5 h-5 text-emerald-600" />
          {t('settings.timeSlots')}
        </h2>

        {/* Existing slots */}
        <div className="flex flex-wrap gap-2 mb-4">
          {timeSlots.map((slot) => (
            <div
              key={slot}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg text-sm"
            >
              <span>{slot}</span>
              <button
                onClick={() => removeSlot(slot)}
                className="text-emerald-600 hover:text-red-600 transition-colors"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </div>
          ))}
          {timeSlots.length === 0 && (
            <p className="text-gray-400 text-sm">{t('settings.noSlots')}</p>
          )}
        </div>

        {/* Add new slot */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-gray-600">{t('settings.from')}</label>
          <input
            type="time"
            value={newSlot.from}
            onChange={(e) => setNewSlot({ ...newSlot, from: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <label className="text-sm text-gray-600">{t('settings.to')}</label>
          <input
            type="time"
            value={newSlot.to}
            onChange={(e) => setNewSlot({ ...newSlot, to: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={addSlot}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            <HiOutlinePlus className="w-4 h-4" />
            {t('settings.addSlot')}
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <HiOutlineCheck className="w-5 h-5" />
          {saving ? t('admin.saving') : t('admin.save')}
        </button>
        {saved && (
          <span className="text-green-600 text-sm font-medium">{t('settings.saved')}</span>
        )}
      </div>
    </div>
  );
}
