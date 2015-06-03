var mailer = require('nodemailer');
var email = '';

var transporter = mailer.createTransport({
  service: 'Gmail',
    auth: {
      user: 'testsami1994@gmail.com',
      pass: 'baklavabinsukar'
    }
});

module.exports = { 
  token: '',
  mailOptions: {
    from: 'Realtime Whiteboard <samiulg3@gmail.com>',
    to: '',
    subject: '',
    html: ''
  },
  sendUserActivationMail: function(){

    transporter.sendMail(this.mailOptions, function(err,info){
      if (err){
        console.log(err);
      } else {
        console.log('Message sent: ' + info.response);
      }
    });
  
  },
  setMailOptions: function(obj){
    this.token = user.token;
    this.subject = obj.subject;
    this.mailOptions.to = user.local.email;

  },
  setMailBody: function(body){
    this.mailOptions.html = body;
  }

}
