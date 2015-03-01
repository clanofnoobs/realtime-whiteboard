var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');

var UserSchema = mongoose.schema({
  username: String,
  password: String,
  email: String
});

mongoose.model('User', UserSchema);
