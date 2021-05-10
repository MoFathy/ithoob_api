const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const models = require("../../models");
const {
  Content,
  Promotion,
  PromotionProductRelationship,
  Product,
  Category,
  GeneralOption
} = models;
const arabicNumbers = ["۰", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

const convertToArabic = number => {
  return String(number)
    .split("")
    .map(char => char === '.' ? '.' :arabicNumbers[Number(char)])
    .join("");
};

router.get("/getHomeHeaderPromotions", (req, res) => {
  const topBanner = Content.findAll({
    where: {
      type: "mobile_top_banner"
    },
    include: [{ association: "Link" }, { association: "Promotion" }]
  });
  const homeBanner = Content.findOne({
    where: {
      type: "mobile_home_banner"
    },
    include: [{ association: "Link" }]
  });
  const todayPromotions = Promotion.findOne({
    where: {
      // end_date: {
      //   [Op.gte]: moment().startOf("day")
      // }
      type: "general"
    },
    include: [
      {
        association: "PromotionProductRelations",
        limit: 5,
        order: [['id', 'DESC']], 
        separate: true
      }
    ]
  });
  const permanentPromotions = Promotion.findOne({
    where: {
      type: "permanent"
    },
    include: [
      {
        association: "Permanents",
        limit: 5,
        order: [['id', 'DESC']], 
        separate: true
      }
    ]
  });
  const latestPromotions = Promotion.findOne({
    // order: [["start_date", "DESC"]],
    where: {
      type: "latest"
    },
    include: [
      {
        association: "PromotionProductRelations",
        limit: 5,
        order: [['id', 'DESC']], 
        separate: true
      }
    ]
  });
  const titleKey = req.headers.language === "1" ? "title_en" : "title";
  const nameKey = req.headers.language === "1" ? "name_en" : "name";
  const seasonKey = req.headers.language === "1" ? "season_en" : "season";
  const typeKey = req.headers.language === "1" ? "type_en" : "type";

  const subTitleKey = req.headers.language === "1" ? "content_en" : "content";
  Promise.all([
    topBanner,
    todayPromotions,
    permanentPromotions,
    latestPromotions,
    homeBanner
  ])
    .then(results => {
      const bannerItems = results[0];
      const todayPromos = results[1];
      const permanentPromos = results[2];
      const latestPromos = results[3];
      const homeItem = results[4];
      var productsTodayQuery = Product.findAll({
        where: {
          available: true,
          id: {
            [Op.in]: todayPromos.PromotionProductRelations.map(
              rel => rel.product_id
            )
          }
        },
        include: [
          { association: "Metas" },
          {
            association: "PromotionProductRelations",
            where: { promotion_id: todayPromos.id },
            include: [{ association: "Promotion" }]
          }
        ]
      });
      var productsLatestQuery = Product.findAll({
        where: {
          available: true,
          id: {
            [Op.in]: latestPromos.PromotionProductRelations.map(
              rel => rel.product_id
            )
          }
        },
        include: [
          { association: "Metas" },
          {
            association: "PromotionProductRelations",
            where: { promotion_id: latestPromos.id },
            include: [{ association: "Promotion" }]
          }
        ]
      });
      var categoryPermanentsQuery = Category.findAll({
        where: {
          id: {
            [Op.in]: permanentPromos.Permanents.map(rel => rel.category_id)
          },
          available: true
        },
        include: [
          { association: "Metas" },
          {
            association: "Promotion"
          }
        ]
      });
      Promise.all([
        productsTodayQuery,
        productsLatestQuery,
        categoryPermanentsQuery
      ])
        .then(results => {
          var productsTodayResult = results[0];
          var productsLatestResult = results[1];
          var categoryPermanentResult = results[2];
          res.status(200).json({
            message: "header promotions loaded successfully",
            status: true,
            topBanner: bannerItems.map(item => {
              return {
                title: item[titleKey],
                subTitle: item[subTitleKey],
                imageUrl: item.image,
                link: item.Link ? item.Link.path : undefined
              };
            }),
            todayPromotions: productsTodayResult.map(product => {
          
              var currentPrice = Math.round(
                product.price *
                  (1 -
                    product.PromotionProductRelations[0].discount_value / 100)
              );
              var productMetaObject = {};
              product.Metas.map(meta => {
                productMetaObject[meta.type] =
                  meta.product_meta_relationship.value;
              });

              return {
                id: product.PromotionProductRelations[0].id,
                title: product[titleKey],
                oldPrice:
                  req.headers.language === "1"
                    ? String(product.price)
                    : convertToArabic(product.price),
                discount:
                  req.headers.language === "1"
                    ? String(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%"
                    : convertToArabic(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%",
                currentPrice:
                  req.headers.language === "1"
                    ? String(currentPrice)
                    : convertToArabic(currentPrice),
                imageUrl: product.image,
                season: productMetaObject[seasonKey],
                type: productMetaObject[typeKey]
              };
            }),

            permanentPromotions: categoryPermanentResult.map(category => {
              var categoryMetaObject = {};
              category.Metas.map(meta => {
                categoryMetaObject[meta.type] =
                  meta.category_meta_relationship.value;
              });
              return {
                id: category.Promotion.id,
                title: category[nameKey],
                imageUrl: categoryMetaObject.image,
                discount:
                  req.headers.language === "1"
                    ? String(category.Promotion.discount) + "%"
                    : convertToArabic(category.Promotion.discount) + "%",
                link: category.Promotion.link
              };
            }),
            homeBanner: homeItem
              ? {
                  title: homeItem[titleKey],
                  subTitle: homeItem[subTitleKey],
                  imageUrl: homeItem.image,
                  link: homeItem.Link
                    ? // id: homeItem.Promotion.id
                      homeItem.Link.path
                    : undefined
                }
              : {},
            latestPromotions: productsLatestResult.map(product => {
              // var product = PromotionProductRelation.Product;
              // //console.log(product)
              var currentPrice = Math.round(
                product.price *
                  (1 -
                    product.PromotionProductRelations[0].discount_value / 100)
              );
              var productMetaObject = {};
              product.Metas.map(meta => {
                productMetaObject[meta.type] =
                  meta.product_meta_relationship.value;
              });

              return {
                // id:  PromotionProductRelation ? PromotionProductRelation.id : undefined,
                id: product.PromotionProductRelations[0].id,

                title: product[titleKey],
                oldPrice:
                  req.headers.language === "1"
                    ? String(product.price)
                    : convertToArabic(product.price),
                discount:
                  req.headers.language === "1"
                    ? String(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%"
                    : convertToArabic(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%",
                currentPrice:
                  req.headers.language === "1"
                    ? String(currentPrice)
                    : convertToArabic(currentPrice),
                imageUrl: product.image,
                season: productMetaObject[seasonKey],
                type: productMetaObject[typeKey]
              };
            })
          });
        })
        .catch(err => {
          //console.log(err);
          res.status(200).json({
            status: false,
            message: "invalid request"
          });
        });
    })
    .catch(err => {
      //console.log(err);
      res.status(200).json({
        status: false,
        message: "invalid request"
      });
    });
});

router.get("/getSeasonPromotions", (req, res) => {
  //console.log(req.headers);
  if (!req.query.pageSize || !req.query.pageNumber) {
    return res.status(200).json({
      status: false,
      message: "please add pageSize and pageNumber parameters"
    });
  }

  const titleKey = req.headers.language === "1" ? "title_en" : "title";
  const seasonKey = req.headers.language === "1" ? "season_en" : "season";
  const typeKey = req.headers.language === "1" ? "type_en" : "type";
  var limit = parseInt(req.query.pageSize);
  var index = parseInt(req.query.pageNumber);
  var offset = limit * (index - 1);

  var promotions = Promotion.findOne({
    where: {
      type: "season"
    },
    include: [{ association: "PromotionProductRelations", limit, offset }]
  });
  var seasonTitle = models.GeneralOption.findOne({
    where: {
      key: req.headers.language === "1" ? "season_name_en" : "season_name"
    }
  });
  Promise.all([promotions, seasonTitle])
    .then(results => {
      var seasonPromo = results[0];
      var title = results[1];

      Product.findAll({
        where: {
          available: true,
          id: {
            [Op.in]: seasonPromo.PromotionProductRelations.map(
              rel => rel.product_id
            )
          }
        },
        include: [
          { association: "Metas" },
          {
            association: "PromotionProductRelations",
            where: { promotion_id: seasonPromo.id }
          }
        ]
      })
        .then(products => {
          res.status(200).json({
            status: true,
            title: title.value,
            seasonPromotions: products.map(product => {
              var currentPrice = Math.round(
                product.price *
                  (1 -
                    product.PromotionProductRelations[0].discount_value / 100)
              );
              var productMetaObject = {};
              product.Metas.map(meta => {
                productMetaObject[meta.type] =
                  meta.product_meta_relationship.value;
              });

              return {
                id: product.PromotionProductRelations[0].id,
                title: product[titleKey],
                oldPrice:
                  req.headers.language === "1"
                    ? String(product.price)
                    : convertToArabic(product.price),
                discount:
                  req.headers.language === "1"
                    ? String(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%"
                    : convertToArabic(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%",
                currentPrice:
                  req.headers.language === "1"
                    ? String(currentPrice)
                    : convertToArabic(currentPrice),
                imageUrl: product.image,
                season: productMetaObject[seasonKey],
                type: productMetaObject[typeKey]
              };
            })
          });
        })
        .catch(err => {
          //console.log(err);
          res.status(200).json({
            status: false
          });
        });
    })
    .catch(err => {
      //console.log(err);
      res.status(200).json({
        message: "invalid request"
      });
    });
});

router.get("/loadMorePromotions/:type", (req, res) => {
  if (!req.query.pageSize || !req.query.pageNumber) {
    return res.status(200).json({
      status: false,
      message: "please add pageSize and pageNumber parameters"
    });
  }
  // //console.log(typeof limit);
  // //console.log(index)
  //console.log(req.params);
  if (!(req.params.type == "latest" || req.params.type == "today")) {
    return res.status(200).json({
      status: false,
      message: "please add right type"
    });
  }
  if (
    /[a-zA-Z]/.test(req.query.pageSize) ||
    /[a-zA-Z]/.test(req.query.pageNumber)
  ) {
    return res.status(200).json({
      status: false,
      message: "please add right params"
    });
  }
  var limit = parseInt(req.query.pageSize);
  var index = parseInt(req.query.pageNumber);
  var offset = limit * (index - 1);
  const titleKey = req.headers.language === "1" ? "title_en" : "title";
  const seasonKey = req.headers.language === "1" ? "season_en" : "season";
  const typeKey = req.headers.language === "1" ? "type_en" : "type";
  Promotion.findOne({
    where: {
      type: req.params.type == "today" ? "general" : req.params.type
    },
    include: [{ association: "PromotionProductRelations", limit, offset }]
  })
    .then(promotion => {
      // //console.log(
      //   promotion.PromotionProductRelations.map(rel => rel.product_id)
      // );
      Product.findAll({
        where: {
          available: true,
          id: {
            [Op.in]: promotion.PromotionProductRelations.map(
              rel => rel.product_id
            )
          }
        },
        include: [
          { association: "Metas" },
          {
            association: "PromotionProductRelations",
            where: { promotion_id: promotion.id }
            // include: [{ association: "Promotion" }]
          }
        ]
      })
        .then(products => {
          res.status(200).json({
            status: true,
            products: products.map(product => {
              var currentPrice = Math.round(
                product.price *
                  (1 -
                    product.PromotionProductRelations[0].discount_value / 100)
              );
              var productMetaObject = {};
              product.Metas.map(meta => {
                productMetaObject[meta.type] =
                  meta.product_meta_relationship.value;
              });

              return {
                // id: PromotionProductRelation.id,
                id: product.PromotionProductRelations[0].id,

                title: product[titleKey],
                oldPrice:
                  req.headers.language === "1"
                    ? String(product.price)
                    : convertToArabic(product.price),
                discount:
                  req.headers.language === "1"
                    ? String(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%"
                    : convertToArabic(
                        product.PromotionProductRelations[0].discount_value
                      ) + "%",
                currentPrice:
                  req.headers.language === "1"
                    ? String(currentPrice)
                    : convertToArabic(currentPrice),
                imageUrl: product.image,
                season: productMetaObject[seasonKey],
                type: productMetaObject[typeKey]
              };
            })
          });
        })
        .catch(err => {
          //console.log(err);
          res.status(200).json({
            status: false
          });
        });
    })
    .catch(err => {
      //console.log(err);
      res.status(200).json({
        status: false
      });
    });
});
router.get("/getPromotionDetails/:id", (req, res) => {
  const titleKey = req.headers.language === "1" ? "title_en" : "title";
  const subTitleKey = req.headers.language === "1" ? "sub_title_en" : "sub_title";

  const seasonKey = req.headers.language === "1" ? "season_en" : "season";
  const typeKey = req.headers.language === "1" ? "type_en" : "type";
  Promise.all([
    PromotionProductRelationship.findOne({
      where: {
        id: req.params.id
      }
    }),
    GeneralOption.findOne({
      where: {
        key: "product_details_url"
      }
    })
  ])
    .then(results => {
      const promoRelation = results[0]
      const productUrl = results[1]
      const product = Product.findOne({
        where: {
          id: promoRelation.product_id
        },
        include: [{ association: "Metas" }]
      });
      const promo = Promotion.findOne({
        where: {
          id: promoRelation.promotion_id
        }
      });
      Promise.all([product])
        .then(results => {
          var product = results[0];
          // var promotion = results[1];
          var productMetaObject = {};
          product.Metas.map(meta => {
            productMetaObject[meta.type] = meta.product_meta_relationship.value;
          });
          var currentPrice = Math.round(
            product.price * (1 - promoRelation.discount_value / 100)
          );
          res.status(200).json({
            status: true,
            message: "promotion details loaded successfully",
            promotionDetails: {
              id: promoRelation.id,
              title: product[titleKey],
              description: product[subTitleKey],
              oldPrice:
                req.headers.language === "1"
                  ? String(product.price)
                  : convertToArabic(product.price),
              discount:
                req.headers.language === "1"
                  ? String(promoRelation.discount_value) + "%"
                  : convertToArabic(promoRelation.discount_value) + "%",
              currentPrice:
                req.headers.language === "1"
                  ? String(currentPrice)
                  : convertToArabic(currentPrice),
              imageUrl: [
                product.image,
                product.image_2,
                product.image_3,
                product.image_4
              ],
              season: productMetaObject[seasonKey],
              type: productMetaObject[typeKey],
              link: productUrl.value + product.slug 
              // + "?isMobile=true"
            }
          });
        })
        .catch(err => {
          //console.log(err);
          res.status(200).json({
            status: false,
            message: "invalid request"
          });
        });
    })
    .catch(err => {
      //console.log(err);
      res.status(200).json({
        status: false,
        message: "invalid request"
      });
    });
});
module.exports = router;
