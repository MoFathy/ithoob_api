const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const {secretKey} = require("../config/keys");
const generatePassword = require("password-generator");
const nodemailer = require("nodemailer");
const {mailKey} = require("../config/keys");
const ResponseSender = require("./dashboard/ResponseSender");
const models = require("../models");
const User = models.User;
const Newsletter = models.Newsletter;
const moment = require("moment");


let transporter = nodemailer.createTransport({
  host: mailKey.host,
  port: mailKey.port,
  secure: true, // true for 465, false for other ports
  auth: {
      user: mailKey.user, // generated ethereal user
      pass: mailKey.password // generated ethereal password
  }
});

var responseMessages = (lang) => ({
  alreadyExists: lang === "1" ? "Email or Mobile already exists, please try login" : "البريد الالكتروني أو الموبيل موجود بالفعل ، يرجى محاولة تسجيل الدخول",
  error: lang == "1" ? "Error, please try again later" : "خطأ ، يرجى المحاولة مرة أخرى في وقت لاحق",
  signedUp: lang === "1" ? "registered successfully" : "تم تسجيل المستخدم بنجاح."
})

// var authUser = (req,res) => {
//   if (req.user) {
//     var token = jwt.sign({
//       id: req.user.id,
//       name: req.user.name,
//       email: req.user.email
//     }, secretKey);
//     // send the response
//     return res.status(200).json({
//       "access_token": 'Bearer ' + token,
//       "status": "true",
//       "message": responseMessages(req.body.language).signedUp
//     })
//   }
// }



router.post("/change-password", passport.authenticate('jwt', {
  session: false
}), (req,res)=>{
  // match the entered password with the encrypted password through bcrypt
  var messages = {
    error: req.body.language === 1 ? "Error please try again later."  : "خطأ حاول مرة أخرى",
    success: req.body.language === 1 ? "Password is updated successfully"  : "تم تحديث كلمة المرور",
  }
  if (!req.body.newPassword || !req.body.oldPassword ){
    return res.status(200).json({
      "status": false,
      "message": req.body.language === 1 ? "You should enter both current and new password" : "يجب إدخال كلمتي المرور"
    })
  }
  // if both old and new password are similar return false
  else if (req.body.newPassword == req.body.oldPassword){
    return res.status(200).json({
      "status": false,
      "message": req.body.language === 1 ? "Current password and new password shouldn't be the same" : "كلمتي المرور القديمة والجديدة متطابقتين"
    })
  }
  // if the new password length is less than 3
  else if (req.body.newPassword.length <3){
    return res.status(200).json({
      "status": false,
      "message": req.body.language === 1 ? "New password's length can't be less than 3 characters" : "كلمة المرور الجديدة يجب ألا تقل عن ثلاث حروف"
    })
  }
  // if all validations are passed, compare old password sent and the password in database
  bcrypt.compare(req.body.oldPassword, req.user.password, (err,result)=>{
    // if there's an error
    if (err) {
      return res.status(200).json({
        "status": false,
        "message": messages.error
      })
    }
    // if the validation and old password are righ
    if (result) {
      // generate hash password from new one
      bcrypt.hash(req.body.newPassword, 10, (err, hash)=>{
        if(err){
          return res.status(200).json({
            "status": false,
            "message": messages.error
          })
        } else {
          // replace the new hash with the old one
          return User.update(
            {password: hash},
            {where: {email: req.user.email}}
          ).then(()=>{
            // if the password is updated successfully
            res.status(200).json({
              "status": true,
              "message": messages.success
            })
          })
          .catch(err=> {
            //console.log(err)
            // if the updating process isn't successful
            res.status(200).json({
              "status": false,
              "message": messages.error
            })
          })
        }
      })
    } else {
      return res.status(200).json({
        "status": false,
        "message": req.body.language === 1 ? "The old password isn't correct" : "كلمة المرور القديمة غير صحيحة"
      })
    }
  })
})


//post rollback
router.post('/profile',passport.authenticate('jwt',{session: false}), (req,res) => {
  var nameKey = req.body.language ===  1 ? "name_en": "name";
  User.findOne({
    where: {
      id: req.user.id
    },
    include: [{model: models.Place, as: 'Place', include: [{model: models.Place, as: 'Country'}]}]
  }).then( user => {
    res.status(200).json({
      personalInfo: {
        name: user.name,
        email: user.email
      },
      contactInfo: {
        mobileNo: user.mobile || undefined,
        country: user.Place.Country[nameKey] || undefined,
        city: user.Place[nameKey] || undefined,
        optionalAdd: user.address || undefined
      },
      status: true
    })
  })
  .catch( err => {
    //console.log(err)
    res.status(200).json({
      status: false,
      message: req.body.language === 1 ? "error in getting profile data" : "خطأ"
    })
  })
})

router.post("/update-account",passport.authenticate('jwt', {
  session: false
}), (req,res)=>{
  let updateVar = {};
  if ("name" in req.body) updateVar["name"] = req.body.name;
  if ("address" in req.body) updateVar["address"] = req.body.address;
  if ("area" in req.body) updateVar["area_id"] = req.body.area;

  if (Object.keys(updateVar).length < 1) {
    return res.status(200).json({
      status: false,
      message: "You didn't add any thing new to update."
    });
  } else {
    return User.update({ ...updateVar }, { where: { email: req.user.email } })
      .then(() => {
        // if the account is updated successfully
        res.status(200).json({
          status: true,
          message: "account settings updated successfully"
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "invalid request"
        });
      });
    }

})


router.post(
  "/subscripeNewsLetter",
  (req, res) => {
    console.log(req.body);

      if (req.body.mobile && req.body.email) {
        Newsletter.create({...req.body})
        .then((response) => {
            console.log(response);
            return ResponseSender.sendSuccess(res, "Subscriped successfully");
        }).catch(error => {
            //console.log(error);
            return ResponseSender.sendDBError(res, "Failed to Subscripe", error)
        })
      }
      else {
          return ResponseSender.sendInvalidRequest(res, "Failed to Subscripe")
      }
  }
);

router.get("/newsSubscripers",
(req, res) => {
	Newsletter.findAll({
    order: [["id", "DESC"]],
  })
	.then((responses) => {
		res.status(200).json({
			status: true,
			users: responses.map((response) => {
				return {
          id: response['id'],
          email: response['email'],
					mobile: response['mobile'],
					date: moment(response['createdAt']).format("LL")
				}
			})
		})
	})
	.catch(err => {
		// console.log(err)
		res.status(400).json({
			status: false,
			message: "Error while loading newsletter subscripers",
			error: err
		})
	});
});
module.exports = router;
