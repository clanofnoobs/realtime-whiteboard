var LocalStrategy = require('passport-local').Strategy;
var mongoose = require("mongoose");
var User = mongoose.model('User');
var mailer = require('nodemailer');
var transporter = mailer.createTransport({
  service: 'Gmail',
    auth: {
      user: 'gmail.user@gmail.com',
      pass: 'userpass'
    }
});

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
          newUser.token = randomValueBase64(8);
          newUser.save(function(err){
            if (err) {
              throw err;
            }
            var mailOptions = {
              from: 'Realtime Whiteboard <samiulg3@gmail.com>',
              to: newUser.local.email,
              subject: 'Email confirmation',
              text: 'test'
            };
            transporter.sendMail(mailOptions, function(err,info){
              if (err){
                console.log(err);
              } else {
                console.log('Message sent: ' + info.response);
              }
            });
            return done(null, false, req.flash('signupMessage', 'Email sent to ' + newUser.local.email));
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
      User.findOne({'local.username':username}, function(err, user){
        if (err){
          return done(err);
        }
        if (!user){
          return done(null, false, req.flash('loginMessage', 'No user found with the user name' + username));
        }
        if (!user.validPassword(password)){
          return done(null, false, req.flash('loginMessage', 'Wrong password'));
        }
        if (user.active){
          return done(null, user, req.flash('success', 'Success login!'));
        } else {
          return done(null, false, req.flash('loginMessage', 'You haven\'t confirmed your account yet. Please visit your e-mail account and confirm'));
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
