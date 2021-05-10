const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secretKey } = require("../config/keys");
const generatePassword = require("password-generator");
const nodemailer = require("nodemailer");
const { mailKey } = require("../config/keys");

const models = require("../models");
const User = models.User;

const { sendMessage } = require("../controller/smsController");
const { sendMail } = require("../controller/mailController");


const request = require('request');
const OAuth   = require('oauth-1.0a');
const crypto  = require('crypto');
const credentials_twitter = require("../config/keys").twitter;

const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET } = credentials_twitter;

// let transporter = nodemailer.createTransport({
//   host: mailKey.host,
//   port: mailKey.port,
//   secure: true, // true for 465, false for other ports
//   auth: {
//     user: mailKey.user, // generated ethereal user
//     pass: mailKey.password // generated ethereal password
//   }
// });

var responseMessages = (lang, userName) => ({
  alreadyExists:
    lang == "1"
      ? "Mobile or Email is already registered, please try to login,"
      : "البريد الالكتروني أو الموبيل موجود بالفعل ، يرجى محاولة تسجيل الدخول",
  error:
    lang == "1"
      ? "Error, please try again later"
      : "خطأ ، يرجى المحاولة مرة أخرى في وقت لاحق",
  signedUp:
    lang == "1" ? "registered successfully" : "تم تسجيل المستخدم بنجاح.",
  newUser: lang == "1" ? "this user is a new one" : "هذا المستخدم جديد",
  registeredExistingUser:
  lang == "1"
    ? `Our customer ${userName}`
    : `عميلنا ${userName}... رقمك مسجل لدى آى ثوب.....`,
});

var authUser = (req, res) => {
  if (req.user[1] === "old") {
    // //console.log(req.user.email)
    var token = jwt.sign(
      {
        id: req.user[0].id,
        name: req.user[0].name,
        email: req.user[0].email
      },
      secretKey
    );
    // send the response
    return res.status(200).json({
      access_token: "Bearer " + token,
      status: true,
      message: responseMessages(req.body.language).signedUp,
      // name: req.user[1] == 'new' ? req.user[0].name : undefined,
      // email: req.user[1] == 'new' ? req.user[0].email : undefined,
      newUser: false
    });
  } else if (req.user[1] === "new") {
    return res.status(200).json({
      status: true,
      message: responseMessages(req.body.language).newUser,
      name: req.user[0].name || undefined,
      email: req.user[0].email || undefined,
      newUser: true
    });
  } else {
    return res.status(200).json({
      status: false,
      message: "error"
    });
  }
};

var completeAuth = (req, res) => {
  User.findOne({
    where: {
      [Op.or]: [{ email: req.user[0].email }, { mobile: req.body.mobile }]
    }
  })
    .then(user => {
      if (user) {
        return res.status(200).json({
          status: false,
          message: responseMessages(req.body.language).alreadyExists
        });
      }
      User.create({
        name: req.body.name,
        email: req.user[0].email || req.body.email,
        mobile: req.body.mobile,
        area_id: req.body.area,
        address: req.body.address,
        social_id: req.user[0].social_id
      })
        .then(user => {
          sendMail(user.email, 'Welcome To iThoob', 'We Are Happy To Have You With Us.', 'Welcome To iThoob Community The Fashion Home',"verify")
          var token = jwt.sign(
            {
              id: user.id,
              name: user.name,
              email: user.email
            },
            secretKey
          );
          // send the response
          res.status(200).json({
            access_token: "Bearer " + token,
            status: true,
            message: responseMessages(req.body.language).signedUp
          });
        })
        .catch(err => {
          //console.log(err);
          res.status(200).json({
            status: false,
            message: responseMessages(req.body.language).error
          });
        });
    })

    .catch(err => {
      //console.log(err);
      res.status(200).json({
        status: false,
        message: responseMessages(req.body.language).error
      });
    });
};
router.post(
  "/signup/facebook",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    authUser(req, res);
  }
);

router.post(
  "/signup/twitter",
  passport.authenticate("twitter-token", { session: false }),
  (req, res) => {
    //console.log("then will not happen");
    authUser(req, res);
  }
);


