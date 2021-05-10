const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const FtpDeploy = require("ftp-deploy");
var ftpDeploy = new FtpDeploy();
const { FTPconfig } = require("../config/keys");
var config = FTPconfig;
const models = require("../models");
const GeneralCoupon = models.GeneralCoupon;
const moment = require("moment");

router.post("/check_for_coupon", (req, res) => {
  var notFoundMessage = req.body.language === 1 ? "This Code Is Wrong" : "هذا الكود غير صحيح"
  var ExpiredMessage = req.body.language === 1 ? "Sorry This Code Has Been Expired !" : "انتهت صلاحية هذا الكود "
  GeneralCoupon.findOne({
    where: {
      code: req.body.coupon_code,
    },
  }).then((coupone) => {
    if (coupone) {
      console.log(coupone.discount);
      //check if order date is between  coupon start and end date
      let compare = moment().isBetween(
        coupone.start_date,
        coupone.end_date
      );
      console.log(compare);
      if (coupone.discount && compare) {
        return res.status(200).json({
          status: true,
          coupon_code: coupone.code,
          coupon_discount: coupone.discount,
        });
      }else{
        return res.status(200).json({
          status: false,
          message: ExpiredMessage,
        });
      }
    } else {
      return res.status(200).json({
        status: true,
        message: notFoundMessage,
      });  
    }
  }).catch((err) => {
    return res.status(401).json({
      status: false,
      message: "error",
    });
  });
});

router.get("/general_coupons", (req, res) => {
  GeneralCoupon.findAll()
    .then((responses) => {
      res.status(200).json({
        status: true,
        general_coupons: responses.map((response) => {
          //check for expired coupons
          let expired = moment().isAfter(response["end_date"]);
          if (expired) {
            GeneralCoupon.update(
              {
                status: 0,
              },
              {
                where: {
                  id: response["id"],
                },
              }
            );
          }
          return {
            id: response["id"],
            name: response["name"],
            code: response["code"],
            status: response["status"] == 0 ? "Not Active" : "Active",
            start_date: response["start_date"],
            end_date: response["end_date"],
            discount: response["discount"],
          };
        }),
      });
    })
    .catch((err) => {
      res.status(401).json({
        status: false,
        message: "Error while loading general coupons ",
        error: err,
      });
    });
});

router.post("/create_general_coupon", (req, res) => {
  coupon = GeneralCoupon.findOne({
    where: {
      code: req.body.code,
    },
  }).then((coupone) => {
    if (coupone) {
      return res.status(422).json({
        status: false,
        message: "This Code Already Exist !",
      });
    } else {
      GeneralCoupon.create({
        name: req.body.name,
        code: req.body.code,
        discount: req.body.discount,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        status: 1,
      })
        .then((general_coupon) => {
          return res.status(200).json({
            status: true,
            message: "Success",
          });
        })
        .catch((err) => {
          return res.status(401).json({
            status: false,
            message: "error",
          });
        });
    }
  });
});

router.post("/delete_general_coupon", (req, res) => {
  coupon = GeneralCoupon.destroy({
    where: {
      id: req.body.id,
    },
  }).then((general_coupon) => {
    return res.status(200).json({
      status: true,
      message: "Success",
    });
  })
  .catch((err) => {
    return res.status(401).json({
      status: false,
      message: "error",
    });
  });
});
module.exports = router;
