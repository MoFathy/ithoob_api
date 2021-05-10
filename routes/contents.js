const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const {secretKey} = require("../config/keys");
const multer = require('multer');
const path = require('path');
const FtpDeploy = require('ftp-deploy');
var ftpDeploy = new FtpDeploy();
const {FTPconfig} = require("../config/keys");
var config = FTPconfig;
const {fullUrl} = require("../config/keys");
const models = require("../models");
const Content = models.Content;
const ContentMeta = models.ContentMeta;
const Policy = models.Policy;
const ResponseSender = require("./dashboard/ResponseSender");
const HomeSections = models.HomeSections;
const Place = models.Place;

router.post('/whyithoob', (req, res) => {
  const fetchWhy = Content.findAll({
    where: {
      type: "why"
    }
  })
  const fetchMeta = ContentMeta.findAll({
    where: {
      type: "why"
    }
  })
  var titleKey = req.body.language === 1 ? "title_en" : "title"
  var contentKey = req.body.language === 1 ? "content_en" : "content"

  Promise.all([fetchWhy, fetchMeta]).then(responses => {
    var whyItems = responses[0];
    var whyMetas = responses[1];
    var metaObject = {};
    whyMetas.forEach(meta => {
      metaObject[meta.key] =
        meta.value;
    });
    res.status(200).json({
      status: true,
      title: metaObject[titleKey],
      items: whyItems.map(item => {
        return {
          title: item[titleKey],
          content: item[contentKey],
          imgSrc: item.image
        }
      })
    })
  }).catch(err => {
    //console.log(err)
    res.status(401).json({
      status: false,
      message: "error in loading why"
    })
  })
})

router.post('/privacy_policy', (req, res) => {
  var privacyKey = req.body.language === 1 ? "privacy_policy_en" : "privacy_policy"
  var pullKey = req.body.language === 1 ? "pull_back_policy_en" : "pull_back_policy"
  var termsKey = req.body.language === 1 ? "terms_en" : "terms"
  var deliveryKey = req.body.language === 1 ? "delivery_en" : "delivery"

  Policy.findAll()
	.then((responses) => {
		res.status(200).json({
			status: true,
			policies: responses.map((response) => {
				return {
          id: response['id'],
          privacy_policy: response[privacyKey],
          pull_back_policy: response[pullKey],
          terms: response[termsKey],
					delivery: response[deliveryKey],
				}
			})
		})
	})
	.catch(err => {
		// console.log(err)
		res.status(401).json({
			status: false,
			message: "Error while loading privacy policy",
			error: err
		})
	});
})

router.get("/policies", (req, res) => {
	Policy.findAll()
	.then((responses) => {
		res.status(200).json({
			status: true,
			policies: responses.map((response) => {
				return {
          id: response['id'],
          privacy_policy: response['privacy_policy'],
					privacy_policy_en: response['privacy_policy_en'],
					pull_back_policy: response['pull_back_policy'],
          pull_back_policy_en: response['pull_back_policy_en'],
          terms: response['terms'],
          terms_en: response['terms_en'],
          delivery: response['delivery'],
					delivery_en: response['delivery_en'],
				}
			})
		})
	})
	.catch(err => {
		// console.log(err)
		res.status(401).json({
			status: false,
			message: "Error while loading privacy policy",
			error: err
		})
	});
});

router.post(
  "/edit_policies",
  passport.authenticate("jwt-admin", {session: false}),

  (req, res) => {
      if (req.body.privacy_policy && req.body.privacy_policy_en && req.body.pull_back_policy && req.body.pull_back_policy_en
        && req.body.terms && req.body.terms_en && req.body.delivery && req.body.delivery_en) {
        Policy.update({...req.body}, {where: {id: req.body.id}})
        .then((response) => {
            return ResponseSender.sendSuccess(res, "Policies Edited successfully");
        }).catch(error => {
            //console.log(error);
            return ResponseSender.sendDBError(res, "Failed to Edit Policies", error)
        })
      }
      else {
          return ResponseSender.sendInvalidRequest(res, "Failed to Edit Policies")
      }
  }
);

