require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const pdftoroute = require('./routes/pdftobrainrot.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api/v1/pdftobrainrot', pdftoroute);
app.use('/api/v1/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Brain Cleaner Backend is running.');
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
