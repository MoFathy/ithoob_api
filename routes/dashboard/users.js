const express = require("express");
const router = express.Router();
const passport = require("passport");
const models = require("../../models");
const Sequelize = require("sequelize");
const ResponseSender = require('./ResponseSender');
const { request } = require("express");
const Op = Sequelize.Op;
const User = models.User;
const UserMeta = models.UserMeta;
// include associations CHECK PERFORMANCE
// setters and adders on Associations
router.post(
  "/getAllUsers",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    // Request Example
    // Admin Bearer token must be in Headers.
    // {
    //   "searchCriteria":{
    //     "page":1,
    //     "email":"",
    //     "mobile":"11",
    //     "placeId":1
    //   }
    // }

    let searchCriteria = {};
    let off = 0;
    //console.log(req.body.searchCriteria);
    if (req.body.searchCriteria) {
      off = req.body.searchCriteria.page ? 20 * (+req.body.searchCriteria.page - 1) : 0;
      if (req.body.searchCriteria.email)
        searchCriteria.email = {[Op.like]: '%' + String(req.body.searchCriteria.email) + '%'}
      if (req.body.searchCriteria.mobile)
        searchCriteria.mobile = {[Op.like]: '%' + String(req.body.searchCriteria.mobile) + '%'}
      if (req.body.searchCriteria.placeId)
        searchCriteria.area_id = +req.body.searchCriteria.placeId
    }
    // , include:[{association:'Metas'}]
    let requests = [];
    requests.push(
      User.findAll({offset: off, limit: 20, where: searchCriteria,order: [["id", "DESC"]]})
    )
    requests.push(
      User.findAll()
    )
    Promise.all(requests).then(responses => {

      // User.findAll({offset: off, limit: 20, where: searchCriteria})
      //   .then(allUsers => {
          let allUsers = responses[0];
          let count = responses[1].length;
          let queries = [];
          console.log('====================================');
          console.log(count);
          console.log('====================================');
          allUsers.forEach((usr) => {
            queries.push(UserMeta.findAll({where: {type: 'prev', user_id: usr.id}}))
          })
          Promise.all(queries)
            .then((results) => {
              allUsers.forEach((usr, index) => {
                usr.password = undefined;
                usr.dataValues.isPrev = false;
                results[index].forEach((result) => {
                  usr.dataValues.isPrev = result.dataValues.value == 'true';
                })
              })
              let users = {
                allUsers,
                count
              }
            //   let responseObject = {
            //     status: true,
            //     message: "All Users retrieved successfully",
            //     success: true,
            //     allUsers,
            //     count
            // }
            // return res.status(200).json(responseObject)
              return ResponseSender.sendSuccess(res, "All Users retrieved successfully", "users", users)
            })
            .catch(error => {
              return ResponseSender.sendDBError(res, "Failed to Retreive Users", error);
            });
        // })
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Retreive Users", error);
      });
  }
);


router.post(
  "/getAllUserData",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    if (!req.body.id) {
      return ResponseSender.sendInvalidRequest(res, "Failed to Retreive Users, No Id provided", {});
    }
    User.findOne({where:{id: req.body.id}})
      .then(user => {
        return ResponseSender.sendSuccess(res, "All Users retrieved successfully", "user", user)
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Retreive Users", error);
      });
  }
);

router.post(
  "/editUser",
  passport.authenticate("jwt-admin", {session: false}), (req, res) => {
    if (req.body.id)
      User.update({...req.body, discount: req.body.discount ? parseFloat(req.body.discount) : 0}, {where: {id: req.body.id}})
        .then(() => {
          UserMeta.findOne({where: {type: 'prev', user_id: req.body.id}})
            .then(foundMeta => {
              if (foundMeta)
                UserMeta.update({value: String(req.body.isPrev)}, {where: {type: 'prev', user_id: req.body.id}})
                  .then(() => {
                    return ResponseSender.sendSuccess(res, "User's Data Edited successfully")
                  })
                  .catch(error => {
                    return ResponseSender.sendDBError(res, "Failed to Edit User", error);
                  })
              else
                UserMeta.create({value: String(req.body.isPrev), type: 'prev', user_id: req.body.id})
                  .then(() => {
                    return ResponseSender.sendSuccess(res, "User's Data Edited successfully")
                  })
                  .catch(error => {
                    return ResponseSender.sendDBError(res, "Failed to Edit User", error);
                  });
            })
            .catch(error => {
              return ResponseSender.sendDBError(res, "Failed to Edit User", error);
            })
        })
        .catch(error => {
          return ResponseSender.sendDBError(res, "Failed to Edit User", error);
        });
    else
      return ResponseSender.sendInvalidRequest(res, "Failed to Update User, Request is invalid");
  }
);

router.post(
  "/deleteUser",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    User.destroy({where: {id: req.body.id}})
      .then(message => {
        if (message == 1)
          return ResponseSender.sendSuccess(res, "User Deleted successfully")
        else
          return ResponseSender.sendInvalidRequest(res, "Failed to Delete User, User doesn't exist");
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Delete User", error);
      });
  }
);

module.exports = router;
