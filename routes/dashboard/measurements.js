const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender")
const passport = require("passport");
const models = require("../../models");
const Sequelize = require("sequelize");
// const Op = Sequelize.Op;
const MeasurementProfile = models.MeasurementProfile;

router.post(
    "/addNewMeasurementProfile",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        // Request Example
        // Admin Bearer token must be in Headers.
        // {
        //     name   : "data",
        //     userId : "data",
        //     value1 : "data" optional,
        //     value2 : "data" optional,
        //     value3 : "data" optional,
        //     value4 : "data" optional,
        //     value5 : "data" optional,
        //     value6 : "data" optional,
        //     value7 : "data" optional,
        //     defaultProfile : "data" optional
        // }
        if (req.body.userId && req.body.name) {
            if (req.body.defaultProfile == true) {
                MeasurementProfile.update({default_profile: false}, {where: {user_id: req.body.userId, default_profile: true}})
                    .then(() => {
                        MeasurementProfile.create({
                            name: req.body.name,
                            value_1: req.body.value1,
                            value_2: req.body.value2,
                            value_3: req.body.value3,
                            value_4: req.body.value4,
                            value_5: req.body.value5,
                            value_6: req.body.value6,
                            value_7: req.body.value7,
                            value_8: req.body.value8,
                            value_9: req.body.value9,
                            value_10: req.body.value10,
                            value_11: req.body.value11,
                            value_12: req.body.value12,
                            default_profile: req.body.defaultProfile,
                            user_id: req.body.userId
                        }).then(newMeasurementProfile => {
                            return ResponseSender.sendSuccess(res, "New MeasurementProfile Created successfully", "newMeasurementProfile", newMeasurementProfile)
                        }).catch(error => {
                            return ResponseSender.sendDBError(res, "Failed to Add New MeasurementProfile", error)
                        });
                    })
                    .catch(error => {
                        return ResponseSender.sendDBError(res, "Failed to Add New MeasurementProfile", error)
                    });
            }
            else {
                MeasurementProfile.create({
                    name: req.body.name,
                    value_1: req.body.value1,
                    value_2: req.body.value2,
                    value_3: req.body.value3,
                    value_4: req.body.value4,
                    value_5: req.body.value5,
                    value_6: req.body.value6,
                    value_7: req.body.value7,
                    value_8: req.body.value8,
                    value_9: req.body.value9,
                    value_10: req.body.value10,
                    value_11: req.body.value11,
                    value_12: req.body.value12,
                    default_profile: req.body.defaultProfile,
                    user_id: req.body.userId
                }).then(newMeasurementProfile => {
                    return ResponseSender.sendSuccess(res, "New MeasurementProfile Created successfully", "newMeasurementProfile", newMeasurementProfile)
                }).catch(error => {
                    return ResponseSender.sendDBError(res, "Failed to Add New MeasurementProfile", error)
                });
            }
        }
        else
            return ResponseSender.sendInvalidRequest(res, "Failed to Add New MeasurementProfile, Request is invalid")

    }
);


router.post(
    "/getAllUserMeasurements",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        // Request Example
        // Admin Bearer token must be in Headers.
        // {
        //      userId: id
        // }
        if (req.body.userId)
            MeasurementProfile.findAll({where: {user_id: req.body.userId}})
                .then(measurementData => {
                    return ResponseSender.sendSuccess(res, "All MeasurementProfile's Data retrieved successfully", "measurementData", measurementData)
                })
                .catch(error => {
                    return ResponseSender.sendDBError(res, "Failed to retrieve MeasurementProfile's Data", error)
                });
        else
            return ResponseSender.sendInvalidRequest(res, "Failed to Get User's Measurement Profiles, Request is invalid")

    }
);

