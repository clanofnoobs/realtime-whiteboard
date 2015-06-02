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

    socket.broadcast.to(joinedToken).emit("userEnter", obj.user);
  });
  socket.on("userEnter", function(user){
    socket.broadcast.to(joinedToken).emit("userAlreadyConnected", user);
  });
  socket.on("objectMove", function(coords){
    console.log(coords.x + ", " + coords.y);
    socket.broadcast.to(joinedToken).emit("objectMove", coords);
  });
  socket.on("clear", function(coords){
    Whiteboard.findOne({'unique_token':joinedToken}).exec(function(err, board){
      board.objects = [];
      board.markModified("objects");
      board.save(function(err){
        console.log("cleared obj");
      });
    });
  });
  socket.on("objectModded", function(obj){
    Whiteboard.findOne({'unique_token':joinedToken}).exec(function(err,board){
      var counter = 0;
      var found = false;
      if (err){
        console.log(err);
        return;
      }
      for (i=0;i<board.objects.length;i++){
        if (board.objects[i].unique_token == obj.unique_token){
          console.log("the index is " + i);
          found = true;
          counter++;
          break;
        }
        counter++;
      }
      console.log(board.objects[counter-1].unique_token);
      board.objects[counter-1] = obj.object;
      board.markModified("objects");
      board.save(function(err){
        if (err){
          console.log(err);
          return;
        }
        console.log("saved modified obj");
      });
    });
  });
  socket.on("objectAdded", function(object){
    socket.broadcast.to(joinedToken).emit("objectAdded", object);
    Whiteboard.findOne({'unique_token':joinedToken}).exec(function(err, board){
      if (err){
        console.log(err);
        return;
      }

      board.objects.push(object);
      board.markModified("objects");

      board.save(function(err){
        if (err){
          console.log(err);
          return;
        }
        console.log("added obj");
      });
    });
  });
  socket.on("scale", function(scale){
    socket.broadcast.to(joinedToken).emit("scale", scale);
  });
  socket.on("draw", function(point){
    console.log(point);
    Whiteboard.findOne({'unique_token':joinedToken}).exec(function(err,board){
      if (err){
        console.log(err);
        return;
      }
      board.objects.push(point);
      board.save(function(err){
        if (err){
          console.log(err);
          return;
        }
        console.log("saved obj");

      });
    });
    socket.broadcast.to(joinedToken).emit("draw", point);
  });
  socket.on("rotating", function(angle){
    socket.broadcast.to(joinedToken).emit("rotating", angle);
  });
  socket.on("setCoords", function(coords){
    socket.broadcast.to(joinedToken).emit("setCoords", coords);
  });
  socket.on("drawing", function(coords){
    socket.broadcast.to(joinedToken).emit("drawing", coords);
  });
  socket.on("mouseup", function(user){
    socket.broadcast.to(joinedToken).emit("mouseup", user);
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
