var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');

var users = require('./routes/users');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/whiteboard');
require('./models/Whiteboard');
require('./models/Users');
var User = mongoose.model("User");
var Whiteboard = mongoose.model("Whiteboard");

var routes = require('./routes/index');

var app = express();

//passport config
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({secret:'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

var initPassport = require('./passport/init');
initPassport(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

app.use('/', routes);
app.use('/users', users);

var http = require('http').Server(app);
var io = require('socket.io')(http);

io.of('/room').on('connection', function(socket){
  var joinedToken = null;
  console.log("User connected");
  socket.on("user", function(obj){
    socket.join(obj.unique_token);

    joinedToken = obj.unique_token;
    console.log(obj.user + " is connected");

    socket.emit("user", obj.user);
    socket.broadcast.to(joinedToken).send(obj.user);
  });
  socket.on("typing", function(letter){
    socket.broadcast.to(joinedToken).emit("word", letter);
  });
});


http.listen(3000,function(socket){
  console.log("connected");
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
