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
    subject: 'Email confirmation - RealtimeWhiteboard',
    html: ''
  },
  testFunc: function(){
    console.log("hello!");
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
  setMailOptions: function(user){
    this.token = user.token;

    this.mailOptions.to = user.local.email;

    this.mailOptions.html = 'Thank you for registering at Realtime Whiteboards. </br> Click <a href="http://localhost:3000/activate?token='+this.token+'">here</a> to activate your profile.'
  }

}
