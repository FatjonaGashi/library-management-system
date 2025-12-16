import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Edit2, Trash2, Users, BarChart3, Sparkles, LogOut, User } from 'lucide-react';
import { processAIQuery, generateInsights, generateRecommendations } from './ai-utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import api from './services/api';
import BookForm from './components/BookForm';
import AIQuery from './components/AIQuery';
import StatCards from './components/StatCards';
import Profile from './components/Profile';

export default function LibraryManagementSystem() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', email: 'admin@library.com', password: 'admin123', role: 'admin' },
    { id: 2, name: 'John Doe', email: 'john@example.com', password: 'user123', role: 'user' }
  ]);
  
  const [books, setBooks] = useState([
    { id: 1, title: '1984', author: 'George Orwell', genre: 'Fiction', status: 'Completed', userId: 2, pages: 328, price: 15.99 },
    { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', status: 'Reading', userId: 2, pages: 324, price: 14.99 },
    { id: 3, title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', status: 'Completed', userId: 1, pages: 310, price: 18.99 },
    { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Non-Fiction', status: 'To Read', userId: 2, pages: 443, price: 22.99 }
  ]);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [editingBook, setEditingBook] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [useServerAI, setUseServerAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  // Respect user preference for reduced motion
  const shouldReduceMotion = useReducedMotion();

  const handleLogin = async (email, password) => {
    // Try server login first, fall back to local demo users
    try {
      const data = await api.auth.login(email, password);
      if (data?.token) {
        setCurrentUser({ ...data.user, token: data.token });
        setView('dashboard');
        return;
      }
    } catch (err) {
      // Server unavailable or login failed — fall back to local users
      // console.warn('Server login failed', err?.message);
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setView('dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleRegister = async (name, email, password) => {
    // Try server register first, fall back to local behavior
    try {
      const data = await api.auth.register(name, email, password);
      if (data?.token) {
        setCurrentUser({ ...data.user, token: data.token });
        setView('dashboard');
        return;
      }
    } catch (err) {
      // Server register failed — continue to local fallback
      // console.warn('Server register failed', err?.message);
    }

    if (users.find(u => u.email === email)) {
      alert('Email already exists');
      return;
    }
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password,
      role: 'user'
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    // Clear current user and return to login view
    setCurrentUser(null);
    setView('login');
  };

  const handleUpdateProfile = async ({ name, email, password }) => {
    if (!currentUser) return;
    // Try server update first
    try {
      const payload = { name, email };
      if (password) payload.password = password;
      const data = await api.auth.update(payload);
      if (data?.user) {
        setCurrentUser(prev => ({ ...prev, ...data.user }));
        // keep token if present in existing currentUser
        setView('dashboard');
        return;
      }
    } catch (err) {
      // Server update failed — fallback to local update
    }

    // Local fallback: update users array and currentUser
    setUsers(prev => prev.map(u => u.id === currentUser.id ? ({ ...u, name, email, password: password || u.password }) : u));
    setCurrentUser(prev => ({ ...prev, name, email }));
    // Also update localStorage user representation if present
    try { localStorage.setItem('user', JSON.stringify({ ...currentUser, name, email })); } catch (e) {}
    setView('dashboard');
  };

  const handleAddBook = () => {
    const newBook = {
      ...formData,
      pages: parseInt(formData.pages, 10) || 0,
      price: parseFloat(formData.price) || 0
    };
    if (!currentUser) {
      alert('You must be logged in to add a book');
      return;
    }
    if (!newBook.title || !newBook.author) {
      alert('Please provide a book title and author.');
      return;
    }

    (async () => {
      try {
        const created = await api.books.create(newBook);
        setBooks(prev => [...prev, created]);
      } catch (err) {
        const fallbackBook = { id: books.length + 1, userId: currentUser?.id || null, ...newBook };
        setBooks(prev => [...prev, fallbackBook]);
      } finally {
        setFormData({});
        setView('dashboard');
      }
    })();
  };

  const handleUpdateBook = () => {
    const updatedFields = {
      ...formData,
      pages: parseInt(formData.pages, 10) || 0,
      price: parseFloat(formData.price) || 0
    };
    if (!currentUser) {
      alert('You must be logged in to update a book');
      return;
    }
    if (!updatedFields.title || !updatedFields.author) {
      alert('Please provide a book title and author.');
      return;
    }
    (async () => {
      try {
        const updated = await api.books.update(editingBook.id, updatedFields);
        setBooks(prev => prev.map(b => b.id === editingBook.id ? updated : b));
      } catch (err) {
        setBooks(prev => prev.map(b => b.id === editingBook.id ? { ...editingBook, ...updatedFields } : b));
      } finally {
        setEditingBook(null);
        setFormData({});
        setView('dashboard');
      }
    })();
  };

  const handleDeleteBook = (id) => {
    if (typeof window !== 'undefined' ? window.confirm('Are you sure you want to delete this book?') : true) {
      (async () => {
        try {
          await api.books.delete(id);
          setBooks(prev => prev.filter(b => b.id !== id));
        } catch (err) {
          setBooks(prev => prev.filter(b => b.id !== id));
        }
      })();
    }
  };

  const handleDeleteUser = (id) => {
    if (id === currentUser?.id) {
      alert('Cannot delete your own account');
      return;
    }
    if (typeof window !== 'undefined' ? window.confirm('Are you sure you want to delete this user?') : true) {
      (async () => {
        try {
          await api.users.delete(id);
          if (currentUser?.role === 'admin') {
            const updated = await api.users.getAll();
            setUsers(updated);
          } else {
            setUsers(prev => prev.filter(u => u.id !== id));
          }
          setBooks(prev => prev.filter(b => b.userId !== id));
        } catch (err) {
          setUsers(prev => prev.filter(u => u.id !== id));
          setBooks(prev => prev.filter(b => b.userId !== id));
        }
      })();
    }
  };

  // Handle AI query from AIQuery component
  const handleAIQuery = async () => {
    setAiLoading(true);
    try {
      let res;
      // Filter books and users based on current user's role before processing
      const aiBooks = currentUser?.role === 'admin' ? books : (currentUser ? books.filter(b => b.userId === currentUser.id) : []);
      const aiUsers = currentUser?.role === 'admin' ? users : (currentUser ? users.filter(u => u.id === currentUser.id) : []);

      if (useServerAI) {
        if (!currentUser?.token) {
          // No token — cannot call server AI, fallback to local process and inform the user
          const fallbackText = { type: 'text', result: 'Server AI requires authentication. Using local AI instead.' };
          const localRes = processAIQuery(aiQuery, aiBooks, aiUsers, currentUser?.id);
          res = localRes;
          if (res?.type === 'text') {
            res.result = `${fallbackText.result} ${res.result}`;
          }
        } else {
          try {
            res = await api.ai.query(aiQuery);
          } catch (err) {
            // Server call failed — fall back to local
            const localRes = processAIQuery(aiQuery, aiBooks, aiUsers, currentUser?.id);
            res = localRes;
            if (res?.type === 'text') {
              res.result = `Server AI failed. Using local AI instead. ${res.result}`;
            }
          }
        }
      } else {
        res = processAIQuery(aiQuery, aiBooks, aiUsers, currentUser?.id);
      }

      setAiResponse(res);
      setShowRecommendations(res?.type === 'table');
    } catch (err) {
      setAiResponse({ type: 'text', result: 'An error occurred processing the AI query.' });
    } finally {
      setAiLoading(false);
    }
  };

  // Hydrate user from localStorage if available
  useEffect(() => {
    const stored = api.auth.getCurrentUser();
    if (stored) setCurrentUser(stored);
  }, []);

  // If Login or Register view, render auth UI
  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Library System</h1>
          </div>
          {view === 'login' ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Login</h2>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border rounded mb-3"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border rounded mb-4"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                onClick={() => handleLogin(formData.email, formData.password)}
                className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 mb-3"
              >
                Login
              </button>
              <button
                onClick={() => setView('register')}
                className="w-full text-indigo-600 hover:underline"
              >
                Don't have an account? Register
              </button>
              <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                <p className="font-semibold">Demo Accounts:</p>
                <p>Admin: admin@library.com / admin123</p>
                <p>User: john@example.com / user123</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Register</h2>
              <input
                type="text"
                placeholder="Name"
                className="w-full p-3 border rounded mb-3"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border rounded mb-3"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border rounded mb-4"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                onClick={() => handleRegister(formData.name, formData.email, formData.password)}
                className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 mb-3"
              >
                Register
              </button>
              <button
                onClick={() => setView('login')}
                className="w-full text-indigo-600 hover:underline"
              >
                Already have an account? Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Compute displayBooks for dashboard view (admin sees all books, others see own books)
  const displayBooks = currentUser?.role === 'admin'
    ? books
    : (currentUser ? books.filter(b => b.userId === currentUser.id) : []);


  // Map genres to subtle color classes for pills / accents
  const genreClasses = {
    'Fantasy': 'bg-purple-50 text-purple-700',
    'Fiction': 'bg-blue-50 text-blue-700',
    'Non-Fiction': 'bg-green-50 text-green-700',
    'Science Fiction': 'bg-indigo-50 text-indigo-700',
    'Science': 'bg-indigo-50 text-indigo-700',
    'Mystery': 'bg-yellow-50 text-yellow-700',
    'Romance': 'bg-pink-50 text-pink-700',
    'History': 'bg-yellow-50 text-yellow-700',
    'Technology': 'bg-gray-50 text-gray-700',
    'Biography': 'bg-pink-50 text-pink-700',
    'Horror': 'bg-red-50 text-red-700',
    'Self-Help': 'bg-teal-50 text-teal-700'
  };

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 mr-2" />
            <h1 className="text-2xl font-bold">Library Management System</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setView('profile')} aria-label="Profile" className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded hover:bg-white/20">
              <User className="w-5 h-5" />
              <span>{currentUser?.name} ({currentUser?.role})</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

        <div className="max-w-7xl mx-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            My Books
          </button>
          <button
            onClick={() => setView('ai-query')}
            className={`px-4 py-2 rounded ${view === 'ai-query' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            AI Assistant
          </button>
          <button
            onClick={() => setView('insights')}
            className={`px-4 py-2 rounded ${view === 'insights' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Insights
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setView('users')}
              className={`px-4 py-2 rounded ${view === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
          )}
        </div>

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div>
            <div className="mb-6">
              {/* Stat cards */}
              <StatCards books={books} currentUser={currentUser} />
            </div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Book Collection</h2>
              <button
                onClick={() => { setView('add-book'); setFormData({}); }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Book
              </button>
            </div>

              <div className="grid gap-4">
              {displayBooks.map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: shouldReduceMotion ? 0 : i * 0.04 }}
                >
                  <div className="group relative bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${genreClasses[book.genre] || 'bg-gray-100 text-gray-700'} px-3 py-1 rounded`}>{book.genre}</span>
                      <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                      <p className="text-gray-500 italic">by {book.author}</p>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: book.status === 'Completed' ? '100%' : '30%' }} />
                        </div>
                        <span className="text-xs font-medium text-gray-400">{book.status}</span>
                      </div>
                      {currentUser?.role === 'admin' && (
                        <p className="text-sm text-gray-500 mt-2">Owner: {users.find(u => u.id === book.userId)?.name}</p>
                      )}
                    </div>

                    {/* Action Buttons: Hidden until hover */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingBook(book); setFormData(book); setView('edit-book'); }} className="p-2 hover:bg-blue-50 rounded-full text-blue-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteBook(book.id)} className="p-2 hover:bg-red-50 rounded-full text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                </motion.div>
              ))}
              {displayBooks.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                  No books in your library. Add your first book!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile View */}
        {view === 'profile' && (
          <div>
            <Profile currentUser={currentUser} handleUpdateProfile={handleUpdateProfile} handleLogout={handleLogout} setView={setView} />
          </div>
        )}

        {/* Add/Edit Book View */}
        {(view === 'add-book' || view === 'edit-book') && (
          <div className="bg-white p-6 rounded-lg shadow">
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
                  onClick={() => { setView('dashboard'); setFormData({}); setEditingBook(null); }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Query View */}
        {view === 'ai-query' && (
          <AIQuery
            aiQuery={aiQuery}
            setAiQuery={setAiQuery}
            handleAIQuery={handleAIQuery}
            aiResponse={aiResponse}
            users={users}
            books={books}
            useServerAI={useServerAI}
            setUseServerAI={setUseServerAI}
            loading={aiLoading}
          />
        )}

            </motion.div>
          </AnimatePresence>

        {/* Insights View */}
        {view === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Library Insights
              </h2>
              <div className="space-y-3">
                {generateInsights(books, currentUser?.id).map((insight, i) => (
                  <div key={i} className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-600">
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">📚 Recommended for You</h3>
              <div className="space-y-3">
                {generateRecommendations(books, currentUser?.id).map((rec, i) => (
                  <div key={i} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
                    <p className="font-semibold text-gray-800">{rec.title}</p>
                    <p className="text-sm text-gray-600">by {rec.author}</p>
                    <p className="text-sm text-green-700 mt-1">{rec.reason}</p>
                  </div>
                ))}
                {generateRecommendations(books, currentUser?.id).length === 0 && (
                  <p className="text-gray-500">Add more books to get personalized recommendations!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Management View (Admin Only) */}
        {view === 'users' && currentUser?.role === 'admin' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">User Management</h2>
            <div className="grid gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded text-sm ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Books: {books.filter(b => b.userId === user.id).length}
                    </p>
                  </div>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
