import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineBuildingStorefront,
} from 'react-icons/hi2';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../../services/api';

export default function ManageLocations() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadLocations = () => getLocations().then((res) => setLocations(res.data));

  useEffect(() => {
    loadLocations();
  }, []);

  const resetForm = () => {
    setForm({ name: '', address: '', phone: '', description: '' });
    setImageFile(null);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (loc) => {
    setForm({
      name: loc.name,
      address: loc.address || '',
      phone: loc.phone || '',
      description: loc.description || '',
    });
    setImageFile(null);
    setEditing(loc._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteLocation(id);
      loadLocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('address', form.address);
    formData.append('phone', form.phone);
    formData.append('description', form.description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editing) {
        await updateLocation(editing, formData);
      } else {
        await createLocation(formData);
      }
      resetForm();
      loadLocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.manageLocations')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          aria-expanded={showForm}
        >
          {showForm ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlinePlus className="w-5 h-5" />}
          {showForm ? t('admin.cancel') : t('admin.addLocation')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {editing ? t('admin.editLocation') : t('admin.addLocation')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loc-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.locationName')}
              </label>
              <input
                id="loc-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="loc-phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.locationPhone')}
              </label>
              <input
                id="loc-phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="loc-address" className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.locationAddress')}
              </label>
              <input
                id="loc-address"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="loc-description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.locationDescription')}
              </label>
              <textarea
                id="loc-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="loc-image" className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.locationImage')}
              </label>
              <input
                id="loc-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <HiOutlineCheck className="w-5 h-5" />
            {saving ? t('admin.saving') : t('admin.save')}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.locationImage')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.locationName')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.locationAddress')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.locationPhone')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.actionsCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.map((loc) => (
              <tr key={loc._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {loc.image ? (
                    <img src={loc.image} alt="" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      <HiOutlineBuildingStorefront className="w-5 h-5" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{loc.name}</td>
                <td className="px-4 py-3 text-gray-600">{loc.address || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{loc.phone || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(loc)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                      {t('admin.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(loc._id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      {t('admin.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
