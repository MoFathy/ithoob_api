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
const GeneralOption = models.GeneralOption;

router.post("/check_for_coupon", (req, res) => {
  var notFoundMessage =
    req.body.language === 1 ? "This Code Is Wrong" : "هذا الكود غير صحيح";
  var ExpiredMessage =
    req.body.language === 1
      ? "Sorry This Code Has Been Expired !"
      : "انتهت صلاحية هذا الكود ";
  GeneralCoupon.findOne({
    where: {
      code: req.body.coupon_code,
    },
  })
    .then((coupone) => {
      if (coupone) {
        console.log(coupone.discount);
        //check if order date is between  coupon start and end date
        let compare = moment().isBetween(coupone.start_date, coupone.end_date);
        console.log(compare);
        if (coupone.discount && compare && coupone.status) {
          return res.status(200).json({
            status: true,
            coupon_code: coupone.code,
            coupon_discount_type: coupone.discount_type,
            coupon_discount: coupone.discount,
          });
        } else {
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
    })
    .catch((err) => {
      return res.status(401).json({
        status: false,
        message: "error",
      });
    });
});

router.get("/general_coupons", (req, res) => {
  const discounts = GeneralOption.findAll({
    where: { key: ["purchased_items_to_discount", "free_items"] },
  });
  const coupones = GeneralCoupon.findAll();
  Promise.all([discounts, coupones])
    .then((responses) => {
      let purchased_items_to_discount = responses[0].find(
        (item) => item.key == "purchased_items_to_discount"
      );
      let free_items = responses[0].find((item) => item.key == "free_items");

      res.status(200).json({
        status: true,
        general_coupons: responses[1].map((response) => {
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
            discount_type: response["discount_type"],
            discount: response["discount"],
          };
        }),
        quantity_discount: {
          purchased_items: Number(purchased_items_to_discount["value"]),
          free_items: Number(free_items["value"]),
        },
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
        discount_type: req.body.discount_type,
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

router.post("/create_discount", async (req, res) => {
  var queryOne;
  var queryTwo;

  await GeneralOption.findOne({
    where: { key: "purchased_items_to_discount" },
  }).then((item) => {
    if (item) {
      queryOne = item.update({ value: req.body.purchased_items });
    } else {
      queryOne = GeneralOption.create({
        key: "purchased_items_to_discount",
        value: req.body.purchased_items,
      });
    }
  });
  await GeneralOption.findOne({ where: { key: "free_items" } }).then((item) => {
    if (item) {
      queryTwo = item.update({ value: req.body.free_items });
    } else {
      queryTwo = GeneralOption.create({
        key: "free_items",
        value: req.body.free_items,
      });
    }
  });

  Promise.all([queryOne, queryTwo])
    .then((response) => {
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

router.post("/delete_general_coupon", (req, res) => {
  coupon = GeneralCoupon.destroy({
    where: {
      id: req.body.id,
    },
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
});
module.exports = router;
