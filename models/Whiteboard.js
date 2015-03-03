var mongoose = require("mongoose");

var WhiteboardSchema = new mongoose.Schema({
  title: String,
  created: { type: Date, default: Date.now() },
  author: { type: Number, ref: 'User' }
});

mongoose.model('Whiteboard', WhiteboardSchema);
