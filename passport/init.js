var LocalStrategy = require('passport-local').Strategy;
var mongoose = require("mongoose");
var User = mongoose.model('User');
var crypto = require('crypto');

var mailer = require("../mail/mail");

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

  var usr = req.body.username;
  var email = req.body.email;
    User.findOne({$or:[{'local.username':usr}, {'local.email':email}]}).populate('whiteboards').exec(function(err, user){
        if (err){
          return done(err);
        }
        console.log(user);
        if (user && !user.active){
          return done(null,false, req.flash('signupMessage', 'You are already registered with this email but it is not yet active. Please confirm your email')); 
        }
        else if (user){
          return done(null, false, req.flash('signupMessage', 'That email is already taken'));
        } else {
          var newUser = new User();
          newUser.local.username = username;
          newUser.local.email = req.body.email;
          newUser.local.password = newUser.generateHash(password);
          newUser.token = randomValueBase64(8);
          newUser.save(function(err){
            if (err) {
              throw err;
            }
            var body = 'Thank you for registering at Realtime Whiteboards. </br> Click <a href="http://localhost:3000/activate?token='+newUser.token+'">here</a> to activate your profile.'
            mailer.setMailOptions({
              token: newUser.token,
              email: newUser.local.email,
              subject: "Email confirmation - RealtimeWhiteboard"
            });
            mailer.setMailBody(body);

            mailer.sendUserMail();
            return done(null, user, req.flash('success', 'Email sent to ' + newUser.local.email));
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
  function(req,username,password,done){
    process.nextTick(function(){
      User.findOne({$or:[{'local.username':username}, {'local.email':username}]}, function(err, user){
        if (err){
          return done(err);
        }
        if (!user){
          return done(null, false);
        }
        if (!user.validPassword(password)){
          return done(null, false);
        }
        if (user.active){
          return done(null, user);
        } else {
          return done(null, user);
        }
      });
    });
  }));

  function randomValueBase64(len){
    return crypto.randomBytes(Math.ceil(len * 3 /4))
      .toString('base64')
      .slice(0,len)
      .replace(/\+/g,'0')
      .replace(/\//g, '0');
  }

}
