const express = require("express");
const router = express.Router();
const passport = require("passport");
const ResponseSender = require("./ResponseSender")
const {Content} = require("../../models");

router.get("/first-home-section", (req, res) => {
	Content.findAll({
		where: {
			type: "section"
		},
		include: [{association: 'Steps'}],
		limit: 1
		/**
		 * TODO: This need to be optimized after improving the DB Table Structure
		 * IMPORTANT: We assume that first section would be the "3 Steps" section
		 * If any change has been made in the `contents` DB Table, and the sections order got changed
		 * This endpoint will return another section's data
		 */
	})
	.then(section => {
		section[0].Steps.map(step => console.log(step.id));
		// Gather all section data
		var sectionData = {
			id: section[0].id,
			title: section[0].title,
			title_en: section[0].title_en,
			content: section[0].content,
			content_en: section[0].content_en,
			btn_text: section[0].btn_text,
			btn_text_en: section[0].btn_text_en,
			btn_url: section[0].btn_url,
			image: section[0].image,
			steps: section[0].Steps.map(step => {
				return {
					id: step.id,
					title: step.title,
					title_en: step.title_en,
					content: step.content,
					content_en: step.content_en
				}
			})
		}

		res.status(200).json({
			status: true,
			section: sectionData
		})
	})
	.catch(err => {
		// console.log(err)
		res.status(401).json({
			status: false,
			message: "Error while loading section data",
			error: err
		})
	})
})
  
router.post(
	"/update-three-steps-section",
	passport.authenticate("jwt-admin", {session: false}),
	(req, res) => {
		console.log(req.body)
		const mainSectionInfo = Content.update(req.body, {where: {id: req.body.id}});
		const step1 = Content.update(req.body.steps[0], {where: {id: req.body.steps[0].id}})
		const step2 = Content.update(req.body.steps[1], {where: {id: req.body.steps[1].id}})
		const step3 = Content.update(req.body.steps[2], {where: {id: req.body.steps[2].id}})

		Promise.all([mainSectionInfo, step1, step2, step3])
			.then(response => { 
				console.log(response);
				return ResponseSender.sendSuccess(res, "Section has updated successfully");
			})
			.catch(error => { 
				console.log(error);
				return ResponseSender.sendSuccess(res, "There are some problems while trying to update this section data");
			});
	}
);
	
module.exports = router;