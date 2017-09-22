var express = require('express');
var router = express.Router();
var content = require('./content');
var main = require('./main');


router.use('/detail', content);
router.use('/all',main);

module.exports = router;
