import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCheck, HiOutlineBookOpen, HiOutlineMagnifyingGlass, HiOutlineArrowUpTray, HiOutlineDocumentText, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getBooks, getCategories, getLocations, createBook, updateBook, deleteBook, bulkImportBooks } from '../../services/api';

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
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Bulk import state
  const [showImport, setShowImport] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      values.push(current.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      return row;
    });
  };

  const downloadTemplate = () => {
    const bom = '\uFEFF';
    const csv = bom + 'title,description,category,location\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await bulkImportBooks({ books: csvRows });
      setImportResult(res.data);
      if (res.data.created > 0) {
        loadBooks();
      }
    } catch (err) {
      setImportResult({ created: 0, errors: [{ row: 0, message: err.response?.data?.message || 'Import failed' }] });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setCsvRows([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadBooks = () => {
    const params = {};
    if (!isSuperAdmin && admin?.location?._id) {
      params.location = admin.location._id;
    }
    if (search) params.search = search;
    if (filterCategory) params.category = filterCategory;
    if (filterStatus) params.status = filterStatus;
    if (filterLocation && isSuperAdmin) params.location = filterLocation;
    getBooks(params).then((res) => setBooks(res.data));
  };

  useEffect(() => {
    loadBooks();
    getCategories().then((res) => setCategories(res.data));
    if (isSuperAdmin) {
      getLocations().then((res) => setLocations(res.data));
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [search, filterCategory, filterStatus, filterLocation]);

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('admin.manageBooks')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowImport(!showImport); if (showImport) resetImport(); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {showImport ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineArrowUpTray className="w-5 h-5" />}
            {showImport ? t('admin.cancel') : t('admin.bulkImport')}
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
            aria-expanded={showForm}
          >
            {showForm ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlinePlus className="w-5 h-5" />}
            {showForm ? t('admin.cancel') : t('admin.addBook')}
          </button>
        </div>
      </div>

      {/* Bulk Import Section */}
      {showImport && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <HiOutlineDocumentText className="w-5 h-5" />
            {t('admin.bulkImport')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.bulkImportHint')}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              <HiOutlineDocumentText className="w-4 h-4" />
              {t('admin.downloadTemplate')}
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300 font-mono">
            title,description,category,location<br />
            كتاب الأطفال,وصف الكتاب,قصص أطفال,المكتبة الرئيسية
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="w-full text-sm text-gray-500 dark:text-gray-400 file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />

          {csvRows.length > 0 && (
            <>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-start text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                      {Object.keys(csvRows[0]).map((h) => (
                        <th key={h} className="px-3 py-2 text-start text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {csvRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-1.5 text-gray-400 dark:text-gray-500">{i + 1}</td>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-1.5 text-gray-700 dark:text-gray-200 max-w-[200px] truncate">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('admin.bulkImportRows', { count: csvRows.length })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlineArrowUpTray className="w-5 h-5" />
                  {importing ? t('admin.importing') : t('admin.importBooks')}
                </button>
                <button
                  onClick={resetImport}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
              </div>
            </>
          )}

          {importResult && (
            <div className="space-y-2">
              {importResult.created > 0 && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg">
                  <HiOutlineCheckCircle className="w-5 h-5 shrink-0" />
                  {t('admin.bulkImportSuccess', { count: importResult.created })}
                </div>
              )}
              {importResult.errors?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 space-y-1">
                  <p className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm">
                    <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                    {t('admin.bulkImportErrors', { count: importResult.errors.length })}
                  </p>
                  <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                    {importResult.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>
                        {t('admin.bulkImportRowError', { row: err.row, message: err.message })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {editing ? t('admin.editBook') : t('admin.addBook')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="book-title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.bookTitle')}
              </label>
              <input
                id="book-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="book-category" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.bookCategory')}
              </label>
              <select
                id="book-category"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('admin.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {isSuperAdmin && (
              <div>
                <label htmlFor="book-location" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {t('admin.locationCol')}
                </label>
                <select
                  id="book-location"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">{t('admin.selectLocation')}</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label htmlFor="book-description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.bookDescription')}
              </label>
              <textarea
                id="book-description"
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="book-image" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.bookImage')}
              </label>
              <input
                id="book-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
            <div>
              <label htmlFor="book-status" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                {t('admin.bookStatus')}
              </label>
              <select
                id="book-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <HiOutlineMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder={t('admin.searchBooks')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-9 pe-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              aria-label={t('admin.searchBooks')}
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
            aria-label={t('books.allCategories')}
          >
            <option value="">{t('books.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
            aria-label={t('admin.allStatuses')}
          >
            <option value="">{t('admin.allStatuses')}</option>
            <option value="available">{t('books.available')}</option>
            <option value="reserved">{t('books.reserved')}</option>
            <option value="borrowed">{t('books.borrowed')}</option>
          </select>
          {isSuperAdmin && (
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              aria-label={t('books.allLocations')}
            >
              <option value="">{t('books.allLocations')}</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.bookImage')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.bookTitle')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.bookCategory')}</th>
              {isSuperAdmin && (
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.locationCol')}</th>
              )}
              <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.bookStatus')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.actionsCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {books.map((book) => (
              <tr key={book._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  {book.image ? (
                    <img src={book.image} alt="" className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <HiOutlineBookOpen className="w-5 h-5" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{book.title}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{book.category?.name}</td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{book.location?.name || '-'}</td>
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
