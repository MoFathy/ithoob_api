const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");

const models = require("../models");
const User = models.User;
const MeasurementGuide = models.MeasurementGuide;
const MeasurementProfile = models.MeasurementProfile;

const moment = require("moment");

// get rollback
router.post(
  "/addmeasure",(req, res) => {
    MeasurementGuide.findAll({
      where: {
        measurement_opt: {
          [Op.in]: [
            "value_1",
            "value_2",
            "value_3",
            "value_4",
            "value_5",
            "value_6",
            "value_7"
          ]
        }
      }
    })
      .then(measurements => {
        res.status(200).json({
          status: true,
          items: measurements.map((item, index) => {
            return {
              itemID: item.id,
              imgTitle:
                req.body.language === 1
                  ? item.image_title_en
                  : item.image_title,
              inputTitle: req.body.language === 1 ? item.name_en : item.name,
              adviceContent: req.body.language === 1 ? item.help_en : item.help,
              max: item.max,
              min: item.min,
			  image: item.image,
              value: index + 1
            };
          })
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(401).json({
          status: false
        });
      });
  }
);

router.post(
  "/savemeasure",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!req.body.fileName) {
      return res.status(200).json({
        status: false,
        message:
          req.body.language === 1
            ? "add fileName"
            : "أضف إسم المقاس"
      });
    }
    const measurementOpt1 = MeasurementGuide.findOne({
      where: {
        measurement_opt: "value_1"
      }
    })
    const measurementOpt2 = MeasurementGuide.findOne({
      where: {
        measurement_opt: "value_2"
      }
    })
    const measurementOpt3 = MeasurementGuide.findOne({
      where: {
        measurement_opt: "value_3"
      }
    })
    const measurementOpt4 = MeasurementGuide.findOne({
      where: {
        measurement_opt: "value_4"
      }
    })
    const measurementOpt5 = MeasurementGuide.findOne({
      where: {
        measurement_opt: "value_5"
      }
    })
    const measurementOpt6 = MeasurementGuide.findOne({
      where: {
        measurement_opt: "value_6"
      }
    })
    const measurementOpt7 = MeasurementGuide.findOne({
      where: {
        measurement_opt: "value_7"
      }
    })

    Promise.all([
      measurementOpt1,
      measurementOpt2,
      measurementOpt3,
      measurementOpt4,
      measurementOpt5,
      measurementOpt6,
      measurementOpt7,

    ]).then(results => {
      const option1 = results[0];
      const option2 = results[1];
      const option3 = results[2];
      const option4 = results[3];
      const option5 = results[4];
      const option6 = results[5];
      const option7 = results[6];

      if (req.body.measurementsInputs.value1 && req.body.measurementsInputs.value1 != "" && (req.body.measurementsInputs.value1 > option1.max || req.body.measurementsInputs.value1  < option1.min)) {
        return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Length is not within the boundaries, please correct it" : "الطول ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
      }

      if (req.body.measurementsInputs.value2 && req.body.measurementsInputs.value2 != "" && (req.body.measurementsInputs.value2 > option2.max || req.body.measurementsInputs.value2  < option2.min)) {
        return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Shoulder is not within the boundaries, please correct it" : "الكتف ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
      }
      if (req.body.measurementsInputs.value3 && req.body.measurementsInputs.value3 != "" && (req.body.measurementsInputs.value3 > option3.max || req.body.measurementsInputs.value3  < option3.min)) {
        return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Waist is not within the boundaries, please correct it" : "الوسط ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
      }
      if (req.body.measurementsInputs.value4 && req.body.measurementsInputs.value4 != "" && (req.body.measurementsInputs.value4 > option4.max || req.body.measurementsInputs.value4  < option4.min)) {
        return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Sleeve's Length is not within the boundaries, please correct it" : "طول اليد سادة ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
      }
      if (req.body.measurementsInputs.value5 && req.body.measurementsInputs.value5 != "" && (req.body.measurementsInputs.value5 > option5.max || req.body.measurementsInputs.value5  < option5.min)) {
        return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Cuff’s circumference is not within the boundaries, please correct it" : "وسع الكبك ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
      }
      if (req.body.measurementsInputs.value6 && req.body.measurementsInputs.value6 != "" && (req.body.measurementsInputs.value6 > option6.max || req.body.measurementsInputs.value6  < option6.min)) {
        return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Sleeve’s Width is not within the boundaries, please correct it" : "وسع الكم ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
      }
      if (req.body.measurementsInputs.value7 && req.body.measurementsInputs.value7 != "" && (req.body.measurementsInputs.value7 > option7.max || req.body.measurementsInputs.value7  < option7.min)) {
        return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Thoob’s neck circumference is not within the boundaries, please correct it" : "وسع الياقة ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
      }
      const measurement = {
        name: req.body.fileName
      };
	  if(req.body.measurementsInputs.value1 && req.body.measurementsInputs.value1 != ""){
		  measurement["value_1"] = req.body.measurementsInputs.value1
	  }
	  if(req.body.measurementsInputs.value2 && req.body.measurementsInputs.value2 != ""){
		  measurement["value_2"] = req.body.measurementsInputs.value2
	  }
	  if(req.body.measurementsInputs.value3 && req.body.measurementsInputs.value3 != ""){
		  measurement["value_3"] = req.body.measurementsInputs.value3
	  }
	  if(req.body.measurementsInputs.value4 && req.body.measurementsInputs.value4 != ""){
		  measurement["value_4"] = req.body.measurementsInputs.value4
	  }
	  if(req.body.measurementsInputs.value5 && req.body.measurementsInputs.value5 != ""){
		  measurement["value_5"] = req.body.measurementsInputs.value5
	  }
	  if(req.body.measurementsInputs.value6 && req.body.measurementsInputs.value6 != ""){
		  measurement["value_6"] = req.body.measurementsInputs.value6
	  }
	  if(req.body.measurementsInputs.value7 && req.body.measurementsInputs.value7 != ""){
		  measurement["value_7"] = req.body.measurementsInputs.value7
	  }
      req.user
        .getMeasurements()
        .then(measurements => {
          if (measurements.length > 0) {
            req.user
              .createMeasurement(measurement)
              .then(createdMeasurement => {
                res.status(200).json({
                  status: true
                });
              })
              .catch(err => {
                //console.log(err);
                res.status(200).json({
                  status: false,
                  message:
                    req.body.language === 1
                      ? "Error please try again later."
                      : "خطأ حاول لاحقاً"
                });
              });
          } else {
            req.user
              .createMeasurement({ ...measurement, default_profile: true })
              .then(createdMeasurement => {
                res.status(200).json({
                  status: true
                });
              })
              .catch(err => {
                //console.log(err);
                res.status(200).json({
                  status: false,
                  message:
                    req.body.language === 1
                      ? "Error please try again later."
                      : "خطأ حاول لاحقاً"
                });
              });
          }
        })
        .catch(err => {
          //console.log(err);
          res.status(401).json({
            status: false,
            message:
              req.body.language === 1
                ? "Error please try again later."
                : "خطأ حاول لاحقاً"
          });
        });
    }).catch(err =>{
      //console.log(err)
      res.status(200).json({
        status: false,
        message: "Error in measurement values"
      })
    })
  }
);

