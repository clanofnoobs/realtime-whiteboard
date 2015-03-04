var localStrategy = require('passport-local').Strategy;
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
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done){
    process.nextTick(function(){
      User.findOne({$and:[{'local.email': email }, {'local.username': username}]}, function(err,user){
        if (err){
          return done(err);
        }
        if (user){
          return done(null, false, req.flash('signupMessage', 'That email is already taken'));
        } else {
          var newUser = new User();
          newUser.local.email = email;
        }
      });
    });
  }
  );

}
