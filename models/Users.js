var mongoose = require("mongoose");

var UserSchema = mongoose.schema({
  username: String,
  password: String,
  email: String
});

mongoose.model('User',UserSchema);
