const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const nodemailer = require("nodemailer");
const Op = Sequelize.Op;
const passport = require("passport");

const models = require("../models");
const generatePassword = require("password-generator");


const {mailKey} = require("../config/keys");
const getStringVal = require("../controller/resources");

const User = models.User;
const Partner = models.Partner;


let transporter = nodemailer.createTransport({
  host: mailKey.host,
  port: mailKey.port,
  secure: true, // true for 465, false for other ports
  auth: {
    user: mailKey.user, // generated ethereal user
    pass: mailKey.password // generated ethereal password
  }
});

router.get("/partners-list", (req, res) => {
  Partner.findAll().then(partners => {
    res.status(200).json({
      status: true,
      partners: partners.map(partner => {
        return {
          name: partner.name,
          percentage: partner.discount + "%"
        };
      })
    })
  }).catch(err => {
    //console.log(err)
    res.status(200).json({
      status: false,
      message: "error in loading partners"
    })
  })
})
// multi
router.post('/get-code', (req, res) => {
  // var domain = req.body.email.match(/(?<=@)[^.]+(?=\.)/);
  let domain = "";
  let emailString = String(req.body.email);
  let i = emailString.length - 1;
  while (i > 0 && emailString[i] != '@')
    domain += emailString[i--]
  domain = domain.split('').reverse().join('');
  //console.log("domainnnnnnnnnnnnnnnnn: " + domain + " end");
  //console.log(domain);
  Partner.findOne({
    where: {
      domain: domain
    },
    include: [{association: 'Codes'}]
  }).then(partner => {
    if (!partner) {
      return res.status(200).json({
        status: false,
        message: getStringVal.getStringVal(req.body.language, 'THE_EMAIL_YOU_ENTERED_IS_NOT_ELIGIBLE_FOR_DISCOUNT')
      })
    }
    var generatedCode = generatePassword(6, false)
    models.PartnerCode.count().then(count => {
      models.PartnerCode.create({
        code: generatedCode + "-it" + `${count + 1}`,
        partner_id: partner.id
      }).then(partnerCode => {
        // //console.log(partnerCode)
        let mailOptions = {
          from: mailKey.from, // sender address
          to: req.body.email, // list of receivers
          subject: 'Get your partner discount code', // Subject line
          html: `<h2 style="text-align:center;">You can use this code to redeem a discount</h2><p style="text-align:center;">Your new generated code is: <br/> <strong style="font-size:30px;" >${partnerCode.code}</strong></p>` // html body
        };
        // REMOVE FOLLOWING LINE WHEN GOING LIVE
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            //console.log(error)
            // error in sending email
            return res.status(401).json({
              "status": false,
              "message": getStringVal.getStringVal(req.body.language, 'ERROR_PLEASE_TRY_AGAIN_LATER')
            })
          }
          transporter.close();
          // in case of success
          // REMOVE FOLLOWING LINE WHEN GOING LIVE
          process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
          return res.status(200).json({
            "status": true,
            "message": getStringVal.getStringVal(req.body.language, 'KINDLY_CHECK_YOUR_EMAIL_TO_GET_YOUR_CODE')
          })

        });
      })
        .catch(err => {
          //console.log(err)
          res.status(401).json({
            "status": false,
            "message": getStringVal.getStringVal(req.body.language, 'ERROR_PLEASE_TRY_AGAIN_LATER')
          })
        })
    }).catch(err => {
      //console.log(err)
      res.status(401).json({
        status: false,
        message: getStringVal.getStringVal(req.body.language, 'ERROR_PLEASE_TRY_AGAIN_LATER')
      })
    })

  })
})

router.post('/partner-code', (req, res) => {
  models.PartnerCode.findOne({
    where: {
      code: req.body.partnerCode,
      verified: false
    },
    include: [{association: 'Partner'}]
  }).then(partnerCode => {
    if (partnerCode) {
      return partnerCode.update({verified: true}).then(() => {
        res.status(200).json({
          status: true,
          partnerCodeId: partnerCode.id,
          partnerDiscount: partnerCode.Partner.discount,
          message: req.body.language == 1 ? `You are now enjoying ${partnerCode.Partner.discount}% discount` : `لقد أدخلت كود خصم صحيح و أنت الآن تستمتع بخصم ${partnerCode.Partner.discount}%`
        })
      })
    } else {
      return res.status(200).json({
        status: false,
        message: req.body.language == 1 ? `The code you entered is either invalid or already used, please try again` : `كود الخصم الذي أدخلته غير صحيح .. برجاء المحاولة مرة أخرى`
      })
    }


  }).catch(err => {
    //console.log(err)
    res.status(401).json({
      status: false,
      message: "error please try again"
    })
  })
})
router.post('/partner-code-authed', passport.authenticate('jwt', {session: false}), (req, res) => {
  models.PartnerCode.findOne({
    where: {
      code: req.body.partnerCode,
      verified: false
    },
    include: [{association: 'Partner'}]
  }).then(partnerCode => {
    if (partnerCode) {
      return partnerCode.update({verified: true}).then(partnerCode => {
        req.user.getCart().then(cart => {
          cart.setCode(partnerCode).then(() => {
            res.status(200).json({
              status: true,
              partnerCodeId: partnerCode.id,
              partnerDiscount: partnerCode.Partner.discount,
              message: req.body.language == 1 ? `You are now enjoying ${partnerCode.Partner.discount}% discount` : `لقد أدخلت كود خصم صحيح و أنت الآن تستمتع بخصم ${partnerCode.Partner.discount}%`
              // cart: cart.id
            })
          })

        }).catch(err => {
          //console.log(err)
          res.status(200).json({
            status: false,
            message: req.body.language == 1 ? `The code you entered is either invalid or already used, please try again` : `كود الخصم الذي أدخلته غير صحيح .. برجاء المحاولة مرة أخرى`
          })
        })

      })
    } else {
      return res.status(200).json({
        status: false,
        message: req.body.language == 1 ? `The code you entered is either invalid or already used, please try again` : `كود الخصم الذي أدخلته غير صحيح .. برجاء المحاولة مرة أخرى`
      })
    }


  }).catch(err => {
    //console.log(err)
    res.status(401).json({
      status: false,
      message: "error please try again"
    })
  })
})

module.exports = router;
