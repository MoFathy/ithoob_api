const express = require("express");
const router = express.Router();
const passport = require("passport");
const ResponseSender = require("./ResponseSender");
const { Content } = require("../../models");

router.get("/banner", (req, res) => {
  Promise.all([
    Content.findAll({
      where: { type: "banner" },
      include: [{ association: "Link" }],
    }),
    Content.findAll({
      where: { title: "mobile_banner" },
      include: [{ association: "Link" }],
    }),
    Content.findAll({
      where: { title: "banner_text_color" },
    }),
  ]).then((responses) => {
    let slides = responses[0];
    let mobile_slides = responses[1];
    var text_colors = responses[2];

      res.status(200).json({
        status: true,
        slides: slides.map((slide) => {
          return {
            id: slide["id"],
            title: slide["title"],
            title_en: slide["title_en"],
            content: slide["content"],
            content_en: slide["content_en"],
            btn_text: slide["btn_text"],
            btn_text_en: slide["btn_text_en"],
            btn_url: slide.btn_url,
            image: slide.image,
            mobile_image : mobile_slides.filter(mobile_slide => mobile_slide.section_id === slide.id).length > 0 ? {
              image : mobile_slides.filter(mobile_slide => mobile_slide.section_id === slide.id)[0].image,
              id : mobile_slides.filter(mobile_slide => mobile_slide.section_id === slide.id)[0].id,
            } : {
              image : "https://higuma.github.io/bootstrap-4-tutorial/img/slide-1.svg"
            },
            text_color : text_colors.filter(text_color => text_color.section_id === slide.id).length > 0 ? {
              image : text_colors.filter(text_color => text_color.section_id === slide.id)[0].image,
              id : text_colors.filter(text_color => text_color.section_id === slide.id)[0].id,
            } : {
              image : "#ffffff"
            }
          };
        }),
      });
    })
    .catch((err) => {
      // console.log(err)
      res.status(401).json({
        status: false,
        message: "Error while loading banner",
        error: err,
      });
    });
});

router.post(
  "/update-banner-slides",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    let requests = [];
    req.body.forEach(slide => {
      requests.push(Content.update(slide, {
        where: { id: slide.id },
      }))
      requests.push(Content.update(slide.mobile_image, {
        where: { id: slide.mobile_image.id },
      }))
      if(slide.text_color.id){
        requests.push(Content.update(slide.text_color, {
          where: { id: slide.text_color.id },
        }))
      }else{
        requests.push(Content.create({title: "banner_text_color",title_en: "banner_text_color",image :slide.text_color.image, section_id: slide.id}))
      }
    });
    // const slide1 = Content.update(req.body[0], {
    //   where: { id: req.body[0].id },
    // });
    // const slide2 = Content.update(req.body[1], {
    //   where: { id: req.body[1].id },
    // });
    // const slide3 = Content.update(req.body[2], {
    //   where: { id: req.body[2].id },
    // });

    Promise.all(requests)
      .then((response) => {
        // console.log(response);
        return ResponseSender.sendSuccess(
          res,
          "Slides were updated successfully"
        );
      })
      .catch((error) => {
        // console.log(error);
        return ResponseSender.sendSuccess(
          res,
          "There are some problems while trying to update the banner slides"
        );
      });
  }
);

router.post(
  "/create-banner-slide",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    console.log("====================================");
    console.log(req.body);
    console.log("====================================");
    Content.create(req.body).then(async slide => {
      // we have been created an content row related to the banner conntent row with section id with title mobile_banner for mobile image 
      // we have been created an content row related to the banner conntent row with section id with title banner_text_color for text color 
      await Content.create({title: "mobile_banner",title_en: "mobile_banner",image :req.body.mobile_image.image, section_id: slide.id});
      await Content.create({title: "banner_text_color",title_en: "banner_text_color",image :req.body.text_color.image, section_id: slide.id});
      return ResponseSender.sendSuccess(
        res,
        "Slide was created successfully"
      );
    }).catch((error) => {
      // console.log(error);
      return ResponseSender.sendSuccess(
        res,
        "There are some problems while trying to create the banner slide"
      );
    });

    // Promise.all([slide])
    //   .then((response) => {
    //     // console.log(response);
    //     return ResponseSender.sendSuccess(
    //       res,
    //       "Slide was creayed successfully"
    //     );
    //   })
    //   .catch((error) => {
    //     // console.log(error);
    //     return ResponseSender.sendSuccess(
    //       res,
    //       "There are some problems while trying to create the banner slide"
    //     );
    //   });
  }
);

router.post(
  "/delete-banner-slide",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    console.log("====================================");
    console.log(req.body);
    console.log("====================================");
    Promise.all([Content.destroy({ where: { id: req.body.id } }), Content.destroy({ where: { id: req.body.mobile_id } }), Content.destroy({ where: { id: req.body.color_id } })])
      .then((response) => {
        // console.log(response);
        return ResponseSender.sendSuccess(
          res,
          "Slide was deleted successfully"
        );
      })
      .catch((error) => {
        // console.log(error);
        return ResponseSender.sendSuccess(
          res,
          "There are some problems while trying to deleted the banner slide"
        );
      });
    // Content.destroy({ where: { id: req.body.id } })
    //   .then((response) => {
    //     console.log(response);
    //     return ResponseSender.sendSuccess(
    //       res,
    //       "Slide was deleted successfully"
    //     );
    //   })
    //   .catch((error) => {
    //     // console.log(error);
    //     return ResponseSender.sendSuccess(
    //       res,
    //       "There are some problems while trying to delete the banner slide"
    //     );
    //   });
  }
);

module.exports = router;
