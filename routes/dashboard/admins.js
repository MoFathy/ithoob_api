const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const jwt = require("jsonwebtoken");
const {secretKey} = require("../../config/keys");
const bcrypt = require("bcryptjs")
const models = require("../../models");
const ResponseSender = require("./ResponseSender");
const Admin = models.Admin;
const createAdmin = () => {
  bcrypt.hash('12345678', 10, (err, hash) => {
    Admin.create({
      name: 'admin_1',
      email: 'admin1@webkeyz.com',
      password: hash
    })
  })
}
// createAdmin()
router.post("/login", (req, res) => {
  var messages = {
    error: req.body.language === 1 ? "Error please try again later." : "خطأ حاول مرة أخرى",
    success: req.body.language === 1 ? "signed in  successfully" : "تم تسجيل دخول المستخدم بنجاح",
    emailPassError: req.body.language === 1 ? "ُEmail or password is not correct" : "هناك خطأ في البريد الالكتروني أو كلمة المرور"
  }
  // find user with the email
  var nameKey = req.body.language === 1 ? 'name_en' : 'name'
  Admin.findOne({
    where: {
      email: req.body.email
    }
  }).then(admin => {
    if (!admin) {
      return res.status(200).json({
        "status": false,
        "message": messages.emailPassError
      })
    }
    // match the entered password with the encrypted password through bcrypt

    bcrypt.compare(req.body.password, admin.password, (err, result) => {
      if (err) {
        //console.log(err)
        return res.status(200).json({
          "status": false,
          "message": messages.emailPassError
        })
      }
      if (result) {
        var token = jwt.sign({
          id: admin.id,
          name: admin.name,
          email: admin.email
        }, secretKey)
        return res.status(200).json({
          status: true,
          "access_token": 'Bearer ' + token,
          message: messages.success
        })
      } else {
        return res.status(200).json({
          "status": false,
          "message": messages.emailPassError
        })
      }
    })
  })
})

router.post("/addAdmin", passport.authenticate("jwt-super-admin", {session: false}), (req, res) => {
  if (req.body.name && req.body.email && req.body.role && req.body.password) {
    bcrypt.hash(req.body.password, 10, (error, hash) => {
      if (error) {
        //console.log(error);
        return ResponseSender.sendDBError(res, "Failed to add admin, Bcrypt Error", error);
      }
      else {
        Admin.create({name: req.body.name, email: req.body.email, role: req.body.role, mobile: req.body.mobile, password: hash})
          .then(admin => {
            admin.password = undefined;
            return ResponseSender.sendSuccess(res, "Admin Added Successfully", "admin", admin);
          })
          .catch(error => {
            //console.log(error)
            return ResponseSender.sendDBError(res, "Failed to add admin, DB Error", error);
          })
      }
    })
  }
  else {
    return ResponseSender.sendInvalidRequest(res, "name, email, role, and password are required", null)
  }
})

router.get("/admins", passport.authenticate("jwt-super-admin", {session: false}), (req, res) => {
  Admin.findAll()
    .then(admins => {
      admins.forEach((admin) => {
        admin.password = undefined;
      })
      return ResponseSender.sendSuccess(res, "Admins Retreived Successfully", "admins", admins);
    })
    .catch(error => {
      return ResponseSender.sendDBError(res, "Failed to retreive admin, DB Error", error);
    })
})

router.delete("/deleteAdmin/:id", passport.authenticate("jwt-super-admin", {session: false}), (req, res) => {
  if (req.params.id) {
    if (req.params.id == req.user.id)
      return ResponseSender.sendInvalidRequest(res, "Invalid request, cannot delete yourself", {message: "Invalid request, cannot delete yourself"});
    Admin.findOne({where: {role: "super", [Op.not]: [{id: req.params.id}]}})
      .then(otherSuperAdmin => {
        if (!otherSuperAdmin)
          return ResponseSender.sendInvalidRequest("Cannot delete the only super admin.");

        Admin.destroy({where: {id: req.params.id}})
          .then(destuctionSuccess => {
            if (destuctionSuccess)
              return ResponseSender.sendSuccess(res, "Admin Deleted Successfully", "destuctionSuccess", destuctionSuccess);
            else
              return ResponseSender.sendInvalidRequest(res, "Admin with id = " + req.params.id + " doesn't exist", null)
          })
          .catch(error => {
            return ResponseSender.sendDBError(res, "Failed to delete admin, DB Error", error);
          })
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to delete admin, DB Error", error);
      })
  }
  else {
    return ResponseSender.sendInvalidRequest(res, "id is required", null)
  }
})

router.put("/editAdmin/:id", passport.authenticate("jwt-super-admin", {session: false}), (req, res) => {
  if (req.params.id) {
    Admin.findOne({where: {role: "super", [Op.not]: [{id: req.params.id}]}})
      .then(otherSuperAdmin => {
        //console.log(otherSuperAdmin);
        if (!otherSuperAdmin && req.body.role == "general")
          return ResponseSender.sendInvalidRequest(res,"There has to be at least one super admin.",{message:"There has to be at least one super admin"});
        if (!(req.body.password == null || req.body.password == undefined)) {
          bcrypt.hash(req.body.password, 10, (error, hash) => {
            if (error) {
              //console.log(error);
              return ResponseSender.sendDBError(res, "Failed to add admin, Bcrypt Error", error);
            }
            else {
              Admin.update({...req.body, id: req.params.id, password: hash}, {where: {id: req.params.id}})
                .then(edit => {
                  if (edit[0])
                    return ResponseSender.sendSuccess(res, "Admin Edited Successfully", "editSucess", edit[0]);
                  else
                    return ResponseSender.sendInvalidRequest(res, "Admin with id = " + req.params.id + " Edit failed", edit[0])
                })
                .catch(error => {
                  return ResponseSender.sendDBError(res, "Failed to edit admin, DB Error", error);
                })
            }
          })
        }
        else {
          Admin.update({...req.body, id: req.params.id}, {where: {id: req.params.id}})
            .then(edit => {
              if (edit[0])
                return ResponseSender.sendSuccess(res, "Admin Edited Successfully", "editSucess", edit[0]);
              else
                return ResponseSender.sendInvalidRequest(res, "Admin with id = " + req.params.id + " Edit failed", edit[0])
            })
            .catch(error => {
              return ResponseSender.sendDBError(res, "Failed to edit admin, DB Error", error);
            })
        }
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to edit admin, DB Error", error);
      });
  }
  else {
    return ResponseSender.sendInvalidRequest(res, "id is required", null)
  }
})

module.exports = router;