router.post(
  "/update_app_messages",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    models.Message.update({message : req.body.msg}, {where: {type: req.body.type}})
    .then((response) => {
        return ResponseSender.sendSuccess(res, "App Messages Edited successfully");
    }).catch(error => {
        //console.log(error);
        return ResponseSender.sendDBError(res, "Failed to Edit App Messages", error)
    })
  }
);

router.get("/app_messages", (req, res) => {
	models.Message.findAll()
	.then((responses) => {
		res.status(200).json({
			status: true,
			messages: responses
		})
	})
	.catch(err => {
		// console.log(err)
		res.status(401).json({
			status: false,
			message: "Error while loading privacy policy",
			error: err
		})
	});
});

router.post('/aboutithoob', (req, res) => {
  const fetchAbout = Content.findAll({
    where: {
      type: "about"
    }
  })
  const fetchMeta = ContentMeta.findAll({
    where: {
      type: "about"
    }
  })
  var titleKey = req.body.language === 1 ? "title_en" : "title"
  var contentKey = req.body.language === 1 ? "content_en" : "content"

  Promise.all([fetchAbout, fetchMeta]).then(responses => {
    var aboutItems = responses[0];
    var aboutMetas = responses[1];
    var metaObject = {};
    aboutMetas.forEach(meta => {
      metaObject[meta.key] =
        meta.value;
    });
    res.status(200).json({
      status: true,
      videoSrc: metaObject.videoSrc,
      items: aboutItems.map(item => {
        return {
          title: item[titleKey],
          content: item[contentKey],
          imgSrc: item.image
        }
      })
    })
  }).catch(err => {
    //console.log(err)
    res.status(401).json({
      status: false,
      message: "error in loading about"
    })
  })
})


router.post('/faq', (req, res) => {
  const fetchQuestions = models.Question.findAll()
  const fetchMeta = ContentMeta.findAll({
    where: {
      type: "faq"
    }
  })
  var titleKey = req.body.language === 1 ? "title_en" : "title"
  var subtitleKey = req.body.language === 1 ? "subtitle_en" : "subtitle"

  var questionKey = req.body.language === 1 ? "question_en" : "question"
  var answerKey = req.body.language === 1 ? "answer_en" : "answer"

  Promise.all([fetchQuestions, fetchMeta]).then(responses => {
    var questionItems = responses[0];
    var faqMetas = responses[1];
    var metaObject = {};
    faqMetas.forEach(meta => {
      metaObject[meta.key] =
        meta.value;
    });
    res.status(200).json({
      status: true,
      title: metaObject[titleKey],
      subtitle: metaObject[subtitleKey],
      items: questionItems.map(item => {
        return {
          question: item[questionKey],
          answer: item[answerKey]
        }
      })
    })
  }).catch(err => {
    //console.log(err)
    res.status(401).json({
      status: false,
      message: "error in loading why"
    })
  })
})



router.post('/home-sections', (req, res) => {
  var titleKey = req.body.language === 1 ? "title_en" : "title";
  var btnKey = req.body.language === 1 ? "btn_text_en" : "btn_text";
  var contentKey = req.body.language === 1 ? "content_en" : "content"
  // const fetchMeta = ContentMeta.findAll({
  //   where: {
  //     type: "about"
  //   }
  // })

  // const fetchAbout =
  Promise.all([
    Content.findAll({
      where: {
        type: "section"
      },
      include: [{association: 'Steps'}, {association: 'Link'}],
      limit: 4
    }), 
    HomeSections.findAll({order: [ ['section_order', 'ASC']]})
  ]).then(responses => {
      var sections = responses[0];
      var sectionsOrder = responses[1];
    // var metaObject = {};
    // aboutMetas.forEach(meta => {
    //   metaObject[meta.key] =
    //     meta.value;
    // });
    var sectionNames = ["firstSection", "secondSection", "thirdSection", "fourthSection"]
    var sectionsObject = {}
    sections.map((section, index) => {
      sectionsObject[sectionNames[index]] = {
        title: section[titleKey],
        desc: section[contentKey],
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
        linkTitle: section.btn_text !== null ? section[btnKey] : section.Link ? section.Link[titleKey] : undefined,
        linkPath: section.btn_url !== null ? section.btn_url : section.Link ? section.Link.path : undefined,
        imgSrc: section.image,
        steps: section.Steps.length > 0 ? section.Steps.map(section => {
          return {
            title: section[titleKey],
            desc: section[contentKey]
          }

        }) : undefined
      }
    });
    console.log('====================================');
    console.log({...sectionsObject,sectionsOrder});
    console.log('====================================');
    res.status(200).json({
      status: true,
      // videoSrc: metaObject.videoSrc,
      ...sectionsObject,
      sectionsOrder
    })
  }).catch(err => {
    //console.log(err)
    res.status(401).json({
      status: false,
      message: "error in loading about"
    })
  })
})



