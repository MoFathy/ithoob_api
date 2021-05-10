const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender")
const passport = require("passport");
const models = require("../../models");
const Sequelize = require("sequelize");
// const Op = Sequelize.Op;
const Partner = models.Partner;

router.post(
  "/addNewPartner",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    if (
      req.body.name &&
      req.body.domain &&
      req.body.discount &&
      req.body.discount <= 100 &&
      req.body.discount > 0
    )
      Partner.create({
        name: req.body.name,
        domain: req.body.domain,
        discount: req.body.discount
      })
        .then(newPartner => {
          return ResponseSender.sendSuccess(res, "New Partner Created successfully", "newPartner", newPartner);
        })
        .catch(error => {
          return ResponseSender.sendDBError(res, "Failed to Add New Partner", error)
        });
    else
      return ResponseSender.sendInvalidRequest(res, "Failed to Add New Partner, Request is invalid")
  }
);

router.post(
  "/getAllPartners",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Partner.findAll()
      .then(allPartners => {
        return ResponseSender.sendSuccess(res, "All Partners were retrieved successfully", "partners", allPartners)
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Retreive Partners", error)
      });
  }
);

router.post(
  "/getAllPartnerData",
  passport.authenticate("jwt-admin", {session: false}),

  (req, res) => {
    Partner.findOne({where: {id: req.body.id}})
      .then(partnerData => {
        return ResponseSender.sendSuccess(res, "All Partner's Data retrieved successfully", "partnerData", partnerData)
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to retrieved Partner's Data", error)
      });
  }
);

router.post(
  "/editPartner",
  passport.authenticate("jwt-admin", {session: false}),

  (req, res) => {
    if (
      req.body.name &&
      req.body.domain &&
      req.body.discount &&
      req.body.discount <= 100 &&
      req.body.discount > 0
    )
      Partner.update(req.body, {where: {id: req.body.id}})
        .then(message => {
          if (message == 1)
            return ResponseSender.sendSuccess(res, "Partner's Data Edited successfully")
          else
            return ResponseSender.sendInvalidRequest(res, "Failed to Edit Partner")
        })
        .catch(error => {
          return ResponseSender.sendDBError(res, "Failed to Edit Partner", error)
        });
    else
      return ResponseSender.sendInvalidRequest(res, "Failed to Update Partner, Request is invalid")
  }
);

router.post(
  "/deletePartner",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Partner.destroy({where: {id: req.body.id}})
      .then(message => {
        if (message == 1)
          return ResponseSender.sendSuccess(res, "Partner Deleted successfully")
        else
          return ResponseSender.sendInvalidRequest(res, "Failed to Delete Partner")
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Delete Partner", error)
      });
  }
);

module.exports = router;
