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
const {sendMessage} = require("../controller/smsController");

const models = require("../models");
const User = models.User;
const UserMeta = models.UserMeta;

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


router.post("/login", (req,res)=>{
  var messages = {
    error: req.body.language === 1 ? "Error please try again later."  : "خطأ حاول مرة أخرى",
    success: req.body.language === 1 ? "signed in  successfully"  : "تم تسجيل دخول المستخدم بنجاح",
    emailPassError: req.body.language === 1 ? "Email or password is not correct" : "هناك خطأ في البريد الالكتروني أو كلمة المرور"
  }
  // find user with the email
  var nameKey = req.body.language === 1 ? 'name_en' : 'name'
  User.findAll({
    where: {
      [Op.or]: [{email: req.body.email}, {mobile: req.body.email }],
      active: true
    },
    include: [{association: 'Metas'}, {association: 'Place'}]
  }).then(users =>{
    // if there's no user with this email
    if(users.length < 1){
      return res.status(200).json({
        "status": false,
        "message": messages.emailPassError
      })
    }
    // match the entered password with the encrypted password through bcrypt
    
    bcrypt.compare(String(req.body.password), String(users[0].password), (err,result)=>{
      if (err) {
        //console.log(err)
        return res.status(200).json({
          "status": false,
          "message": messages.emailPassError
        })
      }
      if (result) {
        // generate authentication token to user
        
        if(users[0].Metas.find((item)=>item.dataValues.type=="prev") && users[0].Metas.find((item)=>item.dataValues.type=="prev").value == "true" ){
          return  res.status(200).json({
            "status": true,
            "type": "oldSystemAuthed",
            "userData": {
              name: users[0].name || undefined,
              email: users[0].email || undefined,
              address: users[0].address || undefined,
              mobile: users[0].mobile || undefined,
              country: users[0].Place && users[0].Place.Country ? {id: users[0].Place.Country.id, name: users[0].Place.Country[nameKey]} : undefined,
              area: users[0].Place ? {id: users[0].Place.id, name: users[0].Place[nameKey]} : undefined
              
            },
            "message": req.body.language == 1 ? `Our customer ${users[0].name} .. Your number registered with iThoob. `  : `عميلنا ${users[0].name} .. رقمك مسجل لدى آى ثوب`
          })
        } else {
          var token = jwt.sign({
            id: users[0].id,
            name: users[0].name,
            email: users[0].email
          }, secretKey)
          // return the response with authentication token
          return res.status(200).json({
            "access_token": 'Bearer ' + token,
            "status": true,
            "message": messages.success,
          })
        }
        
      }else{
        if(users[0].Metas.find((item)=>item.dataValues.type=="prev") && users[0].Metas.find((item)=>item.dataValues.type=="prev").value == "true"){
          res.status(200).json({
            "status": true,
            "type": "oldSystem", 
            "message": req.body.language == 1 ? `Our customer ${users[0].name} .. `  : `عميلنا ${users[0].name} .. رقمك مسجل لدى آى ثوب`
          })
        }
        else {
          return res.status(200).json({
            "status": false,
            "message": messages.emailPassError
          })
        }
      }
    })
  })
})

