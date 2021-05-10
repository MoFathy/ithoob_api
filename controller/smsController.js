const axios = require("axios");
const { username, password } = require("../config/keys").smsKeys;

// Remove next import upon going live.
const nodemailer = require("nodemailer");
// Remove next import upon going live.
const { mailKey } = require("../config/keys");
const models = require("../models");
const Message = models.Message;

module.exports.sendMessage = async (numbersArr, message, sender, type="message") => {
  var apiSender = "iThoob";
  //console.log(numbersArr);
  var numbers = numbersArr.join(",");
  if(type === "verify"){
    var smsRequest;
    await Message.findAll().then((res) => {
      console.log(res);
      let dbMsg =
        res.filter((i) => i.type == "sms_msg")[0].message + " " + message;
      // Must be `iThoob`, same case-sensitive, don't use the `sender` parameter as - sometimes - we send it as `IThoob` or in a different way
      //console.log("numbers");
      //console.log(numbers);
  
      // Until Going live, we will be sending an email to sms.ithoob@yopmail.com
      // To view these emails, go to http://www.yopmail.com
      // then enter sms.ithoob in the email field
      // Remove from this line until the line with the comment "TO HERE"
      // let transporter = nodemailer.createTransport({
      //   host: mailKey.host,
      //   port: mailKey.port,
      //   secure: true, // true for 465, false for other ports
      //   auth: {
      //     user: mailKey.user, // generated ethereal user
      //     pass: mailKey.password // generated ethereal password
      //   }
      // });
      // let mailOptions = {
      //   from: mailKey.from, // sender address
      //   to: "sms.ithoob@yopmail.com", // list of receivers
      //   subject: 'Ithoob SMS service', // Subject line
      //   html: `
      //   <h2 style="text-align:center;">New SMS</h2>
      //   <p style="text-align:center;">Number(s): <br/>
      //   <strong style="font-size:30px;" >${numbers}</strong>
      //   </p>
      //   <p style="text-align:center;">Message: <br/>
      //   <strong style="font-size:30px;" >${message}</strong>
      //   </p>` // html body
      // };
      // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     //console.log(error)
      //     // error in sending email
      //     // return res.status(200).json({
      //     //   "status": false,
      //     //   "message": "Error please try again later."
      //     // })
      //   }
      //   transporter.close();
      //   process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
      // });
      // return Promise.resolve(1);
      // TO HERE
  
      // Uncomment following lines upon going live.
    const uri = `https://www.hisms.ws/api.php?send_sms&username=${username}&password=${password}&numbers=${numbers}&sender=${apiSender}&message=${dbMsg}`;
    const req = encodeURI(uri);
    smsRequest = req; // This prevents "TypeError: Request path contains unescaped characters" error when sending Arabic SMS
    });
  }else{
    const uri = `https://www.hisms.ws/api.php?send_sms&username=${username}&password=${password}&numbers=${numbers}&sender=${apiSender}&message=${message}`;
    const req = encodeURI(uri);
    smsRequest = req; // This prevents "TypeError: Request path contains unescaped characters" error when sending Arabic SMS
  }
  return axios.post(smsRequest);
};
