import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getAdmins, createAdmin, updateAdmin, toggleAdmin, deleteAdmin, getLocations } from '../../services/api';

const roleColors = {
  super_admin: 'bg-purple-100 text-purple-800',
  location_admin: 'bg-blue-100 text-blue-800',
};

export default function ManageAdmins() {
  const { t } = useTranslation();
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'location_admin',
    location: '',
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadAdmins = () => {
    const params = {};
    if (search) params.search = search;
    if (filterRole) params.role = filterRole;
    if (filterLocation) params.location = filterLocation;
    if (filterStatus) params.isActive = filterStatus;
    getAdmins(params).then((res) => setAdmins(res.data));
  };

  useEffect(() => {
    loadAdmins();
    getLocations().then((res) => setLocations(res.data));
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [search, filterRole, filterLocation, filterStatus]);

  const resetForm = () => {
    setForm({ username: '', password: '', fullName: '', email: '', phone: '', role: 'location_admin', location: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (adm) => {
    setForm({
      username: adm.username,
      password: '',
      fullName: adm.fullName || '',
      email: adm.email || '',
      phone: adm.phone || '',
      role: adm.role,
      location: adm.location?._id || '',
    });
    setEditing(adm._id);
    setShowForm(true);
  };

  const handleToggle = async (id) => {
    await toggleAdmin(id);
    loadAdmins();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteAdmin(id);
      loadAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      username: form.username,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      location: form.role === 'location_admin' ? form.location : null,
    };
    if (form.password) {
      data.password = form.password;
    }

    try {
      if (editing) {
        await updateAdmin(editing, data);
      } else {
        await createAdmin(data);
      }
      resetForm();
      loadAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('admin.manageAdmins')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          aria-expanded={showForm}
        >
          {showForm ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlinePlus className="w-5 h-5" />}
          {showForm ? t('admin.cancel') : t('admin.addAdmin')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {editing ? t('admin.editAdmin') : t('admin.addAdmin')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="adm-username" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.adminUsername')}
              </label>
              <input
                id="adm-username"
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="adm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.adminPassword')}
                {editing && <span className="text-gray-400 dark:text-gray-500 ms-1">({t('admin.passwordOptional')})</span>}
              </label>
              <input
                id="adm-password"
                type="password"
                required={!editing}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? t('admin.passwordOptional') : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="adm-fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.adminFullName')}
              </label>
              <input
                id="adm-fullname"
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="adm-email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.adminEmail')}
              </label>
              <input
                id="adm-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="adm-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.adminPhone')}
              </label>
              <input
                id="adm-phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="adm-role" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.adminRole')}
              </label>
              <select
                id="adm-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="location_admin">{t('admin.roleLocationAdmin')}</option>
                <option value="super_admin">{t('admin.roleSuperAdmin')}</option>
              </select>
            </div>
            {form.role === 'location_admin' && (
              <div>
                <label htmlFor="adm-location" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('admin.adminLocation')}
                </label>
                <select
                  id="adm-location"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="">{t('admin.selectLocation')}</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            )}
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <HiOutlineMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder={t('admin.searchAdmins')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-9 pe-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              aria-label={t('admin.searchAdmins')}
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('admin.adminRole')}
          >
            <option value="">{t('admin.adminRole')}</option>
            <option value="super_admin">{t('admin.roleSuperAdmin')}</option>
            <option value="location_admin">{t('admin.roleLocationAdmin')}</option>
          </select>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('books.allLocations')}
          >
            <option value="">{t('books.allLocations')}</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>{loc.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('admin.adminStatus')}
          >
            <option value="">{t('admin.adminStatus')}</option>
            <option value="true">{t('admin.active')}</option>
            <option value="false">{t('admin.inactive')}</option>
          </select>
        </div>
      </div>

      {admins.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center text-gray-500 dark:text-gray-400">
          {t('admin.noAdmins')}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.adminUsername')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.adminFullName')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.adminRole')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.locationCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.adminEmail')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.adminStatus')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.lastLoginCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {admins.map((adm) => (
                <tr key={adm._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{adm.username}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{adm.fullName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[adm.role]}`}>
                      {adm.role === 'super_admin' ? t('admin.roleSuperAdmin') : t('admin.roleLocationAdmin')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{adm.location?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{adm.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      adm.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {adm.isActive ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(adm.lastLogin)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleEdit(adm)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => handleToggle(adm._id)}
                        className={`text-xs px-2 py-1 rounded ${
                          adm.isActive
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {adm.isActive ? t('admin.deactivate') : t('admin.activate')}
                      </button>
                      {adm._id !== currentAdmin?._id && (
                        <button
                          onClick={() => handleDelete(adm._id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                          {t('admin.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
