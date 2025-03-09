// Modify your server.js to export the Express app for serverless environments
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user.routes');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Load env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Add this before your other routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      inventory: '/api/inventory',
      sales: '/api/sales',
      dashboard: '/api/dashboard'
    }
  });
});

// Error handler
app.use(errorHandler);

// Start server if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Don't exit the process on Vercel
});

// Export for serverless
module.exports = app; 