import React, { useState } from 'react';

const sampleBooks = [
  { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', price: 18.99, pages: 310, genre: 'Fantasy' },
  { id: 2, title: '1984', author: 'George Orwell', price: 15.99, pages: 328, genre: 'Fiction' },
  { id: 3, title: 'Sapiens', author: 'Yuval Noah Harari', price: 22.99, pages: 443, genre: 'Non-Fiction' }
];

export default function LoginPromo({ onTryDemo }) {
  const [expanded, setExpanded] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  const toggleExpand = (id) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  return (
    <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Featured Books</h3>
      <div className="space-y-3">
        {sampleBooks.map(book => (
          <div key={book.id} className="border rounded p-3 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <strong>{book.title}</strong>
                <span className="text-sm text-gray-500">by {book.author}</span>
              </div>
              {expanded === book.id && (
                <div className="mt-2 text-sm text-gray-700">
                  <p>Genre: {book.genre}</p>
                  <p>Pages: {book.pages}</p>
                  <p>Price: ${book.price.toFixed(2)}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => toggleExpand(book.id)} className="text-indigo-600 hover:underline text-sm">
                {expanded === book.id ? 'Hide' : 'Preview'}
              </button>
              <button onClick={() => toggleWishlist(book.id)} className={`text-sm px-3 py-1 rounded ${wishlist.includes(book.id) ? 'bg-green-100 text-green-800' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {wishlist.includes(book.id) ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">No account? Try the demo admin to explore features.</div>
        <button onClick={onTryDemo} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Try Demo Admin</button>
      </div>
    </div>
  );
}
