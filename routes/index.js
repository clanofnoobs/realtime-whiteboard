var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');
var passport = require("passport");

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
  User.findOne({'local.username':req.query.username}, function(err, user){
    if (err){
      throw err;
    }
    if (user){
      return res.json(403,{message: 'There already is a user named ' + req.query.username});
    }
    if (!user){
      return res.json("Good to go (Y)");
    }
  });
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
