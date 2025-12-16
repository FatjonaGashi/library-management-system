const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Book = require('./models/Book');

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');

    console.log('🗑️  Clearing old data...');
    await User.deleteMany({});
    await Book.deleteMany({});
    console.log('✅ Cleared!');

    console.log('👤 Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@library.com',
      password: adminPassword,
      role: 'admin'
    });

    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: userPassword,
      role: 'user'
    });
    console.log('✅ Users created!');

    console.log('📚 Creating books...');
    await Book.insertMany([
      { title: '1984', author: 'George Orwell', genre: 'Fiction', status: 'Completed', userId: user._id, pages: 328, price: 15.99 },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', status: 'Reading', userId: user._id, pages: 324, price: 14.99 },
      { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', status: 'Completed', userId: admin._id, pages: 310, price: 18.99 },
      { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Non-Fiction', status: 'To Read', userId: user._id, pages: 443, price: 22.99 },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', status: 'Completed', userId: admin._id, pages: 180, price: 12.99 },
      { title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', status: 'Reading', userId: admin._id, pages: 688, price: 25.99 },
      { title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Fiction', status: 'To Read', userId: user._id, pages: 234, price: 13.99 },
      { title: 'Harry Potter', author: 'J.K. Rowling', genre: 'Fantasy', status: 'Completed', userId: user._id, pages: 309, price: 16.99 }
    ]);
    console.log('✅ Books created!');

    console.log('\n🎉 SUCCESS! Database seeded!\n');
    console.log('📝 Login credentials:');
    console.log('   Admin: admin@library.com / admin123');
    console.log('   User:  john@example.com / user123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();