var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');

//GET home page. 
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res) {

  res.render('login', { message: req.flash('loginMessage')});

});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/signup', function(req,res){
  res.render('signup');
});


module.exports = router;
