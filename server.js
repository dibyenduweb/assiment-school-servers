// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');

// // Load env vars
// dotenv.config();

// // Connect to database
// connectDB();

// const app = express();

// // Body parser
// app.use(express.json());

// // Enable CORS
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179'],
//   credentials: true
// }));

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/students', require('./routes/students'));
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/results', require('./routes/results'));
// app.use('/api/notices', require('./routes/notices'));
// app.use('/api/materials', require('./routes/materials'));
// app.use('/api/complaints', require('./routes/complaints'));
// app.use('/api/admitcards', require('./routes/admitcards'));
// app.use('/api/teachers', require('./routes/teachers'));

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Server is running' });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     success: false, 
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// const PORT = parseInt(process.env.PORT, 10) || 5000;

// const startServer = (port) => {
//   const server = app.listen(port, () => {
//     console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
//   });

//   server.on('error', (error) => {
//     if (error.code === 'EADDRINUSE') {
//       const nextPort = port + 1;
//       console.error(`Port ${port} is already in use. Trying port ${nextPort} instead...`);
//       startServer(nextPort);
//     } else {
//       console.error('Server error:', error);
//       process.exit(1);
//     }
//   });
// };

// startServer(PORT);


const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const app = express();

// ✅ Connect DB (safe for serverless)
connectDB();

// Middleware
app.use(express.json());

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'https://sparkling-marshmallow-899bb9.netlify.app',
    'https://kgschool.netlify.app'
  ],
  credentials: true
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/results', require('./routes/results'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admitcards', require('./routes/admitcards'));
app.use('/api/teachers', require('./routes/teachers'));

// Root route for deployed backend
app.get('/', (req, res) => {
  return res.redirect('/api/health');
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

module.exports = app;
// ✅ EXPORT for Vercel