router.post("/restorePassword", (req, res ) => {
  User.findOne({
    where: {
      // [Op.or]: [{email: req.body.email},{mobile: req.body.mobile}]
      email: req.body.email
    }
  }).then(user => {
    if (!user) {
      return res.status(200).json({status: false, "message": req.body.language == 1 ? `This email is not registered. Please check the email and try again.`  : `هذا البريد غير مسجل لدينا, برجاء التأكد من البريد الالكتروني والمحاولة مرة أخرى`})
    }
    var generatedCode = user.id+"_"+generatePassword(20,false);
    let mailOptions = {
      from: mailKey.from, // sender address
      to: req.body.email, // list of receivers
      subject: 'Password Reset', // Subject line
      html: `<!doctype html>
      <html>
      
      <head>
          <meta name="viewport" content="width=device-width">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <title>Password Reset</title>
          <style>
              /* -------------------------------------
              INLINED WITH htmlemail.io/inline
          ------------------------------------- */
              /* -------------------------------------
              RESPONSIVE AND MOBILE FRIENDLY STYLES
          ------------------------------------- */
              @media only screen and (max-width: 620px) {
                  table[class=body] h1 {
                      font-size: 28px !important;
                      margin-bottom: 10px !important;
                  }
      
                  table[class=body] p,
                  table[class=body] ul,
                  table[class=body] ol,
                  table[class=body] td,
                  table[class=body] span,
                  table[class=body] a {
                      font-size: 16px !important;
                  }
      
                  table[class=body] .wrapper,
                  table[class=body] .article {
                      padding: 10px !important;
                  }
      
                  table[class=body] .content {
                      padding: 0 !important;
                  }
      
                  table[class=body] .container {
                      padding: 0 !important;
                      width: 100% !important;
                  }
      
                  table[class=body] .main {
                      border-left-width: 0 !important;
                      border-radius: 0 !important;
                      border-right-width: 0 !important;
                  }
      
                  table[class=body] .btn table {
                      width: 100% !important;
                  }
      
                  table[class=body] .btn a {
                      width: 100% !important;
                  }
      
                  table[class=body] .img-responsive {
                      height: auto !important;
                      max-width: 100% !important;
                      width: auto !important;
                  }
              }
      
              /* -------------------------------------
              PRESERVE THESE STYLES IN THE HEAD
          ------------------------------------- */
              @media all {
                  .ExternalClass {
                      width: 100%;
                  }
      
                  .ExternalClass,
                  .ExternalClass p,
                  .ExternalClass span,
                  .ExternalClass font,
                  .ExternalClass td,
                  .ExternalClass div {
                      line-height: 100%;
                  }
      
                  .apple-link a {
                      color: inherit !important;
                      font-family: inherit !important;
                      font-size: inherit !important;
                      font-weight: inherit !important;
                      line-height: inherit !important;
                      text-decoration: none !important;
                  }
      
                  #MessageViewBody a {
                      color: inherit;
                      text-decoration: none;
                      font-size: inherit;
                      font-family: inherit;
                      font-weight: inherit;
                      line-height: inherit;
                  }
      
                  .btn-primary table td:hover {
                      background-color: #34495e !important;
                  }
      
                  .btn-primary a:hover {
                      background-color: #34495e !important;
                      border-color: #34495e !important;
                  }
              }
      
          </style>
      </head>
      
      <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
          <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
              <tr>
                  <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                  <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
                      <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
      
                          <!-- START CENTERED WHITE CONTAINER -->
                          <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">This is preheader text. Some clients will show this text as a preview.</span>
                          <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">
      
                              <!-- START MAIN CONTENT AREA -->
                              <tr>
                                  <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                                      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
                                          <tr>
                                              <div id="puthere">
                                                  <h2 style="text-align:center;">Password Reset</h2><p style="text-align:center;">Please follow this link to reset your password: <br/> <strong style="font-size:30px;" >${req.body.url}?code=${generatedCode}</strong></p><p style="text-align:center;">Thank you.</p>
                                              </div>
                                          </tr>
                                      </table>
                                  </td>
                              </tr>
      
                              <!-- END MAIN CONTENT AREA -->
                          </table>
      
                          <!-- START FOOTER -->
                          <div class="footer" style="clear: both; Margin-top: 10px; text-align: center; width: 100%;">
                              <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
                                  <tr>
                                      <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; font-size: 12px; color: #999999; text-align: center;">
                                          <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">iThoob, King Abdul Aziz Rd, Ar Rabi, Riyadh 13315, Saudi Arabia</span>
                                          <br> Don't like these emails? <a href="http://i.imgur.com/CScmqnj.gif" style="text-decoration: underline; color: #999999; font-size: 12px; text-align: center;">Unsubscribe</a>.
                                      </td>
                                  </tr>
                                  <tr>
                                  </tr>
                              </table>
                          </div>
                          <!-- END FOOTER -->
      
                          <!-- END CENTERED WHITE CONTAINER -->
                      </div>
                  </td>
                  <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
              </tr>
          </table>
      </body>
      
      </html>
      ` // html body
    };
    return transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        //console.log(error)
        // error in sending email
        return res.status(200).json({
          "status": false,
          "message": "Error please try again later."
        })
      }
      transporter.close();
      // in case of success
      user.createMeta({type: 'code', value: generatedCode}).then(() => {
        res.status(200).json({
          "status": true,
          "message": req.body.language == 1 ? `Our customer ${user.name} .. Please Check your E-mail`  : `عميلنا ${user.name} .. تم إرسال رسالة إلى بريدك الالكتروني يرجى التحقق من بريدك الالكتروني حتى تتمكن من تغيير كلمة المرور`
        })
      }).catch(err => {
        //console.log(err)
        res.status(200).json({
          "status": false,
          "message":"error please try again",
        })
      })
    });
  }) 
})

