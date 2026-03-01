import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCheck, HiOutlineBookOpen } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getBooks, getCategories, getLocations, createBook, updateBook, deleteBook } from '../../services/api';

const statusColors = {
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-orange-100 text-orange-800',
  borrowed: 'bg-red-100 text-red-800',
};

export default function ManageBooks() {
  const { t } = useTranslation();
  const { admin, isSuperAdmin } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', status: 'available', location: '' });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadBooks = () => {
    const params = {};
    if (!isSuperAdmin && admin?.location?._id) {
      params.location = admin.location._id;
    }
    getBooks(params).then((res) => setBooks(res.data));
  };

  useEffect(() => {
    loadBooks();
    getCategories().then((res) => setCategories(res.data));
    if (isSuperAdmin) {
      getLocations().then((res) => setLocations(res.data));
    }
  }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', category: '', status: 'available', location: '' });
    setImageFile(null);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (book) => {
    setForm({
      title: book.title,
      description: book.description,
      category: book.category?._id || '',
      status: book.status,
      location: book.location?._id || '',
    });
    setImageFile(null);
    setEditing(book._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    await deleteBook(id);
    loadBooks();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('category', form.category);
    formData.append('status', form.status);
    if (isSuperAdmin && form.location) {
      formData.append('location', form.location);
    } else if (!isSuperAdmin && admin?.location?._id) {
      formData.append('location', admin.location._id);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editing) {
        await updateBook(editing, formData);
      } else {
        await createBook(formData);
      }
      resetForm();
      loadBooks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.manageBooks')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showForm ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlinePlus className="w-5 h-5" />}
          {showForm ? t('admin.cancel') : t('admin.addBook')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {editing ? t('admin.editBook') : t('admin.addBook')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.bookTitle')}
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.bookCategory')}
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('admin.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.locationCol')}
                </label>
                <select
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('admin.selectLocation')}</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.bookDescription')}
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.bookImage')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.bookStatus')}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="available">{t('books.available')}</option>
                <option value="reserved">{t('books.reserved')}</option>
                <option value="borrowed">{t('books.borrowed')}</option>
              </select>
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
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.bookImage')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.bookTitle')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.bookCategory')}</th>
              {isSuperAdmin && (
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.locationCol')}</th>
              )}
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.bookStatus')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.actionsCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.map((book) => (
              <tr key={book._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {book.image ? (
                    <img src={book.image} alt="" className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      <HiOutlineBookOpen className="w-5 h-5" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{book.title}</td>
                <td className="px-4 py-3 text-gray-600">{book.category?.name}</td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-gray-600">{book.location?.name || '-'}</td>
                )}
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[book.status]}`}>
                    {t(`books.${book.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(book)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                      {t('admin.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(book._id)}
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
