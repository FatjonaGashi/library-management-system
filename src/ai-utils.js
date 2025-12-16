// AI helper utilities extracted from App.js for easier testing and reuse
/* eslint-disable no-unused-vars */
const processAIQuery = (query, books, users, currentUserId) => {
  const lowerQuery = (query || '').toLowerCase();
  
  if ((lowerQuery.includes('most books') || lowerQuery.includes('has the most books')) && lowerQuery.includes('who')) {
    const userBookCount = {};
    books.forEach(book => {
      userBookCount[book.userId] = (userBookCount[book.userId] || 0) + 1;
    });
    const maxUserId = Object.keys(userBookCount).reduce((a, b) => 
      userBookCount[a] > userBookCount[b] ? a : b
    );
    const user = users.find(u => u.id === parseInt(maxUserId));
    return {
      type: 'text',
      result: `${user?.name || 'Unknown'} owns the most books with ${userBookCount[maxUserId]} books.`
    };
  }

  if (lowerQuery.includes('popular book') || lowerQuery.includes('most read') || lowerQuery.includes('most popular')) {
    const bookCount = {};
    books.forEach(book => {
      bookCount[book.title] = (bookCount[book.title] || 0) + 1;
    });
    const popular = Object.entries(bookCount).sort((a, b) => b[1] - a[1])[0];
    return {
      type: 'text',
      result: popular ? `"${popular[0]}" is the most popular book, owned by ${popular[1]} user(s).` : 'No books found.'
    };
  }

  

  if (lowerQuery.includes('expensive') || lowerQuery.includes('most expensive') || lowerQuery.includes('expensive books')) {
    const sortedBooks = [...books].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5);
    return {
      type: 'table',
      result: sortedBooks.map(b => ({
        Title: b.title,
        Author: b.author,
        Price: `$${(b.price || 0).toFixed(2)}`
        , Owner: (users || []).find(u => (u.id || u._id) === b.userId || (u.id || u._id) === (b.userId?.toString ? parseInt(b.userId) : b.userId))?.name || 'Unknown'
      }))
    };
  }

  if (lowerQuery.includes('average price') || (lowerQuery.includes('avg price') && lowerQuery.includes('genre'))) {
    // Average book price by genre
    const genreSums = {};
    const genreCounts = {};
    books.forEach(b => {
      const g = b.genre || 'Unknown';
      genreSums[g] = (genreSums[g] || 0) + (b.price || 0);
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    const rows = Object.keys(genreSums).map(genre => ({ Genre: genre, AveragePrice: `$${(genreSums[genre] / genreCounts[genre]).toFixed(2)}` }));
    return { type: 'table', result: rows };
  }

  if (lowerQuery.includes('top readers') || (lowerQuery.includes('top') && (lowerQuery.includes('readers') || lowerQuery.includes('owners')))) {
    // If createdAt exists on books, prefer last 30 days; otherwise count all time
    const now = Date.now();
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    const recentBooks = books.filter(b => b.createdAt ? (new Date(b.createdAt).getTime() >= now - THIRTY_DAYS) : true);
    const counts = {};
    recentBooks.forEach(b => { counts[b.userId] = (counts[b.userId] || 0) + 1; });
    const rows = Object.entries(counts).map(([uid, count]) => ({ UserId: uid, Count: count }));
    return { type: 'table', result: rows.sort((a, b) => b.Count - a.Count) };
  }

  if (lowerQuery.includes('summarize') && lowerQuery.includes('reading')) {
    // Return a short text summary using generateInsights for the current user if books and users are provided.
    const insights = generateInsights(books, currentUserId);
    return {
      type: 'text',
      result: insights.join(' ') || 'No reading habits available.'
    };
  }

  if (lowerQuery.includes('genre') || lowerQuery.includes('category')) {
    const genreCount = {};
    books.forEach(book => {
      genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
    });
    const genreList = Object.entries(genreCount).map(([genre, count]) => ({
      Genre: genre,
      Count: count
    }));
    return {
      type: 'table',
      result: genreList
    };
  }

  if (lowerQuery.includes('reading') && (lowerQuery.includes('status') || lowerQuery.includes('statistics'))) {
    const statusCount = {};
    books.forEach(book => {
      statusCount[book.status] = (statusCount[book.status] || 0) + 1;
    });
    return {
      type: 'table',
      result: Object.entries(statusCount).map(([status, count]) => ({
        Status: status,
        Count: count
      }))
    };
  }

  return {
    type: 'text',
    result: 'I can help you with queries like: "Who owns the most books?", "Which is the most popular book?", "Show the five most expensive books", "Books by genre", "Reading statistics", or "Summarize reading habits"'
  };
};

const generateInsights = (books, currentUserId) => {
  const userBooks = books.filter(b => b.userId === currentUserId);
  if (!userBooks || userBooks.length === 0) return ['No books in your library yet.'];
  const insights = [];
  const genreCount = {};
  userBooks.forEach(book => {
    genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
  });
  const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0];
  insights.push(`${topGenre[0]} is your most read genre (${topGenre[1]} books)`);
  const completed = userBooks.filter(b => b.status === 'Completed').length;
  const reading = userBooks.filter(b => b.status === 'Reading').length;
  insights.push(`You've completed ${completed} books and are currently reading ${reading}`);
  const avgPages = userBooks.reduce((sum, b) => sum + (b.pages || 0), 0) / userBooks.length;
  if (avgPages > 0) {
    insights.push(`Average book length: ${Math.round(avgPages)} pages`);
  }
  return insights;
};

const generateRecommendations = (books, currentUserId) => {
  const userBooks = books.filter(b => b.userId === currentUserId);
  if (!userBooks || userBooks.length === 0) return [];
  const genreCount = {};
  userBooks.forEach(book => {
    genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
  });
  const favoriteGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const userBookTitles = new Set(userBooks.map(b => b.title));
  // Recommend books from the favorite genre (from other users), plus top-priced books of the genre
  const candidates = books
    .filter(b => b.genre === favoriteGenre && !userBookTitles.has(b.title) && b.userId !== currentUserId);
  // sort by price descending and return top 3
  const recommendations = candidates.sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 3);
  return recommendations.map(b => ({
    title: b.title,
    author: b.author,
    reason: `Based on your interest in ${favoriteGenre}`
  }));
};

export { processAIQuery, generateInsights, generateRecommendations };