router.post("/changePassword", (req,res)=>{
  // match the entered password with the encrypted password through bcrypt
  var messages = {
    error: req.body.language === 1 ? "Error please try again later."  : "خطأ حاول مرة أخرى",
    success: req.body.language === 1 ? "Password changed successfully"  : "تم تحديث كلمة المرور",
  }
  
  // if all validations are passed, compare old password sent and the password in database
  User.findOne({
    include: [{association: 'Metas',where: {type: 'code',value: req.body.code}}]
  }).then(user =>{
    if(!user) {
      return res.status(200).json({status: false, message: 'the url is no longer effective try restoring password again'})
    }
    var metaObject = {};
    user.Metas.map(meta => {
      metaObject[meta.type] = meta.value
    })
    if (metaObject.code === req.body.code) {
      return bcrypt.hash(req.body.newPassword, 10, (err, hash)=>{
        if(err){
          return res.status(200).json({
            "status": false,
            "message": messages.error
          })
        } else {
          // replace the new hash with the old one
          var updateUserWithNewPass = User.update(
            {password: hash},
            {where: {id: user.id}}
          );
          var removeCode = UserMeta.destroy({
            where: {
              user_id: user.id,
              type: "code"
            }
          });
          return Promise.all([updateUserWithNewPass, removeCode]).then(()=>{
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
        "message": req.body.language === 1 ? "you already used your code try with another one" : "لقد استخدمت الكود المرسل حاول ثانية"
      })
    }
  })
  
})

/// both generate and verify code API will be replaced by mobile instead of finding by email when integrating with sms gateway


router.post("/generate-code", (req, res) => {
  if (!req.body.email) {
      return res.status(200).json({
          status: false,
          message: 'please enter your email'
      })
  }
  User.findOne({
      where: {
        [Op.or]: [{email: req.body.email}, {mobile: req.body.email}]
      }
  }).then(user => {
      var generatedCode = generatePassword(6, false, '[0-9]')
      return bcrypt.hash(generatedCode, 10, (err, hash) => {
          if (err) {
              return res.status(200).json({
                  "status": false,
                  "message": responseMessages(req.body.language).error
              })
          } else {
              if (String(req.body.email).includes("@")) {
                  let mailOptions = {
                      from: mailKey.from, // sender address
                      to: req.body.email, // list of receivers
                      subject: 'Your Code in ithoob', // Subject line
                      html: `<h2 style="text-align:center;">Your code in ithoob</h2><p style="text-align:center;">Your new generated code is: <br/> <strong style="font-size:30px;" >${generatedCode}</strong></p>` // html body
                  };
                  return transporter.sendMail(mailOptions, (error, info) => {
                      if (error) {
                          //console.log(error)
                          // error in sending email
                          return res.status(200).json({
                              "status": false,
                              "message": "Error please try again later."
                          })
                      }
                      transporter.close();
                      // in case of success
                      if (req.body.type == "pass") {
                          return user.update({password: hash}).then(() => {
                              res.status(200).json({
                                  "status": true,
                                  "type": "pass true",
                                  "message": req.body.secondTime ? 'code sent AGAIN successfully to your email' : 'code sent successfully to your email'
                              })
                          }).catch(err => {
                              //console.log(err)
                              res.status(200).json({
                                  "status": false,
                                  "message": "error please try again",
                              })
                          })
                      }
                      user.createMeta({type: 'code', value: hash}).then(() => {
                          res.status(200).json({
                              "status": true,
                              "message": req.body.secondTime ? 'code sent AGAIN successfully to your email' : 'code sent successfully to your email'
                          })
                      }).catch(err => {
                          //console.log(err)
                          res.status(200).json({
                              "status": false,
                              "message": "error please try again",
                          })
                      })
                  });
              }
              else {
                sendMessage([req.body.email],`Your code is ${generatedCode}`,"iThoob")
                .then(()=>{
                  if (req.body.type == "pass") {
                    return user.update({password: hash}).then(() => {
                        res.status(200).json({
                            "status": true,
                            "type": "pass true",
                            "message": req.body.secondTime ? 'code sent AGAIN successfully to your mobile' : 'code sent successfully to your mobile'
                        })
                    }).catch(err => {
                        //console.log(err)
                        res.status(200).json({
                            "status": false,
                            "message": "error please try again",
                        })
                    })
                }
                user.createMeta({type: 'code', value: hash}).then(() => {
                    res.status(200).json({
                        "status": true,
                        "message": req.body.secondTime ? 'code sent AGAIN successfully to your mobile' : 'code sent successfully to your mobile'
                    })
                }).catch(err => {
                    //console.log(err)
                    res.status(200).json({
                        "status": false,
                        "message": "error please try again",
                    })
                })
                })
                .catch(err => {
                  //console.log(err)
                  res.status(200).json({
                      "status": false,
                      "message": "error please try again",
                  })
                })
              }
          }
      })
  })
})


router.post("/verify-code", (req,res)=>{
  // match the entered password with the encrypted password through bcrypt
  var messages = {
    error: req.body.language === 1 ? "Error please try again later."  : "خطأ حاول مرة أخرى",
    success: req.body.language === 1 ? "password is updated  successfully"  : "تم تحديث كلمة المرور",
  }
  const nameKey = req.body.language === 1 ? "name_en" : "name";
  // if all validations are passed, compare old password sent and the password in database
  User.findOne({
    where:  {
      [Op.or]: [{email: req.body.email}, {mobile: req.body.email}]
    },
    include: [{association: 'Metas'}, { association: "Place", include: [{ association: "Country"}]}]
  }).then(user =>{
    var metaObject = {};
    user.Metas.map(meta => {
      metaObject[meta.type] = meta.value
    })
    if (metaObject.code) {
      return bcrypt.compare(req.body.code, metaObject.code, (err,result)=>{
        // if there's an error
        if (err) {
          //console.log("error1")
          //console.log(err)
          return res.status(200).json({
            "status": false,
            "message": messages.error
          })
        }
        // if the validation and old password are righ
        if (result) {
          // if the code is correct 
          //  return bcrypt.hash(metaObject.code, 10, (err, hash)=>{
            // if(err){
            //   //console.log(err)
            //   return res.status(200).json({
            //     "status": false,
            //     "message": messages.error
            //   })
            // } else {
              // replace the new hash with the old one
              // var updateUserWithNewPass =
               User.update(
                {password: metaObject.code},
                {where: {email: user.email}}
              ).then(() => {
                UserMeta.destroy({
                  where: {
                    user_id: user.id,
                    type: "code"
                  }
                })
                .then(()=>{              
                  // return Promise.all([updateUserWithNewPass]).then(()=>{
                    // if the password is updated successfully
                    res.status(200).json({
                      "status": true,
                      "message": messages.success,
                      "userData": {
                        name: user.name || undefined,
                        email: user.email || undefined,
                        address: user.address || undefined,
                        mobile: user.mobile || undefined,
                        country: user.Place && user.Place.Country ? {id: user.Place.Country.id, name: user.Place.Country[nameKey]} : undefined,
                        area: user.Place ? {id: user.Place.id, name: user.Place[nameKey]} : undefined
                        
                      } 
                    })
                  })
                  .catch(err=> {
                  //console.log("error3")
                    //console.log(err)
                    // if the updating process isn't successful
                    res.status(200).json({
                      "status": false,
                      "message": "Error in removing code"
                    })
                  })
              }).catch(err =>{
                //console.log(err);
                res.status(200).json({
                  status: false,
                  message: "error in updating pass"
                })
                
              });
              // var removeCode = 
              // return Promise.all([updateUserWithNewPass, removeCode])
            // }
          // })
          
        } else {
          return res.status(200).json({
            "status": false,
            "message": req.body.language === 1 ? "code isn't correct" : "الكود غير صحيح"
          })
        }
      })     
    } else {
      return res.status(200).json({
        "status": false,
        "message": req.body.language === 1 ? "you already used your code try with another one" : "لقد استخدمت الكود المرسل حاول ثانية"
      })
    }
  }).catch(err => {
    //console.log(err)
    res.status(200).json({
      "status": false,
      "message": messages.error
    })
  })
  
})

module.exports = router;
