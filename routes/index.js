var express = require('express');
var router = express.Router();
var slug = require('slug');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');
var passport = require("passport");
var crypto = require("crypto");

//GET home page. 
router.get('/', function(req, res) {
  res.render('index');
});

router.get('/user/:user', function(req,res, next){
  User.findOne({'local.username':req.params.user})
    .select('local.username whiteboards')
    .exec(function(err,user){
      if (err){
        console.log(err);
        return next(err);
      }
      if (user == null){
        return next(new Error("Could not find user"));
      }
      User.getWhiteBoards(req.params.user, function(err, whiteboards){
        if (err){
          console.log(err);
          return next(err);
        }
        res.json(whiteboards);
      });
    });
});

router.get('/login', function(req, res) {
  if (req.user){
    req.flash('success', 'You are logged in already');
    return res.redirect('/');
  }
  
  res.render('login', { message: req.flash('loginMessage')});

});

router.post('/login', function(req,res,next) {
  passport.authenticate('local-login', function(err, user, info){
    if (err){
      console.log(err);
      return next(err);
    }
    if (!user){
      return res.json(403, "Your username or password is incorrect");
    }
    req.login(user, function(err){
      if (err){
        console.log(err);
        return next(err);
      }
      var redirect_to = req.session.redirect_to ? req.session.redirect_to : '/';
      return res.redirect(redirect_to);
    });
  })(req,res,next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/user/:user/boards/:slug', isLoggedInAndAuthorized, function(req,res,next){
  User.findOne({'local.username':req.params.user})
    .select('-local.password')
    .exec(function(err, user){
      if (err){
        console.log(err);
        return next(err);
      }
      res.json(req.whiteboard);
    });
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
      throw err;
    }
    if (user){
      return res.json(403,{message: 'There already is a user named ' + req.query.username});
    }
    if (!user){
      console.log("Not found user, good to go");
      return res.json("Good to go (Y)");
    }
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
  User.findOne({'local.username':'clanofnoobs'}).populate('whiteboards').exec(function(err, user){
    if (err){
      console.log(err);
    }
    res.json(user);
  });
});

router.get('/createboard', isLoggedIn, function(req,res){
  var populated = req.user.populate('whiteboards');
  res.render('whiteboard', {user: populated });
});

router.post('/createboard', isLoggedIn, function(req,res, next){
   var user = req.user;
   User.findOne({'local.username':user.local.username}, function(err,user){
     var newWhiteboard = new Whiteboard();
     newWhiteboard.title = req.body.title;
     newWhiteboard.slug = slug(req.body.title);
     newWhiteboard.author = user._id;
     newWhiteboard.unique_token = randomValueBase64(7);
     newWhiteboard.access.push(user.id);
     newWhiteboard.save(function(err){
       if (err){
         console.log(err);
         return next(err);
       }
       user.whiteboards.push(newWhiteboard);
       user.save(function(err){
         if (err){
         console.log(err);
           return next(err);
         }
       User.populate(user, {path:'whiteboards'}, function(err,populated){
         if (err){
         console.log(err);
         return next(err);
         }
         return res.json(populated);
       });
       });
     });
   });
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
  console.log(req.path);
  req.session.redirect_to = req.path;
  req.flash('loginMessage', 'You are not logged in');
  res.redirect('/login');
}

function isLoggedInAndAuthorized(req,res,next){
  if (req.isAuthenticated()){
    Whiteboard.findOne({'unique_token':req.query.unique_token })
      .populate({path: 'author', select: 'local.username'})
      .exec(function(err, board){
        if (err){
          console.log(err);
          return next(err);
        }
        if (board == null){
          req.flash('failure', 'This board does exist or has been deleted by the user!');
          return res.redirect('/');
        }
        console.log(board);
        if (board.author.local.username == req.user.local.username){
          console.log("Has access");
          req.whiteboard = board;
          return next();

        } else {
          req.flash('failure', 'You do not have permission to view this collab!');
          return res.redirect('/');
        }
      });
  } else {
    req.flash('loginMessage', 'You are not logged in');
    req.session.redirect_to = req.originalUrl;
    return res.redirect('/login');
  }
}

function randomValueBase64(len){
  return crypto.randomBytes(Math.ceil(len * 3 /4))
    .toString('base64')
    .slice(0,len)
    .replace(/\+/g,'0')
    .replace(/\//g, '0');
}


module.exports = router;
