const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender")
const passport = require("passport");
const models = require("../../models");
const Sequelize = require("sequelize");
// const Op = Sequelize.Op;
const GeneralOption = models.GeneralOption;
const emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function findCommaSeparatedMatch(emailsString, email) {
    let toBeDeletedOrEdited = escapeRegExp(email);

    let onlyEmailRegex = new RegExp("^" + toBeDeletedOrEdited + "$", "i");
    let onlyMatch = onlyEmailRegex.test(emailsString)

    let begEmailRegex = new RegExp("^" + toBeDeletedOrEdited + ",", "i");
    let begMatch = begEmailRegex.test(emailsString)

    let midEmailRegex = new RegExp("," + toBeDeletedOrEdited + ",", "i");
    let midMatch = midEmailRegex.test(emailsString)

    let endEmailRegex = new RegExp("," + toBeDeletedOrEdited + "$", "i");
    let endMatch = endEmailRegex.test(emailsString)

    return {
        matchObject: onlyMatch ? onlyMatch : begMatch ? begMatch : midMatch ? midMatch : endMatch ? endMatch : null,
        matchType: onlyMatch ? "only" : begMatch ? "beginning" : midMatch ? "middle" : endMatch ? "end" : false
    };
}
router.post(
    "/addNewContactEmail",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {

        if (req.body.email) {
            if (emailRegex.test(req.body.email))
                GeneralOption.findOne({where: {key: "contact_to_mail"}})
                    .then(existingEmails => {
                        if (findCommaSeparatedMatch(existingEmails.value, req.body.email).matchType) {
                            return ResponseSender.sendInvalidRequest(res, "Failed to Add New Contact Email, Email already Exists")
                        }
                        else {
                            let newEmails = existingEmails.value
                            if (newEmails.trim() == "")
                                newEmails = req.body.email;
                            else {
                                newEmails = existingEmails.value + "," + req.body.email;
                            }
                            GeneralOption.update({value: newEmails}, {where: {id: existingEmails.id}})
                                .then((newContactEmails) => {
                                    return ResponseSender.sendSuccess(res, "New contact Email added successfully", "newContactEmails", newContactEmails);
                                }).catch(error => {
                                    //console.log(error);
                                    return ResponseSender.sendDBError(res, "Failed to Add New ContactEmail", error)
                                })
                        }
                    })
                    .catch(error => {
                        //console.log(error);
                        return ResponseSender.sendDBError(res, "Failed to Add New Contact Email", error)
                    });
            else
                return ResponseSender.sendInvalidRequest(res, "Failed to Add New Contact Email, Email is invalid")
        }
        else
            return ResponseSender.sendInvalidRequest(res, "Failed to Add New Contact Email, No email was provided")
    }
);

router.post(
    "/getAllContactEmails",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        GeneralOption.findOne({where: {key: "contact_to_mail"}})
            .then(allContactEmails => {
                let allEmails = allContactEmails.value.split(",");
                return ResponseSender.sendSuccess(res, "All ContactEmails were retrieved successfully", "contactEmails", allEmails)
            })
            .catch(error => {
                return ResponseSender.sendDBError(res, "Failed to Retreive ContactEmails", error)
            });
    }
);

router.post(
    "/editContactEmail",
    passport.authenticate("jwt-admin", {session: false}),

    (req, res) => {
        if (req.body.oldEmail && req.body.newEmail) {
            if (!emailRegex.test(req.body.newEmail))
                return ResponseSender.sendInvalidRequest(res, "Failed to Edit Contact Email, New Email is Invalid");
            GeneralOption.findOne({where: {key: "contact_to_mail"}})
                .then(existingEmails => {
                    if (findCommaSeparatedMatch(existingEmails.value, req.body.newEmail).matchType) {
                        return ResponseSender.sendInvalidRequest(res, "Failed edit Email, Email already Exists")
                    }
                    let newEmails = existingEmails.value;

                    let emailToEditRegex = new RegExp(escapeRegExp(req.body.oldEmail), "i");

                    if (existingEmails.value.toLowerCase().includes(req.body.oldEmail.toLowerCase())) {

                        newEmails = newEmails.replace(emailToEditRegex, req.body.newEmail)

                        GeneralOption.update({value: newEmails}, {where: {id: existingEmails.id}})
                            .then((newContactEmails) => {
                                return ResponseSender.sendSuccess(res, "Contact Email Edited successfully", "contactEmails", newContactEmails);
                            }).catch(error => {
                                //console.log(error);
                                return ResponseSender.sendDBError(res, "Failed to Edit Contact Email", error)
                            })
                    }
                    else {
                        return ResponseSender.sendInvalidRequest(res, "Failed to Edit Contact Email, Email doesn't exist")

                    }
                })

        }
        else {
            return ResponseSender.sendInvalidRequest(res, "Failed to Edit Contact Email, oldEmail and newEmail are needed")
        }
    }
);

router.post(
    "/deleteContactEmail",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        if (req.body.email) {
            GeneralOption.findOne({where: {key: "contact_to_mail"}})
                .then(existingEmails => {
                    let newEmails = existingEmails.value;

                    let toBeDeleted = escapeRegExp(req.body.email);

                    let onlyEmailRegex = new RegExp("^" + toBeDeleted + "$", "i");
                    let begEmailRegex = new RegExp("^" + toBeDeleted + ",", "i");
                    let midEmailRegex = new RegExp("," + toBeDeleted + ",", "i");
                    let endEmailRegex = new RegExp("," + toBeDeleted + "$", "i");
                    let midMatch = midEmailRegex.test(existingEmails.value)
                    let begMatch = begEmailRegex.test(existingEmails.value)
                    let endMatch = endEmailRegex.test(existingEmails.value)
                    let onlyEmailMatch = onlyEmailRegex.test(existingEmails.value)
                    if (midMatch) {
                        let str = String(midEmailRegex.exec(existingEmails.value));
                        str = str.substring(0, str.length - 1);
                        newEmails = existingEmails.value.replace(str, "")
                    }
                    else if (begMatch)
                        newEmails = existingEmails.value.replace(begEmailRegex, "")
                    else if (endMatch)
                        newEmails = existingEmails.value.replace(endEmailRegex, "")
                    else if (onlyEmailMatch)
                        newEmails = existingEmails.value.replace(onlyEmailRegex, "")

                    //console.log(midMatch)
                    //console.log(begMatch)
                    //console.log(endMatch)
                    //console.log(onlyEmailMatch)


                    if (midMatch || begMatch || endMatch || onlyEmailMatch)
                        GeneralOption.update({value: newEmails}, {where: {id: existingEmails.id}})
                            .then((newContactEmails) => {
                                return ResponseSender.sendSuccess(res, "Contact Email Deleteed successfully", "contactEmails", newContactEmails);
                            }).catch(error => {
                                //console.log(error);
                                return ResponseSender.sendDBError(res, "Failed to Delete Contact Email", error)
                            })
                    else {
                        return ResponseSender.sendInvalidRequest(res, "Failed to Delete Contact Email, Email doesn't exist")
                    }
                })
                .catch(error => {
                    //console.log(error);
                    return ResponseSender.sendDBError(res, "Failed to Delete Contact Email", error)
                });
            // else
            //     return ResponseSender.sendInvalidRequest(res, "Failed to Delete New Contact Email, Email is invalid")
        }
        else
            return ResponseSender.sendInvalidRequest(res, "Failed to Delete Contact Email, No email was provided")
    }

);

module.exports = router;
