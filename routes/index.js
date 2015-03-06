var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');
var passport = require("passport");
var crypto = require("crypto");

//GET home page. 
router.get('/', function(req, res) {
  res.render('index', { message: req.flash('success'), user: req.user, failure: req.flash('failure') });
});

router.get('/login', function(req, res) {
  console.log(req.user);
  if (req.user){
    req.flash('success', 'You are logged in already');
    return res.redirect('/');
  }

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

router.get('/deleteall', function(req,res){
  User.find(function(err,users){
    users.forEach(function(user){
      user.remove();
    });
  });
  res.json("Removed!");
});

router.get('/signup', function(req,res){
  res.render('signup', { message: req.flash('signupMessage'), success: req.flash('success')});
});

router.get('/activate', function(req, res, next){
  User.findOne({'token':req.query.token}, function(err, user){
    console.log(err);
    if (user.active == true) {
      req.flash('failure', 'You have already activated your account'); 
      req.login(user,function(err){
      if (err){
        return next(err);
      }

      return res.redirect('/');
      });
    } else {
      user.active = true;

      user.save(function(err){
        if (err){
          return next(err);
        }
        req.flash('success', 'Successfully activated your account!');
        req.login(user, function(err){
          if (err){
            next(err);
          }
          return res.redirect('/');
        });
      });
    }
  });
});

router.get('/all', function(req,res, next){
  User.find(function(err,users){
    if (err){
      return next(err);
    }
    res.json(users);
  });
});

router.get('/createboard', isLoggedIn, function(req,res){
  var populated = req.user.populate('Whiteboard');
  res.render('whiteboard', {user: populated });
});


router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));

function isLoggedIn(req,res,next){
  if (req.isAuthenticated()){
    return next();
  }
  req.flash('loginMessage', 'You are not logged in');
  res.redirect('/login');
}



module.exports = router;
