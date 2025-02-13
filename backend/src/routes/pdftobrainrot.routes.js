const express = require('express');
const router = express.Router();

const pdfToBrainrotController = require('../controllers/pdfToBrainrot.controller');

router.post('/', pdfToBrainrotController.processPdf);

module.exports = router;