router.post(
  "/request_token",
  (req, res) => {

// Initialize
const oauth = OAuth({
  consumer: {
    key: TWITTER_CONSUMER_KEY,
    secret: TWITTER_CONSUMER_SECRET
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  }
});

const request_data = {
  url: 'https://api.twitter.com/oauth/request_token',
  method: 'POST',
  data: { oauth_callback: req.body.callback }
};
    request({
      url: request_data.url,
      method: request_data.method,
      form: request_data.data,
      headers: oauth.toHeader(oauth.authorize(request_data))
    }, function(error, response, body) {
      return res.status(200).json({
        status: true,
        response: body
      });
    });
    // Promise.all([requestUrl]).then(responses => {
    //   //console.log(responses)
    // })
  }
);

router.post(
  "/auth_token",
  (req, res) => {
    const request_data = {
      url: 'https://api.twitter.com/oauth/access_token',
      method: 'POST',
      data: { oauth_verifier:req.body.verifier,
        oauth_token:req.body.token }
    };
    request({
      url: request_data.url,
      method: request_data.method,
      form: request_data.data,
      // headers: oauth.toHeader(oauth.authorize(request_data))
    }, function(error, response, body) {
      //console.log(body)
      //console.log('token'+req.body.token)
      //console.log('verifer'+req.body.verifier)
      return res.status(200).json({
        status: true,
        response: body
      });
    });
    // Promise.all([requestUrl]).then(responses => {
    //   //console.log(responses)
    // })
  }
);

router.post(
  "/signup/google",
  passport.authenticate("google-plus-token", { session: false }),
  (req, res) => {
    authUser(req, res);
  }
);

router.post(
  "/completeSignup/facebook",
  passport.authenticate("facebook-2", { session: false }),
  (req, res) => {
    completeAuth(req, res);
  }
);

router.post(
  "/completeSignup/twitter",
  passport.authenticate("twitter-token-second", { session: false }),
  (req, res) => {
    //console.log("heeeeeeere in second step");
    completeAuth(req, res);
  }
);

router.post(
  "/completeSignup/google",
  passport.authenticate("google-2", { session: false }),
  (req, res) => {
    completeAuth(req, res);
  }
);