router.post('/banner', (req, res) => {
  var titleKey = req.body.language === 1 ? "title_en" : "title"
  var contentKey = req.body.language === 1 ? "content_en" : "content"
  var btnText = req.body.language === 1 ? "btn_text_en" : "btn_text"

  // Content.findAll({
  //   where: {
  //     type: "banner"
  //   },
  //   include: [{association: 'Link'}]
  // })
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
  ]).then(responses => {
let sections = responses[0];
var mobile_slides = responses[1];
var text_colors = responses[2];

    res.status(200).json({
      status: true,
      data: sections.map((section) => {
        return {
          title: section[titleKey],
          desc: section[contentKey],
          btn_text: section[btnText],
          btn_url: section.btn_url,
          linkTitle: section.Link ? section.Link[titleKey] : undefined,
          linkPath: section.Link ? section.Link.path : undefined,
          imgSrc: section.image,
          mobile_image : mobile_slides.filter(mobile_slide => mobile_slide.section_id === section.id).length > 0 ? mobile_slides.filter(mobile_slide => mobile_slide.section_id === section.id)[0].image : "",
          text_color : text_colors.filter(text_color => text_color.section_id === section.id).length > 0 ? text_colors.filter(text_color => text_color.section_id === section.id)[0].image : "#ffffff"
        }
      })
    })
  }).catch(err => {
    //console.log(err)
    res.status(401).json({
      status: false,
      message: "error in loading about"
    })
  })
})


router.post("/countries", (req, res) => {
  Place.findAll({
    where: {available: true},
    include: [{association: 'Areas'}]
  }).then((countries) => {
    countries.forEach((itx)=>{
      itx.Areas = itx.Areas.filter((itxs)=>{return itxs.available})
    })
    res.status(200).json({
      status: true,
      countries: countries.filter(country => country.Areas.length > 0).map(country => {
        return {
          id: country.id,
          name: req.body.language === 1 ? country.name_en : country.name,
          areas: country.Areas.map(area => {
            return {
              id: area.id,
              name: req.body.language === 1 ? area.name_en : area.name
            }
          })
        }
      })
    })
  }).catch(err => {
    //console.log(err)
    res.status(200).json({
      status: false
    })
  })
})

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './tmp',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: {fileSize: 3000000},
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).array('images');

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

router.post('/upload', passport.authenticate(['jwt','jwt-admin'], {session: false}), (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      //console.log(err)
      res.json({
        status: false,
        message: 'error'
      });
    } else {
      if (req.files == undefined) {
        res.status(200).json({
          status: false,
          message: 'Error: No File Selected!'
        });
      } else {
        // var fullUrl = req.protocol + '://' + req.get('host') ;

		return ftpDeploy.deploy(config).then(()=>{
		  //console.log('delete')
		  return res.status(200).json({
            status: true,
            message: 'File Uploaded!',
            sources: req.files.map(file => `${fullUrl}${file.filename}`)
          });
	  })


      }
    }
  });
});
// Discuss this with Abdo This AND on delete cascade for everything.
// https://stackoverflow.com/questions/23128816/sequelize-js-ondelete-cascade-is-not-deleting-records-sequelize
router.post('/adminUpload', passport.authenticate('jwt-admin', {session: false}), (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      //console.log(err)
      res.json({
        status: false,
        message: 'error'
      });
    } else {
      if (req.files == undefined) {
        res.status(200).json({
          status: false,
          message: 'Error: No File Selected!'
        });
      } else {
		  return ftpDeploy.deploy(config).then(()=>{
  		  //console.log('delete')

        return res.status(200).json({
          status: true,
          message: 'File Uploaded!',
          sources: req.files.map(file => `${fullUrl}${file.filename}`)
        });
	})
      }
    }
  });
})
// End
module.exports = router;
