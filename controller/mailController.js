// const axios = require("axios");
const { username, password } = require("../config/keys").smsKeys;

// Remove next import upon going live.
const nodemailer = require("nodemailer");
// Remove next import upon going live.
const { mailKey } = require("../config/keys");
const models = require("../models");
const Message = models.Message;

module.exports.sendMail = (
  email,
  subject,
  title,
  message,
  type = "message",
  products = ""
) => {
  console.log("====================================");
  console.log(products);
  console.log("====================================");
  var transporter = nodemailer.createTransport({
    host: mailKey.host,
    port: mailKey.port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: mailKey.user, // generated ethereal user
      pass: mailKey.password, // generated ethereal password
    },
  });

  if (type === "verify") {
    Message.findAll().then((res) => {
      console.log(res);
      let dbMsg = res.filter((i) => i.type == "welcome_message")[0].message;
      let dbImg = res.filter((i) => i.type == "welcome_img")[0].message;
      let dbTitle = res.filter((i) => i.type == "welcome_title")[0].message;

      // Must be `iThoob`, same case-sensitive, don't use the `sender` parameter as - sometimes - we send it as `IThoob` or in a different way
      const apiSender = "iThoob";
      let mailOptions = {
        from: mailKey.from, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        html: `
      <div style="width: 600px;margin:auto">
          <div style="width: 100%">
                <a href="https://ithoob.com" style="display:block;width:100%"><img src="${dbImg}" width="100%" height="300px"></a>
          </div>
          <div>
              <h2 style="font-size: 2em;text-align: center;padding: 30px;font-weight: bold">${dbTitle}</h2>
              <h2 style="font-size: 1em;text-align: center;padding: 30px;">${dbMsg}</h2>
          </div>
          <div style="width: 100%;background: #000;padding-top: 20px;">
          <div style="width: 100%;display: flex;justify-content: space-between;padding: 0;">
            <ul
                style="margin: 20px auto!important;display: flex;justify-content: flex-start;padding: 0;">
                <li style="display: inline-block;"><img
                        src="https://assets.ithoob.com/uploads/iconfinder_ic_local_phone_48px_352510.png" alt=""
                        width="24px" style="margin-left:8px"><span
                        style="margin-left:8px;color: #b68a1e!important">966594704888</span></li>
                <li style="display: inline-block;"><img
                        src="https://assets.ithoob.com/uploads/iconfinder_icon-email_211660.png" alt=""
                        width="24px" style="margin-left:8px"><span
                        style="margin-left:8px;color: #b68a1e!important">Info@durra.tv</span></li>
            </ul>
            <ul
                style="width: 30%;margin: 20px auto!important;display: flex;justify-content: space-evenly;padding: 0;">
                <li style="display: inline-block;"><a href="https://www.facebook.com/ithoob/"><img
                            src="https://assets.ithoob.com/uploads/iconfinder_06-facebook_104498.png" alt=""
                            width="24px"></a></li>
                <li style="display: inline-block;"><a
                        href="https://api.whatsapp.com/send?phone=966594704888&text=&source=&data=&app_absent="><img
                            src="https://assets.ithoob.com/uploads/iconfinder_BW_Whatsapp_glyph_svg_5305166.png"
                            alt="" width="24px"></a></li>
                <li style="display: inline-block;"><a href="https://twitter.com/ithoob"><img
                            src="https://assets.ithoob.com/uploads/iconfinder_icon-social-twitter_211920.png"
                            alt="" width="24px"></a></li>
                <li style="display: inline-block;"><a href="https://www.instagram.com/_ithoob/"><img
                            src="https://assets.ithoob.com/uploads/iconfinder_Instagram_1159683.png" alt=""
                            width="24px"></a></li>
            </ul>
          </div>
          <p style="color: gold;font-size: 1em;text-align: center;padding: 30px;font-weight: bold"> iThoob 2021 @
              جميع الحقوق محفوظة </p>
        </div>
      </div>`, // html body
      };
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          //   error in sending email
          return res.status(200).json({
            status: false,
            message: "Error please try again later.",
          });
        }
        console.log(info);
        transporter.close();
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
      });
      return Promise.resolve(1);
    });
  } else {
    const apiSender = "iThoob";
    let mailOptions = {
      from: mailKey.from, // sender address
      to: email, // list of receivers
      subject: subject, // Subject line
      html:
        `
      <div style="width: 600px;margin:auto">
        <div style="width: 100%">
              <a href="https://ithoob.com" style="display:block;width:100%"><img src="https://assets.ithoob.com/uploads/ithoob-email.jpg" width="100%" height="200px"></a>
        </div>
        <div style="padding: 20px;margin-bottom: 20px;background: #f1f3f4;">
            <h2 style="font-size: 2em;text-align: right;font-weight: 600;margin: 0;margin-bottom: 10px;">${title}</h2>
            <h2 style="font-size: 1.2em;text-align: right;padding: 10px;">${message}</h2>
        </div>` +
        products +
        `<div style="width: 100%;background: #000;padding-top: 20px;">
          <div style="width: 100%;display: flex;justify-content: space-between;padding: 0;">
            <ul
                style="margin: 20px auto!important;display: flex;justify-content: flex-start;padding: 0;">
                <li style="display: inline-block;"><img
                        src="https://assets.ithoob.com/uploads/iconfinder_ic_local_phone_48px_352510.png" alt=""
                        width="24px" style="margin-left:8px"><span
                        style="margin-left:8px;color: #b68a1e!important">966594704888</span></li>
                <li style="display: inline-block;"><img
                        src="https://assets.ithoob.com/uploads/iconfinder_icon-email_211660.png" alt=""
                        width="24px" style="margin-left:8px"><span
                        style="margin-left:8px;color: #b68a1e!important">Info@durra.tv</span></li>
            </ul>
            <ul
                style="width: 30%;margin: 20px auto!important;display: flex;justify-content: space-evenly;padding: 0;">
                <li style="display: inline-block;"><a href="https://www.facebook.com/ithoob/"><img
                            src="https://assets.ithoob.com/uploads/iconfinder_06-facebook_104498.png" alt=""
                            width="24px"></a></li>
                <li style="display: inline-block;"><a
                        href="https://api.whatsapp.com/send?phone=966594704888&text=&source=&data=&app_absent="><img
                            src="https://assets.ithoob.com/uploads/iconfinder_BW_Whatsapp_glyph_svg_5305166.png"
                            alt="" width="24px"></a></li>
                <li style="display: inline-block;"><a href="https://twitter.com/ithoob"><img
                            src="https://assets.ithoob.com/uploads/iconfinder_icon-social-twitter_211920.png"
                            alt="" width="24px"></a></li>
                <li style="display: inline-block;"><a href="https://www.instagram.com/_ithoob/"><img
                            src="https://assets.ithoob.com/uploads/iconfinder_Instagram_1159683.png" alt=""
                            width="24px"></a></li>
            </ul>
          </div>
          <p style="color: gold;font-size: 1em;text-align: center;padding: 30px;font-weight: bold"> iThoob 2021 @
              جميع الحقوق محفوظة </p>
        </div>
      </div>`, // html body
    };
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        //   error in sending email
        // return res.status(200).json({
        //   "status": false,
        //   "message": "Error please try again later."
        // })
      }
      console.log(info);
      transporter.close();
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
    });
    return Promise.resolve(1);
  }
};
