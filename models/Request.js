var mongoose = require("mongoose");
var mailer = require("../mail/mail");
var token_generator = require("../token_generator");

require("./Users");
require("./Whiteboard");
var User = mongoose.model('User');
var Whiteboard = mongoose.model('Whiteboard');

var RequestSchema = new mongoose.Schema({
  request: String,
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sent: { type: Date, defaut: Date.now },
  whiteboard: { type: mongoose.Schema.Types.ObjectId, ref: "Whiteboard" },
  token: { type: String, default: token_generator.randomValueBase64(6) }
});

RequestSchema.static("findDuplicate", function(userId, cb){
  return this.find().populate('from whiteboard')
    .exec(cb);
});

RequestSchema.static("findWithPopulated", function(token, cb){
  return this.findOne({"token":token}).populate("to from whiteboard").exec(cb);
});

RequestSchema.pre("save", function(next){
  var self = this;
  User.findById(self.to, function(err, user){
    if (err){
      console.log(err);
    }
    user.requests.push(self.id);
    user.save(function(err){
      if (err){
        return next(err);
      }
    });
    Whiteboard.findOne({"unique_token":self.whiteboard.unique_token}).exec(function(err, board){
      if (err){
        console.log(err);
        return next(err);
      }
      if (!board) {
        return next(err);
      }

      var body = user.local.username + " would like to get full access to your board:"+board.title+". Click <a href='http://localhost:3000/permissions/"+self.token+"/"+self.from.local.username+"?permission=access&board_unique_token="+board.unique_token+"'> here</a> to give full access or <a href='http://localhost:3000/permissions/"+self.token+"/"+self.from.local.username+"/?board_token="+board.unique_token+"'>"+"here </a> to give controlled access";

      mailer.setMailOptions({
        token: user.token,
        email: user.local.email,
        subject: "Whiteboard access request - RealtimeWhiteboard" 
      });

      mailer.setMailBody(body);
      mailer.sendUserMail();
    });
    return next();
  });
});

mongoose.model("Request", RequestSchema);
