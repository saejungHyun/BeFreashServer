var express = require('express');
var router = express.Router();
var main = require('./main');
var magazine = require('./magazine');
var magazinecontent = require('./magazine_content');
var restaurant = require('./restaurant');
var restaurantcontent = require('./restaurant_content');
var recipephoto = require('./recipephoto');
var recipephotocontent = require('./recipephoto_content');
var savelist = require('./savelist');


router.use('/main',main);
router.use('/magazine',magazine);
router.use('/magazinecontent',magazinecontent);
router.use('/restaurant',restaurant);
router.use('/restaurantcontent',restaurantcontent);
router.use('/recipephoto',recipephoto);
router.use('/recipephotocontent',recipephotocontent);
router.use('/savelist',savelist);


module.exports = router;
