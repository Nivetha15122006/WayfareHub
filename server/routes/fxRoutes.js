const express = require('express');
const { getRate } = require('../controllers/fxController');

const router = express.Router();

router.get('/rate', getRate);

module.exports = router;