router.post(
    "/editMeasurementProfile",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        // Request Example
        // Admin Bearer token must be in Headers.
        // {
        //      id : id,
        //      default_profile : bool
        //      anyDataYouWantModified => keys should use the DB's underscored key names NOT CAMEL CASE
        // }
        if (req.body.id && req.body.default_profile != undefined) {
            //console.log(req.body);
            req.body.value_1 = Number(req.body.value_1) ? Number(req.body.value_1) : null
            req.body.value_2 = Number(req.body.value_2) ? Number(req.body.value_2) : null
            req.body.value_3 = Number(req.body.value_3) ? Number(req.body.value_3) : null
            req.body.value_4 = Number(req.body.value_4) ? Number(req.body.value_4) : null
            req.body.value_5 = Number(req.body.value_5) ? Number(req.body.value_5) : null
            req.body.value_6 = Number(req.body.value_6) ? Number(req.body.value_6) : null
            req.body.value_7 = Number(req.body.value_7) ? Number(req.body.value_7) : null
            req.body.value_8 = Number(req.body.value_8) ? Number(req.body.value_8) : null
            req.body.value_9 = Number(req.body.value_9) ? Number(req.body.value_9) : null
            req.body.value_10 = Number(req.body.value_10) ? Number(req.body.value_10) : null
            req.body.value_11 = Number(req.body.value_11) ? Number(req.body.value_11) : null
            req.body.value_12 = Number(req.body.value_12) ? Number(req.body.value_12) : null
            //console.log(req.body);
            MeasurementProfile.findOne({where: {id: req.body.id}})
                .then((profile) => {
                    if (profile.default_profile != req.body.default_profile == true) {
                        MeasurementProfile.update({default_profile: false}, {where: {user_id: profile.user_id, default_profile: true}})
                            .then((updateStatus) => {
                                MeasurementProfile.update(req.body, {where: {id: req.body.id}})
                                    .then(result => {
                                        return ResponseSender.sendSuccess(res, "MeasurementProfile's Data Edited successfully", "result", result)
                                    })
                                    .catch(error => {
                                        return ResponseSender.sendDBError(res, "Failed to Edit MeasurementProfile", error)
                                    });
                            })
                            .catch(error => {
                                return ResponseSender.sendDBError(res, "Failed to Edit MeasurementProfile", error)
                            });
                    }
                    else {
                        MeasurementProfile.update(req.body, {where: {id: req.body.id}})
                            .then(result => {
                                return ResponseSender.sendSuccess(res, "MeasurementProfile's Data Edited successfully", "result", result)
                            })
                            .catch(error => {
                                return ResponseSender.sendDBError(res, "Failed to Edit MeasurementProfile", error)
                            });
                    }
                }).catch(error => {
                    return ResponseSender.sendDBError(res, "Failed to Edit MeasurementProfile", error)
                });

        }
        else
            return ResponseSender.sendInvalidRequest(res, "Failed to Update MeasurementProfile, Request is invalid")
    }
);

router.post(
    "/deleteMeasurementProfile",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        // Request Example
        // Admin Bearer token must be in Headers.
        // {
        //      id: id
        // }
        MeasurementProfile.findOne({where: {id: req.body.id}})
            .then((profile) => {
                MeasurementProfile.destroy({where: {id: req.body.id}})
                    .then(() => {
                        if (profile.default_profile == true) {
                            MeasurementProfile.update({default_profile: true}, {where: {user_id: profile.user_id}, limit: 1})
                                .then((result) => {
                                    return ResponseSender.sendSuccess(res, "MeasurementProfile Deleted successfully")
                                }).catch((error) => {
                                    //console.log(error);
                                    return ResponseSender.sendDBError(res, "Failed to Delete MeasurementProfile", error)
                                })
                        }
                        else {
                            return ResponseSender.sendSuccess(res, "MeasurementProfile Deleted successfully")
                        }
                    })
                    .catch((error) => {
                        //console.log(error);
                        return ResponseSender.sendDBError(res, "Failed to Delete MeasurementProfile", error)
                    })
            })
            .catch((error) => {
                //console.log(error);
                return ResponseSender.sendDBError(res, "Failed to Delete MeasurementProfile", error)
            })
    }
);

module.exports = router;
