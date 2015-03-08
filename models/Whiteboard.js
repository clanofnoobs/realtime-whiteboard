var mongoose = require("mongoose");

var WhiteboardSchema = new mongoose.Schema({
  title: String,
  slug: String,
  unique_token: String,
  created: { type: Date, default: Date.now() },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  access: [{type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

mongoose.model('Whiteboard', WhiteboardSchema);
