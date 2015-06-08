var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');
var Q = require("q");

var UserSchema = new mongoose.Schema({
  local : { 
    username: String,
    password: String,
    email: String
  },
  active: { type: Boolean, default: false },
  whiteboards: [{type: mongoose.Schema.Types.ObjectId, ref: 'Whiteboard'}],
  token: { type: String, unique: true, required: true },
  requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}]
});

UserSchema.static('getWhiteBoards', function(username, callback){
  return this.findOne({'local.username':username}).populate('whiteboards').select('local.username whiteboards requests')
    .exec(callback);
});

UserSchema.static('getRequests', function(username){
  var deferred = Q.defer();
  this.findOne({'local.username':username}).populate('requests').select('requests')
    .exec(function(err, request){
      deferred.resolve(request);
    });
  return deferred.promise;
});

UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

mongoose.model("User", UserSchema);