//post rollback
router.post(
  "/measurmentslist",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    req.user
      .getMeasurements()
      .then(profiles => {
        // //console.log(result)
        res.status(200).json({
          status: true,
          generalItems: {
            title: "مقاساتي",
            items: profiles.map(profile => {
              var lengthNotNull = [
                profile["value_1"],
                profile["value_2"],
                profile["value_3"],
                profile["value_4"],
                profile["value_5"],
                profile["value_6"],
                profile["value_7"]
              ].filter(i => i !== null).length;
              var percentage = Math.round((lengthNotNull / 7) * 100);
              return {
                title: profile.name,
                percentage: percentage + "%",
                lastUpdateDate:
                  req.body.language == 1
                    ? moment(profile["updated_at"]).format("LL")
                    : moment(profile["updated_at"])
                        .locale("ar")
                        .format("LL"),
                default: profile.default_profile,
                id: profile.id
              };
            })
          }
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: req.body.language == 1
            ? "Error please try again later."
            : "خطأ حاول لاحقاً"
        });
      });
  }
);
router.post(
  "/measurement-details",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!req.body.profileId) {
      return res.status(200).json({
        status: false,
        message:  req.body.language == 1 ? "please provide profileId" : "أضف رقم المقاس"
      });
    }
    MeasurementProfile.findOne({
      where: {
        id: req.body.profileId
      }
    })
      .then(profile => {
        if (!profile) {
          return res.status(200).json({
            status: false,
            message:  req.body.language == 1 ? "no profile with this id" : "لا يوجد مقاس بهذا الرقم"
          });
        }
        if (profile.user_id !== req.user.id) {
          return res.status(200).json({
            status: false,
            message: req.body.language == 1 ? "this measurement profile is not yours" : "لا تملك هذا المقاس"

          });
        }
        var lengthNotNull = [
          profile["value_1"],
          profile["value_2"],
          profile["value_3"],
          profile["value_4"],
          profile["value_5"],
          profile["value_6"],
          profile["value_7"]
        ].filter(i => i !== null).length;
        var percentage = Math.round((lengthNotNull / 7) * 100);
        res.status(200).json({
          status: true,
          profileDetails: {
            profileId: profile.id,
            name: profile.name,
            percentage: percentage + "%",
            value1: profile.value_1,
            value2: profile.value_2,
            value3: profile.value_3,
            value4: profile.value_4,
            value5: profile.value_5,
            value6: profile.value_6,
            value7: profile.value_7,
            default: profile.default_profile ? "1" : "0"
          }
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: req.body.language == 1 ?  "Error in loading measurement profile details": "خطأ في عرض تفاصيل المقاس"


        });
      });
  }
);
router.post(
  "/edit-measurement",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let updateVar = {};
    if (!req.body.profileId) {
      return res.status(200).json({
        status: false,
        message:
        req.body.language === 1 ?

        "please provide profileId"
        :
        "برجاء إختيار المقاس profileId"
      });
    }
    if(req.body.value1 && req.body.value1 != "" && (req.body.value1 > 185 || req.body.value1 < 50)) {
      return res.status(200).json({
          status: false,
          message: req.body.language === 1 ? "Length is not within the boundaries, please correct it" : "الطول ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
      })
    }
    
    if (req.body.value2 && req.body.value2 != "" && (req.body.value2 > 60 || req.body.value2 < 22)) {
        return res.status(200).json({
            status: false,
            message: req.body.language === 1 ? "Shoulder is not within the boundaries, please correct it" : "الكتف ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
    }
    if (req.body.value3 && req.body.value3 != "" && (req.body.value3 > 94 || req.body.value3 < 30)) {
        return res.status(200).json({
            status: false,
            message: req.body.language === 1 ? "Waist is not within the boundaries, please correct it" : "الوسط ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
    }
    if (req.body.value4 && req.body.value4 != "" && (req.body.value4 > 75 || req.body.value4 < 24)) {
        return res.status(200).json({
            status: false,
            message: req.body.language === 1 ? "Sleeve's Length is not within the boundaries, please correct it" : "طول اليد سادة ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
    }
    if (req.body.value5 && req.body.value5 != "" && (req.body.value5 > 33 || req.body.value5 < 16)) {
        return res.status(200).json({
            status: false,
            message: req.body.language === 1 ? "Cuff’s circumference is not within the boundaries, please correct it" : "وسع الكبك ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
    }
    if (req.body.value6 && req.body.value6 != "" && (req.body.value6 > 23 || req.body.value6 < 8)) {
        return res.status(200).json({
            status: false,
            message: req.body.language === 1 ? "Sleeve’s Width is not within the boundaries, please correct it" : "وسع الكم ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
    }
    if (req.body.value7 && req.body.value7 != "" && (req.body.value7 > 53 || req.body.value7 < 28)) {
        return res.status(200).json({
            status: false,
            message: req.body.language === 1 ? "Thoob’s neck circumference is not within the boundaries, please correct it" : "وسع الياقة ليس من ضمن المقاسات المسموح بها, من فضلك قم بالتعديل"
        })
    }
    if ("name" in req.body) updateVar["name"] = req.body.name;
    if ("value1" in req.body) updateVar["value_1"] = req.body.value1 == "" ? null : req.body.value1;
    if ("value2" in req.body) updateVar["value_2"] = req.body.value2 == "" ? null : req.body.value2;
    if ("value3" in req.body) updateVar["value_3"] = req.body.value3 == "" ? null : req.body.value3;
    if ("value4" in req.body) updateVar["value_4"] = req.body.value4 == "" ? null : req.body.value4;
    if ("value5" in req.body) updateVar["value_5"] = req.body.value5 == "" ? null : req.body.value5;
    if ("value6" in req.body) updateVar["value_6"] = req.body.value6 == "" ? null : req.body.value6;
    if ("value7" in req.body) updateVar["value_7"] = req.body.value7 == "" ? null : req.body.value7;

    if (Object.keys(updateVar).length < 1) {
      return res.status(200).json({
        status: false,
        message:
        req.body.language === 1 ?
        "You didn't add any thing new to update."
        :
        "لم ترسل أي قيمة لتعديل المقاس"
      });
    }
    //console.log(updateVar)
    MeasurementProfile.findOne({
      where: {
        id: req.body.profileId
      }
    })
      .then(profile => {
        if (!profile) {
          return res.status(200).json({
            status: false,
            message: req.body.language == 1 ? "no profile with this id" : "لا يوجد لديك هذا المقاس"
          });
        }
        if (profile.user_id !== req.user.id) {
          return res.status(200).json({
            status: false,
            message: req.body.language == 1 ? "this measurement profile is not yours" : "لا تملك هذا المقاس"
          });
        }
        profile.update(
          {
            ...updateVar
          }
        )
          .then(updatedRows => {
            res.status(200).json({
              status: true,
              message: req.body.language == 1 ? "measurement updated successfully" : "تم تحديث المقاسات"
            });
          })
          .catch(err => {
            //console.log(err);
            res.status(200).json({
              status: false,
              message: req.body.language == 1 ? "error in updating measurement"  : "خطأ في تحديث المقاسات"
            });
          });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: req.body.language == 1 ? "error in updating measurement"  : "خطأ في تحديث المقاسات"
        });
      });

  }
);
router.post(
  "/defaultmeasurement",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {

    if (!req.body.profileId) {
      res.status(200).json({
        status: false,
        message: "please add profileId"
      });
    }
    MeasurementProfile.findOne({
      where: {
        id: req.body.profileId,
        user_id: req.user.id
      }
    }).then(profile => {
      if (!profile) {
        return res.status(200).json({
          status: false,
          message:
            req.body.language === 1
              ? "you don't have a profile with this id."
              : "لا تملك هذا البروفايل"
        });
      }
      MeasurementProfile.update(
        {
          default_profile: false
        },
        { where: { user_id: req.user.id, default_profile : 1 } }
      )
        .then(() => {
          profile.update(
            {
              default_profile: true
            }

          )
            .then(() => {
              res.status(200).json({
                status: true
              });
            })
            .catch(err => {
              //console.log(err);
              res.status(200).json({
                status: false,
                message:
                  req.body.language === 1
                    ? "Error please try again later."
                    : "خطأ حاول لاحقاً"
              });
            });
        })
        .catch(err => {
          //console.log(err);
          res.status(200).json({
            status: false,
            message: req.body.language
              ? "Error please try again later."
              : "خطأ حاول لاحقاً"
          });
        });
    }).catch(err => {
      //console.log(err);
            res.status(200).json({
              status: false,
              message:
                req.body.language === 1
                  ? "Error please try again later."
                  : "خطأ حاول لاحقاً"
            });
    })

  }
);

module.exports = router;