router.post("/signup", (req, res) => {
  User.findOne({
    where: {
      [Op.or]: [{ email: req.body.email }, { mobile: req.body.mobile }]
    },
    include: [
      {
        model: models.UserMeta,
        as: "Metas"
      }
    ]
  }).then(user => {
    let wasFoundByEmail = false;
    if(user)
      wasFoundByEmail = req.body.email == user.email ? true : false;
    if (
      user && 
      user.active == true &&
      (!user.Metas.find(item => item.dataValues.type == "prev") 
      ||
      (
       user.Metas.find(item => item.dataValues.type == "prev") &&
       user.Metas.find(item => item.dataValues.type == "prev").value == "false"
      )
       )
       ) {
      // if user exist

      return res.status(200).json({
        wasFoundByEmail,
        status: false,
        type: "alreadyExists",
        message: responseMessages(req.body.language).alreadyExists,
        existingUser: false
      });
    } else if (
      user &&
      user.active == true &&
      user.Metas.find(item => item.dataValues.type == "prev") &&
      user.Metas.find(item => item.dataValues.type == "prev").value == "true"
    ) {
      var generatedCode = generatePassword(6, false, '[0-9]');
      return bcrypt.hash(generatedCode, 10, (err, hash) => {
        if (err) {
          return res.status(200).json({
            wasFoundByEmail,
            status: false,
            message: responseMessages(req.body.language).error
          });
        } else {
          // let mailOptions = {
          //   from: mailKey.from, // sender address
          //   to: req.body.email, // list of receivers
          //   subject: "Your Code in ithoob", // Subject line
          //   html: `<h2 style="text-align:center;">Your code in ithoob</h2><p style="text-align:center;">Your new generated code is: <br/> <strong style="font-size:30px;" >${generatedCode}</strong></p>` // html body
          // };
          // return transporttransporter.sendMail(mailOptions, (error, info) => {
          //   if (error) {
          //     //console.log(error);
          //     // error in sending email
          //     return res.status(200).json({
          //       status: false,
          //       message: "Error please try again later."
          //     });
          //   }
          //   transporter.close();
          // in case of success
          // User.create({
          //         name: req.body.name,
          //         email: req.body.email,
          //         password: hash,
          //         mobile: req.body.mobile,
          //         area_id: req.body.area,
          //         address: req.body.address
          //       })

          // sendMessage([user.mobile], generatedCode, "iThoob")
          //   .then(response => {
          //     //console.log(response);
          //     user
          //       .update({ password: hash })
          //       .then(() => {
                  res.status(200).json({
                    wasFoundByEmail,
                    status: false,
                    message: responseMessages(req.body.language, user.name).registeredExistingUser,
                    existingUser: true
                    // message:
                    //   req.body.language == 1
                    //     ? `Our customer ${
                    //         user.name
                    //       } .. Your email/phone is registered with IThoob, Please check your number and sign in with the code sent to you.`
                    //     : `عميلنا ${
                    //         user.name
                    //       }  رقمك او بريدك الالكتروني مسجل لدى أى ثوب .. تحقق من هاتفك و قم بتسجيل الدخول عن طريق الكود المرسل اليك`
                  });
                // })
                // .catch(err => {
                //   //console.log(err);
                //   res.status(200).json({
                //     status: false,
                //     message: "error please try again"
                //   });
                // });
            // })
            // .catch(err => {
            //   //console.log(err);
            //   res.status(200).json({
            //     status: false,
            //     message: "error please try again"
            //   });
            // });
          // });
        }
      });
    } 
    else if (user && user.active != true){
      var generatedCode = generatePassword(6, false, '[0-9]');
      console.log(generatedCode);
      return bcrypt.hash(generatedCode, 10, (err, hash) => {
        if (err) {
          return res.status(200).json({
            wasFoundByEmail,
            status: false,
            message: responseMessages(req.body.language).error
          });
        } else {
          // sendMessage(["+20110019893"], "message", "iThoob")
          sendMessage([req.body.mobile], generatedCode, "iThoob", "verify")
            .then(response => {
              //console.log(response);
              // let mailOptions = {
              //   from: mailKey.from, // sender address
              //   to: req.body.email, // list of receivers
              //   subject: "Your Code in ithoob", // Subject line
              //   html: `<h2 style="text-align:center;">Your code in ithoob</h2><p style="text-align:center;">Your new generated code is: <br/> <strong style="font-size:30px;" >${generatedCode}</strong></p>` // html body
              // };
              // return transporter.sendMail(mailOptions, (error, info) => {
              //   if (error) {
              //     //console.log(error);
              //     // error in sending email
              //     return res.status(200).json({
              //       status: false,
              //       message: "Error please try again later."
              //     });
              //   }
              //   transporter.close();
              // in case of success
              user.update({
                name: req.body.name,
                email: req.body.email,
                password: hash,
                mobile: req.body.mobile,
                area_id: req.body.area,
                address: req.body.address
              })
                // user
                //   .update({ password: hash })
                //
                .then(user => {
                  res.status(200).json({
                    status: true,
                    message:
                      req.body.language == 1
                        ? `your verification code is sent to your email.. check your number`
                        : `تم إرسال كود التأكيد إلى ايميلك, يرجى التحقق من الايميل`
                  });
                })
                .catch(err => {
                  //console.log(err);
                  res.status(200).json({
                    status: false,
                    message: "error please try again"
                  });
                });
              // })
            })
            .catch(err => {
              //console.log(err);
              res.status(200).json({
                status: false,
                message: "error please try again"
              });
            });
        }
      });
    }
    else {
      var generatedCode = generatePassword(6, false, '[0-9]');
      console.log(generatedCode);
      return bcrypt.hash(generatedCode, 10, (err, hash) => {
        if (err) {
          return res.status(200).json({
            wasFoundByEmail,
            status: false,
            message: responseMessages(req.body.language).error
          });
        } else {
          // sendMessage(["+20110019893"], "message", "iThoob")
          console.log('====================================');
          console.log([req.body.mobile], generatedCode, "iThoob");
          console.log('====================================');
          sendMessage([req.body.mobile], generatedCode, "iThoob", "verify").then(response => {
              //console.log(response);
              // let mailOptions = {
              //   from: mailKey.from, // sender address
              //   to: req.body.email, // list of receivers
              //   subject: "Your Code in ithoob", // Subject line
              //   html: `<h2 style="text-align:center;">Your code in ithoob</h2><p style="text-align:center;">Your new generated code is: <br/> <strong style="font-size:30px;" >${generatedCode}</strong></p>` // html body
              // };
              // return transporter.sendMail(mailOptions, (error, info) => {
              //   if (error) {
              //     //console.log(error);
              //     // error in sending email
              //     return res.status(200).json({
              //       status: false,
              //       message: "Error please try again later."
              //     });
              //   }
              //   transporter.close();
              // in case of success
              User.create({
                name: req.body.name,
                email: req.body.email,
                password: hash,
                mobile: req.body.mobile,
                area_id: req.body.area,
                address: req.body.address
              })
                // user
                //   .update({ password: hash })
                //
                .then(user => {
                  res.status(200).json({
                    status: true,
                    message:
                      req.body.language == 1
                        ? `your verification code is sent to your email.. check your number`
                        : `تم إرسال كود التأكيد إلى ايميلك تحقق من الايميل`
                  });
                })
                .catch(err => {
                  //console.log(err);
                  res.status(200).json({
                    status: false,
                    message: "error please try again"
                  });
                });
              // })
            })
            .catch(err => {
              //console.log(err);
              res.status(200).json({
                status: false,
                message: "error please try again"
              });
            });
        }
      });
    }
  });
});

