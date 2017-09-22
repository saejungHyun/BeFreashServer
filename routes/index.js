var express = require('express');
var router = express.Router();
var recipes = require('./recipes/index');
var reviewes = require('./reviewes/index');
var community = require('./community/index');
var login = require('./login');
var signin = require('./signin');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.use('/recipes',recipes);
router.use('/reviewes',reviewes);
router.use('/community',community);
router.use('/login',login);
router.use('/signin',signin);



module.exports = router;
