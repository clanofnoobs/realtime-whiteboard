var express = require('express');
var router = express.Router();
var slug = require('slug');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');
var passport = require("passport");
var crypto = require("crypto");
var mailer = require("../mail/mail");

//GET home page. 
router.get('/test',function(req,res,next){
  mailer.setMailOptions();
  res.send("test");
});
router.get('/', function(req, res) {
  res.render('index', {failure: req.flash('signupMessage'), success: req.flash('success'), message: req.flash('failure'), loginMessage: req.flash('loginMessage')});
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
        console.log("Can't find user");
        return res.send(404, "Could not find user");
      }
      User.getWhiteBoards(req.params.user, function(err, whiteboards){
        if (err){
          console.log(err);
          return next(err);
        }
        if (req.user){
          whiteboards = whiteboards.toObject();
          whiteboards["theUser"] = req.user.local.username;
          return res.json(whiteboards);
        } else {
          return res.json(whiteboards);
        }
      });
    });
});

router.get('/get/:user', function(req,res,next){
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
      console.log(user);
      return res.json(403, "Your username or password is incorrect");
    }
    if (!user.active){
      return res.json(401, "Your account is not active, please go to your email to activate your account");
    }

    req.login(user, function(err){
      if (err){
        console.log(err);
        return next(err);
      }
      User.populate(user, {path:'-local.password'}, function(err,pop){
      //var redirect_to = req.session.redirect_to ? req.session.redirect_to : '/user/'+user.local.username;
      //return res.redirect(redirect_to);
      return res.json(pop);
      });
    });
  })(req,res,next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/user/:user/board/:slug', isLoggedInAndAuthorized, function(req,res,next){
  User.findOne({'local.username':req.params.user})
    .select('-local.password')
    .exec(function(err, user){
      if (err){
        console.log(err);
        return next(err);
      }
      var obj = { user: req.user.local.username, whiteboard: req.whiteboard };
      res.json(obj);
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

router.delete('/board/delete/:unique_token', isLoggedInAndAuthorized, function(req,res){
  req.whiteboard.remove();
  res.json("sucessfully removed");
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
router.get('/permissions/:unique_token/:user', function(req,res,next){
  User.findOne({'local.username': req.params.user})
    .exec(function(err,user){
      if (err){
        console.log(err);
        return next(err);
      }
      Whiteboard.findOne({'unique_token':req.params.unique_token})
        .populate('access controlled_access')
        .exec(function(err,board){
         if (req.query.permission == 'access'){
           board.access.push(user.id);
         } else {
           board.controlled_access.push(user.id);
         }
         board.save(function(err){
           if (err){
             return next(err);
             console.log(err);
           }
           user.whiteboards.push(board.id);
           user.save(function(err){
             if (err){
               console.log(err);
               return next(err);
             }
               return res.json("DONE");
           })
         });
      });
    });
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
         console.log("SAVED");
         Whiteboard.populate(newWhiteboard, {path:'author', select: 'local.username'}, function(err, board){
           if (err){
             console.log(err);
             return next(err);
           }
           return res.json(board);
         });
       });
     });
   });
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/',
  failureFlash: true
}));


function isLoggedIn(req,res,next){
  if (req.isAuthenticated()){
    return next();
  } else {
    return res.send(403, "Not logged in");
  }
}

router.get('/checkIfLoggedIn', isLoggedIn, function(req,res,next){
});

router.get('/board/authorized/:unique_token', isLoggedInAndAuthorized, function(req,res,next){
});

function isLoggedInAndAuthorized(req,res,next){
  var unique_token = req.query.unique_token || req.params.unique_token
  console.log(unique_token);
  if (req.isAuthenticated()){
    Whiteboard.findOne({'unique_token':unique_token })
      .populate('access controlled_access')
      .exec(function(err, board){
        if (err){
          console.log(err);
          return next(err);
        }
        if (board == null){
          return res.send(404,"This board does not exist or has been deleted by the user!");
        }
        var users = [];
        var cUsers = [];
        board.controlled_access.forEach(function(user){
          cUsers.push(user.local.username);
        });

        board.access.forEach(function(user){
          users.push(user.local.username);
        });

        if (users.indexOf(req.user.local.username) != -1){
          console.log("Has access");
          req.whiteboard = board;
          return next();

        } else if (cUsers.indexOf(req.user.local.username) != -1){
          req.whiteboard = board;
          return next();
        }
        else {
          return res.send(401, "You are not authorized");
        }
      });
  } else {
    return res.send(403, "You are not logged in");
    //req.session.redirect_to = req.originalUrl;
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
