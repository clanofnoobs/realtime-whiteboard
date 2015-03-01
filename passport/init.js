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

}
