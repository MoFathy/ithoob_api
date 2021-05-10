const express = require("express");
const router = express.Router();
const ResponseSender = require('./ResponseSender');
const models = require("../../models");
const Sequelize = require("sequelize");
// const Op = Sequelize.Op;
const Place = models.Place;
const passport = require("passport")
router.post(
  "/addNewPlace",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    if (req.body.name && req.body.name_en)
      Place.create(req.body)
        .then(newPlace => {
          return ResponseSender.sendSuccess(res, "New Place Created successfully", "newPlace", newPlace);
        })
        .catch(error => {
          return ResponseSender.sendDBError(res, "Failed to Add New Place", error)
        });
    else
      return ResponseSender.sendInvalidRequest(res, "Failed to Add New Place, Request is invalid")
  }
);

router.post(
  "/getAllPlaces",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Place.findAll({where: {available: true}, include: [{association: 'Country'}]})
      .then(allPlaces => {
        return ResponseSender.sendSuccess(res, "All Places were retrieved successfully", "places", allPlaces);
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Retreive Places", error)
      });
  }
);

router.post(
  "/getAllPlaceData",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Place.findOne({where: {id: req.body.id}})
      .then(placeData => {
        return ResponseSender.sendSuccess(res, "All Place's Data retrieved successfully", "placeData", placeData);
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to retrieved Place's Data", error)
      });
  }
);

router.post(
  "/editPlace",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    if (req.body.name && req.body.name_en)
      Place.update(req.body, {where: {id: req.body.id}})
        .then(message => {
          return ResponseSender.sendSuccess(res, `Place's Data Edited successfully`);
        })
        .catch(error => {
          return ResponseSender.sendDBError(res, "Failed to Edit Place", error)
        });
    else
      return ResponseSender.sendInvalidRequest(res, "Failed to Update Place, Request is invalid")
  }
);

router.post(
  "/deletePlace",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Place.update({available: false}, {where: {id: req.body.id}})
      .then(message => {
        return ResponseSender.sendSuccess(res, "Place Deleted successfully");
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Delete Place", error)
      });
  }
);

module.exports = router;
