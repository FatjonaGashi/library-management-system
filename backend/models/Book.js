const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { 
    type: String, 
    required: true,
    enum: ['Fiction', 'Non-Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Biography']
  },
  status: { 
    type: String, 
    required: true,
    enum: ['To Read', 'Reading', 'Completed'],
    default: 'To Read'
  },
  pages: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Fix for model overwrite error
module.exports = mongoose.models.Book || mongoose.model('Book', BookSchema);