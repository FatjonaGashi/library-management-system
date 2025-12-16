import React from 'react';
import { Sparkles, Send } from 'lucide-react';

export default function AIQuery({ 
  aiQuery, 
  setAiQuery, 
  handleAIQuery, 
  aiResponse, 
  users, 
  books,
  useServerAI,
  setUseServerAI,
  loading 
}) {
  const exampleQueries = [
    "Who owns the most books?",
    "Which is the most popular genre?",
    "Show me the five most expensive books",
    "How many books are completed?",
    "Which user has read the most pages?"
  ];
  return (
    <div>
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-sm mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 text-indigo-600">✨</span>
          AI Query Assistant
        </h2>
        <p className="text-gray-600 mb-4">Ask me anything about your library data in natural language!</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleAIQuery()}
            placeholder="e.g., Who owns the most books? — Ask me anything about your library..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            onClick={handleAIQuery}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask
              </>
            )}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            id="use-server-ai"
            type="checkbox"
            checked={!!useServerAI}
            onChange={(e) => setUseServerAI(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="use-server-ai">Use server AI</label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setAiQuery('Who owns the most books?')} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
            Who owns the most books?
          </button>
          <button onClick={() => setAiQuery('Show the five most expensive books')} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
            Most expensive books
          </button>
          <button onClick={() => setAiQuery('Books by genre')} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
            Books by genre
          </button>
          <button onClick={() => setAiQuery('Reading statistics')} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
            Reading statistics
          </button>
        </div>
      </div>

      {aiResponse && (
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Result:</h3>
          {aiResponse.type === 'text' ? (
            <p className="text-gray-700">{aiResponse.result}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {Object.keys(aiResponse.result[0] || {}).map(key => (
                      <th key={key} className="border p-3 text-left font-semibold">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aiResponse.result.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="border p-3">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
