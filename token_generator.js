var crypto = require("crypto");

module.exports = {
  randomValueBase64: function(len){
    return crypto.randomBytes(Math.ceil(len * 3 /4))
      .toString('base64')
      .slice(0,len)
      .replace(/\+/g,'0')
      .replace(/\//g, '0');
  }
}
