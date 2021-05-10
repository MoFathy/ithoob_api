const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const moment = require("moment");
const models = require("../../models");
const { Partner, Cart, CartProductRelationship, Product, sequelize } = models;

router.get(
  "/users_carts",
  // passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    var titleKey = req.body.language === 1 ? "title_en" : "title";

    const cartFetch = Cart.findAll({
      // limit: 10,
      include: [
        {
          model: models.CartProductRelationship,
          as: "CartProductRelationships",
          where: { cart_id: { $col: "Cart.id" } },
          include: [{ model: models.Product, as: "Product" }],
        },
        {
          model: models.User,
          as: "User",
          where: { id: { $col: "Cart.user_id" } },
          include: [{ association: "Place", include: [{ association: "Country" }] }],
        },
        // {
        //   association: "User",
        //   include: [
        //     { association: "Place", include: [{ association: "Country" }] },
        //   ],
        // },
        { association: "Code", include: [{ association: "Partner" }] },
      ],
    });
    Promise.all([cartFetch])
      .then((responses) => {
        var carts = responses[0];
        res.status(200).json({ carts });
      })
      .catch((err) => {
        console.log(err);
        res.status(401).json({
          status: false,
          message: "Error in loading cart items",
        });
      });
  }
);

module.exports = router;
