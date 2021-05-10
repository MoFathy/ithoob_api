const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const moment = require("moment");
const models = require("../../models");
const ResponseSender = require("./ResponseSender");
const { Content } = require("../../models");
const { HomeSections } = models;

router.get("/home_sections_order", (req, res) => {
  Promise.all([
    Content.findAll({
      where: {
        type: "section",
      },
      include: [{ association: "Steps" }, { association: "Link" }],
      limit: 4,
    }),
    HomeSections.findAll({ order: [["section_order", "ASC"]] }),
  ])
    .then((responses) => {
      var sections = responses[0];
      var sectionsOrder = responses[1];
      // var metaObject = {};
      // aboutMetas.forEach(meta => {
      //   metaObject[meta.key] =
      //     meta.value;
      // });
      var sectionNames = [
        "firstSection",
        "secondSection",
        "thirdSection",
        "fourthSection",
      ];
      var sectionsObject = {};
      sections.map((section, index) => {
        sectionsObject[sectionNames[index]] = {
          id: section["id"],
          title: section["title"],
          title_en: section["title_en"],
          content: section["content"],
          content_en: section["content_en"],

          /**
           * TODO: The condition below is a hacky
           * There is table called "content_links" and some data are coming from it
           * Like the "Link.title/Link.title_en" and "Link.path"
           *
           * For the firstSection (Three Steps Section) shouldn't use those "content_links" table data
           * It has to get the values directly from "contents"
           * The condition below is checking if we have any value in the "contents" or not
           * If exist, we will "assume" that it's the first section, and will use "contents" value instead
           * If null, we will do the normal(old) behavior and get those values from "content_links"
           */
          btn_text:
            section.btn_text !== null
              ? section["btn_text"]
              : section.Link
              ? section.Link["title"]
              : undefined,
          btn_text_en:
            section.btn_text !== null
              ? section["btn_text_en"]
              : section.Link
              ? section.Link["title_en"]
              : undefined,
          btn_url:
            section.btn_url !== null
              ? section.btn_url
              : section.Link
              ? section.Link.path
              : undefined,
          image: section.image,
          steps:
            section.Steps.length > 0
              ? section.Steps.map((section) => {
                  return {
                    id: section["id"],
                    title: section["title"],
                    title_en: section["title_en"],
                    content: section["content"],
                    content_en: section["content_en"],
                  };
                })
              : undefined,
        };
      });
      res.status(200).json({
        status: true,
        // videoSrc: metaObject.videoSrc,
        ...sectionsObject,
        sectionsOrder,
      });
    })
    .catch((err) => {
      //console.log(err)
      res.status(401).json({
        status: false,
        message: "error in loading about",
      });
    });
});

router.post(
  "/edit_home_sections_order",
  passport.authenticate("jwt-admin", { session: false }),

  async (req, res) => {
    console.log(req);
    try {
      if (req.body.target === "sectionsOrder") {
        await req.body.section.forEach((section) => {
          HomeSections.update(
            { section_order: section.section_order, isVisiable: section.isVisiable },
            { where: { id: section.id } }
          );
        });
      } else if (req.body.target === "firstSection") {
        Content.update({ ...req.body.section }, { where: { id: req.body.section.id } });
        await req.body.section.steps.forEach((step) => {
          Content.update({ ...step }, { where: { id: step.id } });
        });
      } else {
        await Content.update(
          { ...req.body.section },
          { where: { id: req.body.section.id } }
        );
      }
      return ResponseSender.sendSuccess(
        res,
        "Home Sections Edited successfully"
      );
    } catch (error) {
      console.log(error);
      return ResponseSender.sendDBError(
        res,
        "Failed to Edit Home Sections",
        error
      );
    }
  }
);

module.exports = router;
