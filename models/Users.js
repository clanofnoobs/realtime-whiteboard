var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new mongoose.Schema({
  local : { 
    username: String,
    password: String,
    email: String,
    whiteboards: [{type: mongoose.Schema.Types.ObjectId, ref: 'Whiteboard'}]
  }
});

UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

mongoose.model("User", UserSchema);
