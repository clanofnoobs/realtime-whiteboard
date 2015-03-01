var mongoose = require("mongoose");

var WhiteboardSchema = new mongoose.schema({
  title: String,
  created: { type: Date, default: Date.now() }
  author: { type: Number, ref: 'User' }
});

mongoose.model('Whiteboard', WhiteboardSchema);
