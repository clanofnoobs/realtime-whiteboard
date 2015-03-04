var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');
var passport = require("passport");

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
  res.render('signup', { message: req.flash('signupMessage')});
});

router.get('/all', function(req,res, next){
  User.find(function(err,users){
    if (err){
      return next(err);
    }
    res.json(users);
  });
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));


module.exports = router;
