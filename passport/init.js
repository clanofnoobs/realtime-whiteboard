var LocalStrategy = require('passport-local').Strategy;
var mongoose = require("mongoose");
var User = mongoose.model('User');

module.exports = function(passport){

  passport.serializeUser(function(user, done) {
      done(null, user._id);
  });
   
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


  //Local signup
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done){
    process.nextTick(function(){


      User.findOne({'local.username':username}, function(err, user){
        if (err){
          return done(err);
        }
        if (user){
          return done(null, false, req.flash('signupMessage', 'That email is already taken'));
        } else {
          var newUser = new User();
          newUser.local.username = username;
          newUser.local.email = req.body.email;
          newUser.local.password = newUser.generateHash(password);
          newUser.save(function(err){
            if (err) {
              throw err;
            }
            return done(null, newUser);
          });
        }
      });
    });
  }));

  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done){
    process.nextTick(function(){
      User.findOne({'local.username':username}, function(err, user){
        if (err){
          return done(err);
        }
        if (!user){
          return done(null, false, req.flash('loginMessage', 'No user found with that username'));
        }

        if (!user.validPassword(password)){
          return done(null, false, req.flash('loginMessage', 'Wrong password bro'));
        }

        return done(null, user);
      });
    });
  });
  }));

}
