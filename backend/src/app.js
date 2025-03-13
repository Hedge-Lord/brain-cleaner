const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const pdftoroute = require('./routes/pdftobrainrot.routes');
const uploadURL = require('./routes/uploadURL.routes');
const authRoutes = require('./routes/auth.routes');
const videosRoutes = require('./routes/videos.routes');

const app = express();
// Render assigns port 10000 internally
const PORT = process.env.PORT || 10000;

// Increase request size limit
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.use(cors());
app.use(bodyParser.json());
app.use('/api/v1/pdftobrainrot', pdftoroute);
app.use('/api/v1/upload-url', uploadURL);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/videos', videosRoutes);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Brain Cleaner Backend is running.');
});

// Handle AWS SDK deprecation warning
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

module.exports = app;
