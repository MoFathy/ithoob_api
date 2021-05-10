const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender")
const passport = require("passport");
const models = require("../../models");
const Sequelize = require("sequelize");
// const Op = Sequelize.Op;
const Question = models.Question;

router.post(
    "/addNewQuestion",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        if (
            req.body.question &&
            req.body.question_en &&
            req.body.answer &&
            req.body.answer_en
        )
            Question.create({
                question: req.body.question,
                question_en: req.body.question_en,
                answer: req.body.answer,
                answer_en: req.body.answer_en,
            })
                .then(newQuestion => {
                    return ResponseSender.sendSuccess(res, "New Question Created successfully", "newQuestion", newQuestion);
                })
                .catch(error => {
                    return ResponseSender.sendDBError(res, "Failed to Add New Question", error)
                });
        else
            return ResponseSender.sendInvalidRequest(res, "Failed to Add New Question, Request is invalid")
    }
);

router.post(
    "/getAllQuestions",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        Question.findAll()
            .then(allQuestions => {
                return ResponseSender.sendSuccess(res, "All Questions were retrieved successfully", "questions", allQuestions)
            })
            .catch(error => {
                return ResponseSender.sendDBError(res, "Failed to Retreive Questions", error)
            });
    }
);

router.post(
    "/editQuestion",
    passport.authenticate("jwt-admin", {session: false}),

    (req, res) => {
        if (
            req.body.id &&
            req.body.question &&
            req.body.question_en &&
            req.body.answer &&
            req.body.answer_en
        )
            Question.update(req.body, {where: {id: req.body.id}})
                .then(message => {
                    if (message == 1)
                        return ResponseSender.sendSuccess(res, "Question's Data Edited successfully")
                    else
                        return ResponseSender.sendInvalidRequest(res, "Failed to Edit Question")
                })
                .catch(error => {
                    return ResponseSender.sendDBError(res, "Failed to Edit Question", error)
                });
        else
            return ResponseSender.sendInvalidRequest(res, "Failed to Update Question, Request is invalid")
    }
);

router.post(
    "/deleteQuestion",
    passport.authenticate("jwt-admin", {session: false}),
    (req, res) => {
        Question.destroy({where: {id: req.body.id}})
            .then(message => {
                if (message == 1)
                    return ResponseSender.sendSuccess(res, "Question Deleted successfully")
                else
                    return ResponseSender.sendInvalidRequest(res, "Failed to Delete Question")
            })
            .catch(error => {
                return ResponseSender.sendDBError(res, "Failed to Delete Question", error)
            });
    }
);

module.exports = router;
