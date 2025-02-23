const express = require('express');
const router = express.Router();

const uploadUrlController = require('../controllers/uploadURL.controller');

router.post('/', uploadUrlController.getUploadURL);

module.exports = router;