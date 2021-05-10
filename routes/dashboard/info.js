const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender")
const passport = require("passport");
const models = require("../../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const Content = models.Content;
const ContentMeta = models.ContentMeta;

// ContentMeta.findOne({where: {[Op.or]: [{type: "about"}, {key: "VideoSrc"}]}});
router.get(
  "/getVideoSource",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    ContentMeta.findOne({where: {[Op.or]: [{type: "about"}, {key: "VideoSrc"}]}})
      .then(src => {
        return ResponseSender.sendSuccess(res, "Video Source retrieved successfully", "videoSource", src);
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to retrieve video source", error)
      });
  }
);

router.put(
  "/editVideoSource",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    ContentMeta.update(req.body, {where: {id: req.body.id}})
      .then(src => {
        return ResponseSender.sendSuccess(res, "Video source edited successfully", "videoSource", src);
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to edit video source", error)
      });
  }
);


router.get(
  "/getInfo",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Content.findAll({where: {type: {[Op.or]: ["why", "about"]}}})
      .then(newInfo => {
        return ResponseSender.sendSuccess(res, "Info retrieved successfully", "info", newInfo);
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to retrieved Info", error)
      });
  }
);

router.post(
  "/addInfo",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    if (
      req.body.title &&
      req.body.title_en &&
      req.body.content &&
      req.body.content_en &&
      req.body.image &&
      req.body.type
    )
      Content.create(req.body)
        .then(newInfo => {
          return ResponseSender.sendSuccess(res, "New Info Created successfully", "newInfo", newInfo);
        })
        .catch(error => {
          return ResponseSender.sendDBError(res, "Failed to Add New Info", error)
        });
    else
      return ResponseSender.sendInvalidRequest(res, "Failed to Add Info, Request is invalid")
  }
);

router.put(
  "/editInfo",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    if (
      req.body.title &&
      req.body.title_en &&
      req.body.content &&
      req.body.content_en &&
      req.body.image &&
      req.body.type
    )
      Content.update(req.body, {where: {id: req.body.id}})
        .then(message => {
          if (message == 1)
            return ResponseSender.sendSuccess(res, "Info's Data Edited successfully")
          else
            return ResponseSender.sendInvalidRequest(res, "Failed to Edit Info")
        })
        .catch(error => {
          return ResponseSender.sendDBError(res, "Failed to Edit Info", error)
        });
    else
      return ResponseSender.sendInvalidRequest(res, "Failed to Update Info, Request is invalid")
  }
);

router.delete(
  "/deleteInfo/:id",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    Content.destroy({where: {id: req.params.id}})
      .then(message => {
        if (message == 1)
          return ResponseSender.sendSuccess(res, "Info Deleted successfully")
        else
          return ResponseSender.sendInvalidRequest(res, "Failed to Delete Info", message)
      })
      .catch(error => {
        return ResponseSender.sendDBError(res, "Failed to Delete Info", error)
      });
  }
);

module.exports = router;
