const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');  // Add morgan for HTTP request logging

const pdftoroute = require('./routes/pdftobrainrot.routes');
const uploadURL = require('./routes/uploadURL.routes');
const authRoutes = require('./routes/auth.routes');
const videosRoutes = require('./routes/videos.routes');

const app = express();
// Render assigns port 10000 internally
const PORT = process.env.PORT || 10000;

// Request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (Object.keys(req.body).length) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Increase request size limit
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.use(cors());
app.use(bodyParser.json());

// Log when routes are mounted
console.log('[Routes] Mounting PDF to brainrot routes at /api/v1/pdftobrainrot');
app.use('/api/v1/pdftobrainrot', pdftoroute);
console.log('[Routes] Mounting upload URL routes at /api/v1/upload-url');
app.use('/api/v1/upload-url', uploadURL);
console.log('[Routes] Mounting auth routes at /api/v1/auth');
app.use('/api/v1/auth', authRoutes);
console.log('[Routes] Mounting videos routes at /api/v1/videos');
app.use('/api/v1/videos', videosRoutes);

// Enhanced error handling
app.use((err, req, res, next) => {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query
  };
  
  console.error('[ERROR]', JSON.stringify(errorDetails, null, 2));
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    path: req.path,
    timestamp: errorDetails.timestamp
  });
});

// Health check endpoint with detailed info
app.get('/', (req, res) => {
    const healthInfo = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
    };
    console.log('[Health Check]', JSON.stringify(healthInfo, null, 2));
    res.json(healthInfo);
});

// Handle AWS SDK deprecation warning
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Started successfully on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Process ID: ${process.pid}`);
  });

  // Enhanced server error handling
  server.on('error', (error) => {
    console.error('[Server Error]', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  });

  // Enhanced graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, initiating graceful shutdown');
    server.close(() => {
      console.log('[Server] All connections closed');
      console.log('[Server] Shutting down process');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('[Server] Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  });
}

module.exports = app;
