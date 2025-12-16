// backend/server.js - FIXED VERSION FOR TESTING

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library', {
      // Remove deprecated options
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Only connect if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, required: true },
  status: { type: String, enum: ['To Read', 'Reading', 'Completed'], default: 'To Read' },
  pages: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Book = mongoose.model('Book', BookSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin Middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== BOOK ROUTES =====

app.get('/api/books', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const books = await Book.find(query).populate('userId', 'name email');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('userId', 'name email');
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (req.user.role !== 'admin' && book.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', authenticateToken, async (req, res) => {
  try {
    const book = new Book({
      ...req.body,
      userId: req.user.id
    });
    
    await book.save();
    const populatedBook = await Book.findById(book._id).populate('userId', 'name email');
    
    res.status(201).json(populatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (req.user.role !== 'admin' && book.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('userId', 'name email');
    
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (req.user.role !== 'admin' && book.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== USER ROUTES (Admin Only) =====

app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Book.deleteMany({ userId: req.params.id });
    res.json({ message: 'User and their books deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== AI QUERY ROUTES =====

app.post('/api/ai/query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    const lowerQuery = query.toLowerCase();
    
    const bookQuery = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const books = await Book.find(bookQuery).populate('userId', 'name email');
    
    let result;
    
    if (lowerQuery.includes('most books') && lowerQuery.includes('who')) {
      const users = await User.find().select('-password');
      const userBookCount = {};
      
      for (const user of users) {
        const count = await Book.countDocuments({ userId: user._id });
        userBookCount[user._id] = { name: user.name, count };
      }
      
      const topUser = Object.values(userBookCount).sort((a, b) => b.count - a.count)[0];
      result = {
        type: 'text',
        result: topUser ? `${topUser.name} owns the most books with ${topUser.count} books.` : 'No users found.'
      };
    } else if (lowerQuery.includes('popular book')) {
      const bookCount = {};
      books.forEach(book => {
        bookCount[book.title] = (bookCount[book.title] || 0) + 1;
      });
      const popular = Object.entries(bookCount).sort((a, b) => b[1] - a[1])[0];
      result = {
        type: 'text',
        result: popular ? `"${popular[0]}" is the most popular book.` : 'No books found.'
      };
    } else if (lowerQuery.includes('expensive')) {
      const expensiveBooks = books
        .sort((a, b) => b.price - a.price)
        .slice(0, 5)
        .map(b => ({
          Title: b.title,
          Author: b.author,
          Price: `$${b.price.toFixed(2)}`,
          Owner: b.userId.name
        }));
      result = { type: 'table', result: expensiveBooks };
    } else if (lowerQuery.includes('genre')) {
      const genreCount = {};
      books.forEach(book => {
        genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
      });
      result = {
        type: 'table',
        result: Object.entries(genreCount).map(([genre, count]) => ({ Genre: genre, Count: count }))
      };
    } else {
      result = {
        type: 'text',
        result: 'Try asking: "Who owns the most books?", "Show expensive books", or "Books by genre"'
      };
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/insights', authenticateToken, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user.id });
    
    if (books.length === 0) {
      return res.json({ insights: ['No books in your library yet.'] });
    }
    
    const insights = [];
    
    const genreCount = {};
    books.forEach(book => {
      genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
    });
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0];
    insights.push(`${topGenre[0]} is your most read genre (${topGenre[1]} books)`);
    
    const completed = books.filter(b => b.status === 'Completed').length;
    const reading = books.filter(b => b.status === 'Reading').length;
    insights.push(`You've completed ${completed} books and are reading ${reading}`);
    
    const avgPages = books.reduce((sum, b) => sum + b.pages, 0) / books.length;
    if (avgPages > 0) {
      insights.push(`Average book length: ${Math.round(avgPages)} pages`);
    }
    
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/recommendations', authenticateToken, async (req, res) => {
  try {
    const userBooks = await Book.find({ userId: req.user.id });
    
    if (userBooks.length === 0) {
      return res.json({ recommendations: [] });
    }
    
    const genreCount = {};
    userBooks.forEach(book => {
      genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
    });
    const favoriteGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0][0];
    
    const userBookTitles = new Set(userBooks.map(b => b.title));
    const recommendations = await Book.find({
      genre: favoriteGenre,
      userId: { $ne: req.user.id }
    }).limit(3);
    
    const filteredRecs = recommendations
      .filter(b => !userBookTitles.has(b.title))
      .map(b => ({
        title: b.title,
        author: b.author,
        genre: b.genre,
        reason: `Based on your interest in ${favoriteGenre}`
      }));
    
    res.json({ recommendations: filteredRecs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Library API is running' });
});

// IMPORTANT: Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  });
}

// Export app for testing
module.exports = app;