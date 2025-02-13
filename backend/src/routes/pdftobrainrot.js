const express = require('express');
const router = express.Router();

const pdfToBrainrotController = require('../controllers/pdfToBrainrotController');

router.post('/', pdfToBrainrotController.processPdf);

module.exports = router;
