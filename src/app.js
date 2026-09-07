const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const { sendSuccess } = require('./utils/responseHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'dokaner-khata-backend'
  }, 'Dokaner Khata API Server is running');
});

// Root route
app.get('/', (req, res) => {
  return sendSuccess(res, {
    version: '1.0.0',
    documentation: '/api/v1'
  }, 'Welcome to Dokaner Khata Backend API');
});

// API Routes
app.use('/api/v1', routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
