var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');
var passport = require("passport");
var crypto = require("crypto");

//GET home page. 
router.get('/', function(req, res) {
  res.render('index', { message: req.flash('success'), user: req.user });
});

router.get('/login', function(req, res) {

  res.render('login', { message: req.flash('loginMessage')});

});

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/checkusername', function(req,res){
  var credential = '';
  var query;
  if (req.query.username){
    query = 'local.username';
  } else {
    query = 'local.email';
  }
  credential = req.query.username;
  User.findOne({$or:[{'local.username':credential}, {'local.email':credential}]}, function(err, user){
    if (err){
      console.log("in the err");
      throw err;
    }
    if (user){
      console.log("Found user");
      return res.json(403,{message: 'There already is a user named ' + req.query.username});
    }
    if (!user){
      console.log(credential);
      console.log("Not found user, good to go");
      return res.json("Good to go (Y)");
    }
    console.log("in the end");
  });
});

router.get('/signup', function(req,res){
  res.render('signup', { message: req.flash('signupMessage')});
});

router.get('/emailconfirmation/:token', function(req, res){

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