router.post("/confirm-user", (req, res) => {
  if (!req.body.code || !req.body.password || (!req.body.email && !req.body.mobile)) {
    return res.status(200).json({
      status: false,
      message: "please make sure to add code, password, and email or mobile"
    });
  }
  User.findOne({
    where: {
      [Op.or]: [{ email: req.body.email }, { mobile: req.body.mobile }]
    },
    // include: [{association: 'Metas', where: {type: 'prev'} }]
    include: [{ association: "Metas" }]
  })
    .then(user => {
      if (!user) {
        return res.status(200).json({
          status: false,
          message: "error in user confirmation, no user with this mail"
        });
      }

      bcrypt.compare(req.body.code, user.password, (err, result) => {
        if (err) {
          //console.log(err);
          return res.status(200).json({
            status: false,
            message: "error in confirming user"
          });
        }
        if (result) {
          // generate authentication token to user
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return res.status(200).json({
                status: false,
                message: responseMessages(req.body.language).error
              });
            } else {
              var userData = {};
              userData["password"] = hash;
              userData["active"] = true;
              if (req.body.email) userData["email"] = req.body.email;
              if (req.body.name) userData["name"] = req.body.name;
              if (req.body.mobile) userData["mobile"] = req.body.mobile;
              if (req.body.area) userData["area_id"] = req.body.area;
              if (req.body.address) userData["address"] = req.body.address;
              sendMail(userData["email"], 'Welcome To iThoob', 'We Are Happy To Have You With Us.', 'Welcome To iThoob Community The Fashion Home',"verify")
              return User.update(
                {
                  ...userData
                },
                {
                  where: {
                    id: user.id
                  }
                }
              )
                .then(() => {
                  var metaObject = {};
                  user.Metas.map(meta => {
                    metaObject[meta.type] = meta.value;
                  });
                  if (metaObject.prev) {
                    return models.UserMeta.destroy({
                      where: {
                        user_id: user.id,
                        type: "prev"
                      }
                    })
                      .then(() => {
                        var token = jwt.sign(
                          {
                            id: user.id,
                            name: user.name,
                            email: user.email
                          },
                          secretKey
                        );

                        // return the response with authentication token
                        res.status(200).json({
                          access_token: "Bearer " + token,
                          status: true,
                          message: "user confirmed successfully",
                          discount: user.discount || undefined
                        });
                      })
                      .catch(err => {
                        //console.log(err);
                        res.status(200).json({
                          status: false,
                          message: "Err in confirming user"
                        });
                      });
                    // promises.push(removeOldUserMeta);
                  }
                  var token = jwt.sign(
                    {
                      id: user.id,
                      name: user.name,
                      email: user.email
                    },
                    secretKey
                  );

                  // return the response with authentication token
                  res.status(200).json({
                    access_token: "Bearer " + token,
                    status: true,
                    message: "user confirmed successfully",
                    discount: user.discount || undefined
                  });
                })
                .catch(err => {
                  //console.log(err);
                  res.status(200).json({
                    status: false,
                    message: "Err in confirming user"
                  });
                });
            }
          });

          // var promises = [updateUser];
        } else {
          return res.status(200).json({
            status: false,
            message: req.body.language == 1 ? "Code is incorrect. Please enter correct code and try again" : "للأسف هذا الكود غير صحيح .. يرجى التأكد من الكود و المحاولة مرة أخرى"
          });
        }
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(200).json({
        status: false,
        message: "Err in confirming user"
      });
    });
});

module.exports = router;
