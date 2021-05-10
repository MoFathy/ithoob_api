const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const { mailKey } = require("../config/keys");
const models = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
let transporter = nodemailer.createTransport({
  host: mailKey.host,
  port: mailKey.port,
  secure: true, // true for 465, false for other ports
  auth: {
    user: mailKey.user, // generated ethereal user
    pass: mailKey.password // generated ethereal password
  }
});

router.post("/contactUs", (req, res) => {
  models.GeneralOption.findOne({
    where: { key: { [Op.or]: ["contact_to_mail"] } }
  })
    .then(response => {
      let mailOptions = {
        from: mailKey.from, // sender address
        to: response.value, // list of receivers
        subject: "iThoob: New Contact Form Submission", // Subject line
        html: `<h4>New user submit contact form from iThoob website,</h4><p><b>Name:</b>${
          req.body.name
        }</p><p><b>Email:</b>${req.body.email}</p><p><b>Mobile:</b>${
          req.body.mobile
        }</p><p><b>Message:</b></p><p>${req.body.message}</p>` // html body
      };
      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          //console.log(error);
          // error in sending email
          return res.status(401).json({
            status: false,
            message: "Error please try again later."
          });
        }
        transporter.close();
        // in case of success
        return res.status(200).json({
          status: true,
          message: "تم إرسال الرسالة بنجاح",
          content: "سيتم التواصل معك في أقرب وقت ممكن"
        });
      });
    })
    .catch(() => {
      return res.status(401).json({
        status: false,
        message: "Error please try again later."
      });
    });
});

router.post("/contact", (req, res) => {
  Promise.all([models.Branch.findOne(), models.GeneralOption.findOrCreate({where: {key: "maps_iframe"}})])
    .then(results => {
      const branch = results[0];
      const iframe = results[1][0];
      if (!branch) {
       return res.status(200).json({
         status: false,
         message: "no branch"
       }) 
      }
      res.status(200).json({
        status: true,
        iframeSrc: iframe.value,
        branchName: req.body.language == 1 ? branch.name_en : branch.name,
        branchAddress: req.body.language == 1 ? branch.address_en : branch.address,
        branchNumber: branch.number,
        workingHours: req.body.language == 1 ? branch.hours_en : branch.hours
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(200).json({
        status: false,
        message: "error in loading contact"
      });
    });
});

module.exports = router;
