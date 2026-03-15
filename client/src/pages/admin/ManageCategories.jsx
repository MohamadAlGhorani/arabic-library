import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheck, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';

export default function ManageCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const loadCategories = () => getCategories().then((res) => setCategories(res.data));

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await updateCategory(editing, { name });
      } else {
        await createCategory({ name });
      }
      setName('');
      setEditing(null);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (cat) => {
    setName(cat.name);
    setEditing(cat._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleCancel = () => {
    setName('');
    setEditing(null);
    setError('');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('admin.manageCategories')}</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          {editing ? t('admin.editCategory') : t('admin.addCategory')}
        </h2>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-3">{error}</div>
        )}
        <div className="flex gap-3">
          <input
            id="category-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('admin.categoryName')}
            aria-label={t('admin.categoryName')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <HiOutlineCheck className="w-4 h-4" />
            {t('admin.save')}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <HiOutlineXMark className="w-4 h-4" />
              {t('admin.cancel')}
            </button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.categoryName')}</th>
              <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.actionsCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {categories.map((cat) => (
              <tr key={cat._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{cat.name}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                      {t('admin.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
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
