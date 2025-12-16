import React from 'react';
import { BookOpen, Sparkles, BarChart3 } from 'lucide-react';
import { generateInsights } from '../ai-utils';

export default function StatCards({ books = [], currentUser }) {
  const visibleBooks = currentUser?.role === 'admin' ? books : (currentUser ? books.filter(b => b.userId === currentUser.id) : []);
  const totalBooks = visibleBooks.length;
  const insights = generateInsights(books, currentUser?.id).slice(0,1);
  // reading progress: percent of books with status Completed
  const completed = visibleBooks.filter(b => b.status === 'Completed').length;
  const readingPercent = visibleBooks.length ? Math.round((completed / visibleBooks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="group relative bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Books</p>
            <p className="text-2xl font-extrabold text-gray-900">{totalBooks}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="group relative bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">AI Insights</p>
            <p className="text-base font-medium text-gray-800">{insights[0] || 'No insights available'}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Sparkles className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="group relative bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-sm hover:shadow-xl transition-all">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Reading Progress</p>
              <p className="text-2xl font-extrabold text-gray-900">{readingPercent}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${readingPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
