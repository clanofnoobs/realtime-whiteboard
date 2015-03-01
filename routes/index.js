var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');

/* GET home page. 
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});*/

router.get('/', function(req, res) {
  res.render('index', { title: 'WHAT UP' });
});

module.exports = router;
