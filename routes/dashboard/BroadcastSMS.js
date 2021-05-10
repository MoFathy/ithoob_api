const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const {sendMessage} = require("../../controller/smsController");
const ResposeSender = require("./ResponseSender");

router.post(
    "/BroadcastSMS",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        // From Here to the line labeled "TO HERE" is the correct code, remove the other code when SMS gateway is up.
        sendMessage(req.body.numbersArr, req.body.message, "iThoob","message")
            .then(result => {
                //console.log(result.data);
                if (result.data[0] == 3)
                    ResposeSender.sendSuccess(res, "SMS(s) sent successfully", "result", result.data);
                else
                    ResposeSender.sendDBError(res, "Couldn't send SMS(s). Something went wrong.", result.data);
            })
            .catch(error => {
                //console.log(error);
                ResposeSender.sendDBError(res, "Couldn't send SMS(s). Something went wrong.", error);
            });
        // TO HERE

        // Temporary Code to simulate the SMS Gateway
        // sendMessage(req.body.numbersArr, req.body.message, "iThoob")
        // .then((result)=>{
        //     ResposeSender.sendSuccess(res, "SMS(s) sent successfully", "result", result);
        // })
    }
);

module.exports = router;