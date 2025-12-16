import React from 'react';

export default function BookForm({
  view,
  formData,
  setFormData,
  handleAddBook,
  handleUpdateBook,
  currentUser,
  setView,
  setEditingBook,
  formErrors,
  setFormErrors
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">{view === 'add-book' ? 'Add New Book' : 'Edit Book'}</h2>
      <div className="grid gap-4">
        <input
          type="text"
          placeholder="Title"
          value={formData.title || ''}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="p-3 border rounded"
        />
        {formErrors.title && <p className="text-red-500 text-sm">{formErrors.title}</p>}
        <input
          type="text"
          placeholder="Author"
          value={formData.author || ''}
          onChange={(e) => setFormData({...formData, author: e.target.value})}
          className="p-3 border rounded"
        />
        {formErrors.author && <p className="text-red-500 text-sm">{formErrors.author}</p>}
        <select
          value={formData.genre || ''}
          onChange={(e) => setFormData({...formData, genre: e.target.value})}
          className="p-3 border rounded"
        >
          <option value="">Select Genre</option>
          <option value="Fiction">Fiction</option>
          <option value="Fantasy">Fantasy</option>
          <option value="Science">Science</option>
          <option value="Romance">Romance</option>
          <option value="History">History</option>
          <option value="Technology">Technology</option>
          <option value="Biography">Biography</option>
          <option value="Horror">Horror</option>
          <option value="Self-Help">Self-Help</option>
        </select>
        <select
          value={formData.status || ''}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          className="p-3 border rounded"
        >
          <option value="">Select Status</option>
          <option value="To Read">To Read</option>
          <option value="Reading">Reading</option>
          <option value="Completed">Completed</option>
        </select>
        <input
          type="number"
          placeholder="Number of Pages"
          value={formData.pages || ''}
          onChange={(e) => setFormData({...formData, pages: e.target.value})}
          className="p-3 border rounded"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={formData.price || ''}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          className="p-3 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              const errors = {};
              if (!formData.title) errors.title = 'Title is required';
              if (!formData.author) errors.author = 'Author is required';
              setFormErrors(errors);
              if (Object.keys(errors).length > 0) return;
              if (view === 'add-book') handleAddBook(); else handleUpdateBook();
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            disabled={!currentUser || !formData.title || !formData.author}
          >
            {view === 'add-book' ? 'Add Book' : 'Update Book'}
          </button>
          <button
            onClick={() => { setView('dashboard'); setFormData({}); setEditingBook && setEditingBook(null); }}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
