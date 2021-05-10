const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const moment = require("moment");
const models = require("../models");
const { Partner, Cart, CartProductRelationship, Product, sequelize } = models;

router.post(
  "/cart-items",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var titleKey = req.body.language === 1 ? "title_en" : "title";

    const cartFetch = Cart.findOne({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          association: "User",
          include: [
            { association: "Place", include: [{ association: "Country" }] },
          ],
        },
        { association: "Code", include: [{ association: "Partner" }] },
      ],
    });

    // include: [{model: models.CartProductRelationship, as: 'CartProductRelationships', where: {cart_id: {$col: 'Cart.id'}}, include: [{model: models.MeasurementProfile, as: 'Profile'}]}]
    const partnersFetch = Partner.findAll();
    const measurementsFetch = req.user.getMeasurements();
    const generalOptionFetch = models.GeneralOption.findAll({
      where: { key: { [Op.or]: ["delivery_price", "man_price"] } },
    });
    Promise.all([
      cartFetch,
      partnersFetch,
      measurementsFetch,
      generalOptionFetch,
      models.ProductCategoryRelationship.findAll(),
      models.ProductCategoryRelationshipImage.findAll(),
      models.Category.findAll({ where: { available: true } }),
      models.CategoryRelationship.findAll(),
      models.Quantity.findAll(), // 8
      models.Size.findAll(), // 9
      models.Fabric.findAll(), // 10
      models.CategoryRelationship.findAll({
        where: {
          type: "fabric",
        },
        include: [{ association: "Children", where: { type: "color" } }],
      }), //11
      models.ShoeColor.findAll(), // 12
      models.CategoryMetaRelationship.findAll(),
    ])
      .then((responses) => {
        //   // //console.log(responses)
        var cart = responses[0];
        var partnersList = responses[1];
        var measurementsList = responses[2];
        var generalOptionsList = responses[3];
        const productCategoryRelationshipsResults = responses[4];
        const productCategoryRelationshipImagesResults = responses[5];
        let allCategories = responses[6];
        const filteredCategoryRelationships = responses[7].filter((i) => {
          return (
            responses[6].find((j) => {
              return j.id == i.parent_id;
            }) &&
            responses[6].find((j) => {
              return j.id == i.child_id;
            })
          );
        });
        const filteredProductCategoryRelations = [
          ...productCategoryRelationshipsResults.filter((i) => {
            return (
              i.category_rel_id &&
              filteredCategoryRelationships.find((j) => {
                return j.id == i.category_rel_id;
              })
            );
          }),
        ];
        const findImagewithFabric = function (productIdKey, categoryRelIdKey) {
          // console.log(productIdKey, categoryRelIdKey)
          let prodCatRelImgId = productCategoryRelationshipsResults.find(
            (i) => {
              return (
                i.product_id == productIdKey &&
                i.category_rel_id == categoryRelIdKey
              );
            }
          );
          prodCatRelImgId = prodCatRelImgId ? prodCatRelImgId.id : null;
          return prodCatRelImgId
            ? productCategoryRelationshipImagesResults.find((i) => {
                return i.product_cat_rel_id == prodCatRelImgId;
              })
            : null;
        };
        const stocks = responses[8];
        const sizes = responses[9];
        const fabrics = responses[10];
        const color_for_stock = responses[11];
        const shoes_colors = responses[12];
        const allCategoryMetaRelationships = responses[13];
        CartProductRelationship.findAll({
          where: {
            cart_id: cart.id,
          },
          include: [
            { association: "Profile" },
            {
              association: "Product",
              include: [
                { association: "Metas" },
                {
                  association: "Category",
                  include: [
                    { association: "Metas" },
                    {
                      association: "Parents",
                      include: { association: "Metas" },
                    },
                  ],
                },
                { association: "Stock" },
                // {
                //   association: "Promotions"
                // }
              ],
            },
            { association: "CategoryRelations" },
            { association: "Metas" },
          ],
        })
          .then((cartProductRelations) => {
            // res.status(200).json("here")

            var deliveryCost =
              cart.User.Place && cart.User.Place.delivery_price
                ? cart.User.Place.delivery_price
                : cart.User.Place && cart.User.Place.Country.delivery_price
                ? cart.User.Place.Country.delivery_price
                : generalOptionsList.find((opt) => opt.key === "delivery_price")
                    .value;

            var productsCost = 0.0;
            var costOfsizeManFlag = false;
            cartProductRelations.length > 0
              ? cartProductRelations.map((cartProductRel) => {
                  var product = cartProductRel.Product;
                  // var discount = Math.round(((product.price - product.price_discount) / product.price) * 100);
                  var relationMetaObject = {};
                  // product.Category.Metas.forEach(meta => {
                  //   metaObject[meta.type] =
                  //     meta.category_meta_relationship.value;
                  // });
                  cartProductRel.Metas.forEach((meta) => {
                    relationMetaObject[meta.property] = meta.value;
                  });
                  // //console.log("heeeeeeeeeeeeeeeeeeeeereeeeeeeee")
                  // //console.log(metaObject)
                  // var promoPrice = product.Promotions ? Math.round(
                  //   product.price * (1 - product.Promotions[0].promotion_product_relationship.discount_value / 100)
                  // ) : null;
                  if (relationMetaObject.sizeMan) {
                    costOfsizeManFlag = true;
                  }
                  var productPrice = relationMetaObject.price
                    ? relationMetaObject.price
                    : relationMetaObject.pricePromo
                    ? relationMetaObject.pricePromo
                    : product.price_discount
                    ? product.price_discount
                    : product.price;
                  productsCost +=
                    parseFloat(productPrice) * cartProductRel.quantity;
                })
              : null;

            var partnerDiscount = cart.Code ? cart.Code.Partner.discount : 0;
            var userDiscount = req.user.discount || 0;

            // Apply the biggest coupon discount only
            var userDiscountOriginalVal = userDiscount;
            partnerDiscount >= userDiscount
              ? (userDiscount = 0)
              : (partnerDiscount = 0);

            var sizeMan = !costOfsizeManFlag
              ? 0
              : cart.User.Place && cart.User.Place.man_price
              ? cart.User.Place.man_price
              : cart.User.Place && cart.User.Place.Country.man_price
              ? cart.User.Place && cart.User.Place.Country.man_price
              : generalOptionsList.find((opt) => opt.key === "man_price").value;
            // productsCost = productsCost
            res.status(200).json({
              hasUnavailableItem: (function () {
                let myBooleanValue = false;
                if (cartProductRelations.length > 0) {
                  cartProductRelations.map((cartProductRel) => {
                    if (!cartProductRel.Product.available) {
                      myBooleanValue = true;
                    }
                  });
                }
                return myBooleanValue;
              })(),
              outOfCoverage: !cart.User.Place.available,
              orderSummary: {
                delivery: deliveryCost,
                costOfsizeMan: sizeMan,
                total: productsCost,
                userDiscount:
                  userDiscountOriginalVal !== 0
                    ? userDiscountOriginalVal + "%"
                    : 0,
                // partnerDiscount: partnerDiscount !== 0 ? partnerDiscount + "%" : undefined,
                expectTotal:
                  // productsCost !== 0
                  //   ?
                  (
                    productsCost *
                      (1 - (userDiscount + partnerDiscount) / 100) +
                    parseFloat(deliveryCost) +
                    parseFloat(sizeMan)
                  ).toFixed(2),
                // : 0
              },
              items:
                cartProductRelations.length > 0
                  ? cartProductRelations.map((cartProductRel) => {
                      let currentStocks = [...stocks];
                      var product = cartProductRel.Product;
                      let filteredStock = currentStocks.filter(
                        (e) => e.product_id == product.id
                      );
                      var productCatMeta = {};
                      product.Category.Metas.map((meta) => {
                        productCatMeta[meta.type] =
                          meta.category_meta_relationship.value;
                      });
                      console.log("====================================");
                      console.log('our sluggggg isssss '+productCatMeta.slug);
                      // console.log(cartProductRel.Product);
                      console.log("====================================");

                      var options_stock = [];
                      filteredStock.forEach((qnt) => {
                        var obj = {
                          id: qnt.id,
                          size: null,
                          color: null,
                          fabric: null,
                          shoesColor: null,
                          quantity: qnt.quantity,
                        };
                        sizes.forEach((size) => {
                          if (qnt.quantity > 0 && size.id == qnt.size_id) {
                            let siz =
                              req.body.language == 1
                                ? size.name_en
                                : size.name_ar;
                            obj.size = { id: size.id, name: siz };
                          }
                        });
                        fabrics.forEach((fabric) => {
                          if (qnt.quantity > 0 && fabric.id == qnt.fabric_id) {
                            let fab =
                              req.body.language == 1
                                ? fabric.name_en
                                : fabric.name_ar;
                            obj.fabric = { id: fabric.id, name: fab };
                          }
                        });
                        // console.log('====================================');
                        // console.log(shoes_colors);
                        // console.log('====================================');
                        shoes_colors.forEach((color) => {
                          if (qnt.quantity > 0 && color.id == qnt.color_id) {
                            let col =
                              req.body.language == 1
                                ? color.name_en
                                : color.name_ar;
                            obj.shoesColor = {
                              id: color.id,
                              name: col,
                              image: color.image,
                            };
                          }
                        });
                        if (qnt.quantity > 0) {
                          let sotockcolors = color_for_stock.filter(
                            (colCatRel) => {
                              return colCatRel.id == qnt.color_id;
                            }
                          );
                          if (sotockcolors && sotockcolors.length > 0) {
                            let stocKat = allCategories.filter((cat) => {
                              return cat.id == sotockcolors[0].child_id;
                            });
                            let colorImg = allCategoryMetaRelationships.filter(
                              (img) => {
                                return img.category_id == stocKat[0].id;
                              }
                            );
                            obj.color = {
                              img: colorImg[0].value,
                              id: sotockcolors[0].id,
                            };
                          }
                        }
                        options_stock.push(obj);
                      });
                      var productCatMeta = {};
                      product.Category.Metas.map((meta) => {
                        productCatMeta[meta.type] =
                          meta.category_meta_relationship.value;
                      });
                      var newPrice = product.price_discount || product.price;
                      var discount = Math.round(
                        ((product.price - newPrice) / product.price) * 100
                      );
                      // var promoPrice = product.Promotions ? Math.round(
                      //   product.price * (1 - product.Promotions[0].promotion_product_relationship.discount_value / 100)
                      // ) : null;
                      // var relationMetaObject = {};
                      // product.Category.Metas.forEach(meta => {
                      //   metaObject[meta.type] =
                      //     meta.category_meta_relationship.value;
                      // });
                      // var sizeManCost = cart.User.Place.man_price ? cart.User.Place.man_price : cart.User.Place.Country.man_price ? cart.User.Place.Country.man_price : metaObject['size_man'];
                      var relationMetaObject = {};
                      cartProductRel.Metas.forEach((meta) => {
                        relationMetaObject[meta.property] = meta.value;
                        relationMetaObject["quanity_id"] = meta.quantity_id;
                      });
                      // //console.log(relationMetaObject.price)

                      // StockType (Fabric, Accessories, Shoes, ... etc.)
                      var productStockType = productCatMeta.stock_type
                        ? productCatMeta.stock_type
                        : product.Category.Parents.length
                        ? product.Category.Parents[0]
                          ? product.Category.Parents[0].Metas.length
                            ? product.Category.Parents[0].Metas.find(
                                (myMetaObject) => {
                                  return myMetaObject.type == "stock_type";
                                }
                              )
                              ? product.Category.Parents[0].Metas.find(
                                  (myMetaObject) => {
                                    return myMetaObject.type == "stock_type";
                                  }
                                ).category_meta_relationship.value
                              : null
                            : null
                          : null
                        : null;

                      /**
                       * This ternary condition fixes "UnhandledPromiseRejectionWarning: Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
                       * As some products doesn't have Stock at all. That's why we get this error 👆
                       */
                      var stockAmount =
                        product.Stock && product.Stock.dataValues.value
                          ? product.Stock.dataValues.value
                          : null;
                      var isStockAvailable = stockAmount > 0 ? true : false;
                      var isDesignedProduct =
                        product.Metas.filter(
                          (meta) => meta.type === "customized"
                        ).length >= 1
                          ? true
                          : false;

                      /**
                       * Fabric don't have a Stock
                       * Update `isStockAvailable` to be true for all stockType = fabric (Athwab) OR designed = true (customized)
                       */
                      if (
                        productStockType == "fabric" ||
                        isDesignedProduct == true
                      ) {
                        isStockAvailable = true;
                      }

                      /**
                       * Connect both "notAvailableAnymore" with "OutOfStock" together in "notAvailableAnymore"
                       * This will avoid any conflicts in the Frontend,
                       * All the conditions are using "notAvailableAnymore"
                       * "notAvailableAnymore" is expected to return "false" for all "available" products
                       * If a product has been deleted, and the user still had it in the cart,
                       * it will return "true", and the Frontend conditions will force the user to
                       * remove that product from cart to be able to proceed the order
                       *
                       * We won't implement a different solution, we will re-use the existing conditions
                       * Furthermore, we already pass the "inStock: boolean" value separately if we need it there
                       */
                      var notAvailableProduct =
                        !product.available || !isStockAvailable;

                      return {
                        hasCustomizationOptions:
                          filteredProductCategoryRelations.filter((i) => {
                            return i.product_id == product.id;
                          }).length > 1,
                        price_discount: product.price_discount,
                        options_stock: options_stock,
                        img: (function () {
                          if (
                            cartProductRel &&
                            cartProductRel.CategoryRelations &&
                            cartProductRel.CategoryRelations.find((i) => {
                              return i.type == "fabric";
                            }) &&
                            cartProductRel.CategoryRelations.find((i) => {
                              return i.type == "fabric";
                            }).cart_customize_relationship &&
                            cartProductRel.CategoryRelations.find((i) => {
                              return i.type == "fabric";
                            }).cart_customize_relationship.category_rel_id
                          ) {
                            let fabricImage = findImagewithFabric(
                              product.id,
                              cartProductRel.CategoryRelations.find((i) => {
                                return i.type == "fabric";
                              }).cart_customize_relationship.category_rel_id
                            );
                            return fabricImage && fabricImage.image
                              ? fabricImage.image.replace("-normal", "")
                              : product.image;
                          } else {
                            return product.image;
                          }
                        })(), //product.image,
                        productId: cartProductRel.id,
                        title: product[titleKey],
                        slug: product.slug,
                        subCategory: productCatMeta.slug ? productCatMeta.slug : null,
                        sizeType: productCatMeta.sizeType
                          ? productCatMeta.sizeType
                          : null,
                        stockType: productStockType,
                        quantity: cartProductRel.quantity,
                        designed: isDesignedProduct,
                        edited:
                          cartProductRel.CategoryRelations.length >= 1 &&
                          product.Metas.filter(
                            (meta) => meta.type === "customized"
                          ).length == 0
                            ? true
                            : false,
                        quantity_id: relationMetaObject,
                        selectedSize: {
                          id: cartProductRel.Profile
                            ? cartProductRel.Profile.id
                            : undefined,
                          name: cartProductRel.Profile
                            ? cartProductRel.Profile.name
                            : productCatMeta.sizeType == "shoes"
                            ? relationMetaObject.shoesSize
                            : relationMetaObject.size,
                          complete: cartProductRel.Profile
                            ? cartProductRel.Profile.value_1 != null &&
                              cartProductRel.Profile.value_1 != 0 &&
                              cartProductRel.Profile.value_2 != null &&
                              cartProductRel.Profile.value_2 != 0 &&
                              cartProductRel.Profile.value_3 != null &&
                              cartProductRel.Profile.value_3 != 0 &&
                              cartProductRel.Profile.value_4 != null &&
                              cartProductRel.Profile.value_4 != 0 &&
                              cartProductRel.Profile.value_5 != null &&
                              cartProductRel.Profile.value_5 != 0 &&
                              cartProductRel.Profile.value_6 != null &&
                              cartProductRel.Profile.value_6 != 0 &&
                              cartProductRel.Profile.value_7 != null &&
                              cartProductRel.Profile.value_7 != 0
                            : undefined,
                        },
                        // measurement for parent not for child, check with abdo
                        measurementsTable:
                          product.Category.Metas &&
                          product.Category.Metas.find(
                            (meta) => meta.type == "measurement-table"
                          )
                            ? product.Category.Metas.find(
                                (meta) => meta.type == "measurement-table"
                              ).category_meta_relationship.value
                            : product.Category.Parents[0].Metas
                            ? product.Category.Parents[0].Metas.find(
                                (meta) => meta.type == "measurement-table"
                              )
                              ? product.Category.Parents[0].Metas.find(
                                  (meta) => meta.type == "measurement-table"
                                ).category_meta_relationship.value
                              : undefined
                            : undefined,
                        // "measurements-table": product.Category.Metas.filter(meta => meta.type === 'measurement-table')[0] ? product.Category.Metas.filter(meta => meta.type === 'measurement-table')[0].category_meta_relationship.value : undefined,
                        // sizeMan: relationMetaObject.size === 'sizeMan' ?  true : false,
                        sizeManFlag:
                          (relationMetaObject.sizeMan &&
                            relationMetaObject.sizeMan == "true") ||
                          (relationMetaObject.size &&
                            relationMetaObject.size.toLowerCase() == "sizeman")
                            ? true
                            : false,
                        price: `${
                          product.Metas.filter(
                            (meta) => meta.type === "customized"
                          ).length >= 1 && relationMetaObject.price
                            ? relationMetaObject.price
                            : relationMetaObject.pricePromo
                            ? relationMetaObject.pricePromo
                            : product.price
                        }`,
                        tags: {
                          discount:
                            discount && discount != 0
                              ? discount + "%"
                              : undefined,
                        },
                        notAvailableAnymore: notAvailableProduct,
                        inStock: isStockAvailable,
                      };
                    })
                  : [],
              partnerTable: partnersList.map((partner) => {
                return {
                  name: partner.name,
                  percentage: partner.discount + "%",
                };
              }),
              savedSizes:
                measurementsList.length > 0
                  ? measurementsList.map((size) => {
                      let isComplete =
                        size.value_1 != null &&
                        size.value_1 != 0 &&
                        size.value_2 != null &&
                        size.value_2 != 0 &&
                        size.value_3 != null &&
                        size.value_3 != 0 &&
                        size.value_4 != null &&
                        size.value_4 != 0 &&
                        size.value_5 != null &&
                        size.value_5 != 0 &&
                        size.value_6 != null &&
                        size.value_6 != 0 &&
                        size.value_7 != null &&
                        size.value_7 != 0;
                      return {
                        id: size.id,
                        sizeName: size.name,
                        complete: isComplete,
                      };
                    })
                  : [],
              // cart-items
              allSizesComplete: (function () {
                let yup = true;
                let yupf = [];
                if (cartProductRelations.length > 0) {
                  cartProductRelations.map((cartProductRel) => {
                    var yupo = true;
                    var product = cartProductRel.Product;
                    var productCatMeta = {};
                    product.Category.Metas.map((meta) => {
                      productCatMeta[meta.type] =
                        meta.category_meta_relationship.value;
                    });
                    
                    var relationMetaObject = {};
                    cartProductRel.Metas.forEach((meta) => {
                      relationMetaObject[meta.property] = meta.value;
                      relationMetaObject["quantity_id"] = meta.quantity_id;
                    });

                    console.log('====================================');
                    console.log(productCatMeta, relationMetaObject);
                    console.log('====================================');

                    if (
                      !(
                        relationMetaObject.sizeMan &&
                        relationMetaObject.sizeMan == "true"
                      ) &&
                      cartProductRel.Profile &&
                      (cartProductRel.Profile.value_1 == null ||
                        cartProductRel.Profile.value_1 == 0 ||
                        cartProductRel.Profile.value_2 == null ||
                        cartProductRel.Profile.value_2 == 0 ||
                        cartProductRel.Profile.value_3 == null ||
                        cartProductRel.Profile.value_3 == 0 ||
                        cartProductRel.Profile.value_4 == null ||
                        cartProductRel.Profile.value_4 == 0 ||
                        cartProductRel.Profile.value_5 == null ||
                        cartProductRel.Profile.value_5 == 0 ||
                        cartProductRel.Profile.value_6 == null ||
                        cartProductRel.Profile.value_6 == 0 ||
                        cartProductRel.Profile.value_7 == null ||
                        cartProductRel.Profile.value_7 == 0)
                    ) {
                      yup = false;
                      yupo = false;
                    }
                    if (
                      !(
                        relationMetaObject.sizeMan &&
                        relationMetaObject.sizeMan == "true"
                      ) &&
                      productCatMeta.sizeType &&
                      productCatMeta.sizeType != "accessories" &&
                      !(cartProductRel.Profile
                        ? cartProductRel.Profile.name
                        : productCatMeta.sizeType == "shoes"
                        ? relationMetaObject.shoesSize
                        : relationMetaObject.size)
                    ) {
                      yup = false;
                      yupo = false;
                    }
                    if (
                      (productCatMeta.slug == "all-shoes" &&
                      Object.keys(relationMetaObject).length === 0) ||
                      (productCatMeta.slug == "all-dictate" &&
                      Object.keys(relationMetaObject).length === 0) ||
                      (productCatMeta.slug == "all-sudairy2" &&
                      Object.keys(relationMetaObject).length === 0) ||
                      (productCatMeta.slug == 'ring2' &&
                      Object.keys(relationMetaObject).length === 0) ||
                      (productCatMeta.slug == 'all-rings' &&
                      Object.keys(relationMetaObject).length === 0)
                    ) {
                      yup = false;
                      yupo = false;
                    }
                    if (
                      (productCatMeta.slug == "all-shoes" &&
                      Object.keys(relationMetaObject).length > 0) ||
                      (productCatMeta.slug == "all-dictate" &&
                      Object.keys(relationMetaObject).length > 0) ||
                      (productCatMeta.slug == "all-sudairy2" &&
                      Object.keys(relationMetaObject).length > 0) ||
                      (productCatMeta.slug == 'ring2' &&
                      Object.keys(relationMetaObject).length > 0) ||
                      (productCatMeta.slug == 'all-rings' &&
                      Object.keys(relationMetaObject).length > 0)
                    ) {
                      yupo = true;
                    }
                    yupf.push(yupo);
                  });
                }
                console.log("====================================");
                console.log(yupf);
                console.log("====================================");
                let status = yupf.includes(false) ? false : true;
                return status;
              })(),
              status: true,
            });
          })
          .catch((err) => {
            // console.log(err);
            res.status(200).json({
              status: false,
              message: "Error in loading cart items",
            });
          });
      })
      .catch((err) => {
        // console.log(err);
        res.status(401).json({
          status: false,
          message: "Error in loading cart items",
        });
      });
  }
);

router.post(
  "/header-cart",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var titleKey = req.body.language === 1 ? "title_en" : "title";
    const cartFetch = Cart.findOne({
      where: {
        user_id: req.user.id,
      },
      include: [
        { association: "Code", include: [{ association: "Partner" }] },
        {
          association: "User",
          include: [
            { association: "Place", include: [{ association: "Country" }] },
          ],
        },
      ],

      // include: [{association: 'Code', where: {verified: true}, include: [{association: 'Partner'}]},  {association: 'User', include: [{association: 'Place', include: [{association: 'Country'}]}]}]
    });
    const generalOptionFetch = models.GeneralOption.findAll({
      where: { key: { [Op.or]: ["delivery_price", "man_price"] } },
    });

    Promise.all([cartFetch, generalOptionFetch])
      .then((responses) => {
        var cart = responses[0];

        /**
         * TODO: Remove the "commented" code below
         *
         * Old & Unused Code, affects the API with the following error:
         * TypeError: Cannot read property 'User' of null
         * For now, the code below will be 'commented'
         * If you tested all its cases and it has no effect (Probably it won't)
         * As its value never used.
         */

        /**
        var generalOptionsList = responses[1];
        var deliveryCost =
          cart.User.Place && cart.User.Place.delivery_price
            ? cart.User.Place && cart.User.Place.delivery_price
            : cart.User.Place && cart.User.Place.Country.delivery_price
            ? cart.User.Place.Country.delivery_price
            : generalOptionsList.find(opt => opt.key === "delivery_price")
                .value;
        var sizeMan =
          cart.User.Place && cart.User.Place.man_price
            ? cart.User.Place.man_price
            : cart.User.Place && cart.User.Place.Country.man_price
            ? cart.User.Place.Country.man_price
            : generalOptionsList.find(opt => opt.key === "man_price").value;
        // var deliveryCost = cart.User.Place.delivery_price  ? cart.User.Place.delivery_price :  cart.User.Place.Country.delivery_price;
        var partnerDiscount = cart.Code ? cart.Code.Partner ? cart.Code.Partner.discount : 0 : 0;
        var userDiscount = req.user.discount || 0;
         */

        var productsCost = 0.0;
        var cartItemsNo = 0;
        CartProductRelationship.findAll({
          where: {
            cart_id: cart.id,
          },
          include: [
            { association: "Profile" },
            {
              association: "Product",
              include: [
                { association: "Metas" },
                { association: "Stock" },
                {
                  association: "Category",
                  include: [{ association: "Metas" }],
                },
              ],
            },
            { association: "Metas" },
          ],
        }).then((cartProductRelations) => {
          var hasUnavailableItem = false;

          cartProductRelations.length > 0
            ? cartProductRelations.map((cartProduct) => {
                var product = cartProduct.Product;
                // var discount = Math.round(((product.price - product.price_discount) / product.price) * 100);
                // var metaObject = {};
                // product.Category.Metas.forEach(meta => {
                //   metaObject[meta.type] =
                //     meta.category_meta_relationship.value;
                // });
                // var sizeManCost = cart.User.Place.man_price ? parseFloat(cart.User.Place.man_price) : cart.User.Place.Country.man_price ? parseFloat(cart.User.Place.Country.man_price) : parseFloat(metaObject['size_man']);
                var relationMetaObject = {};
                cartProduct.Metas.forEach((meta) => {
                  relationMetaObject[meta.property] = meta.value;
                });
                // var productPrice = product.price_discount || product.price;
                // var productPrice = relationMetaObject.price
                //   ? relationMetaObject.price
                //   : product.price_discount
                //   ? product.price_discount
                //   : product.price;

                var productPrice = relationMetaObject.price
                  ? relationMetaObject.price
                  : relationMetaObject.pricePromo
                  ? relationMetaObject.pricePromo
                  : product.price_discount
                  ? product.price_discount
                  : product.price;
                productsCost += parseFloat(productPrice) * cartProduct.quantity;
                cartItemsNo += cartProduct.quantity;

                // cost += sizeManCost;
              })
            : null;

          // productsCost = productsCost * (1 - (( partnerDiscount)/100))

          // var sizeMan = cart.User.Place.man_price ? cart.User.Place.man_price : cart.User.Place.Country.man_price
          res.status(200).json({
            outOfCoverage: !cart.User.Place.available,
            status: true,
            cartItemsNo: cartItemsNo,
            // total: productsCost != 0 ? productsCost  : 0,
            total: productsCost,
            // header-cart
            allSizesComplete: (function () {
              let yup = true;
              let yupf = [];
              if (cartProductRelations.length > 0) {
                cartProductRelations.map((cartProductRel) => {
                  var yupo = true;
                  var product = cartProductRel.Product;
                  var productCatMeta = {};
                  product.Category.Metas.map((meta) => {
                    productCatMeta[meta.type] =
                      meta.category_meta_relationship.value;
                  });
                  var relationMetaObject = {};
                  cartProductRel.Metas.forEach((meta) => {
                    relationMetaObject[meta.property] = meta.value;
                    relationMetaObject["quantity_id"] = meta.quantity_id;
                  });
                  console.log('====================================');
                  console.log(productCatMeta, relationMetaObject);
                  console.log('====================================');
                  if (
                    !(
                      relationMetaObject.sizeMan &&
                      relationMetaObject.sizeMan == "true"
                    ) &&
                    cartProductRel.Profile &&
                    (cartProductRel.Profile.value_1 == null ||
                      cartProductRel.Profile.value_1 == 0 ||
                      cartProductRel.Profile.value_2 == null ||
                      cartProductRel.Profile.value_2 == 0 ||
                      cartProductRel.Profile.value_3 == null ||
                      cartProductRel.Profile.value_3 == 0 ||
                      cartProductRel.Profile.value_4 == null ||
                      cartProductRel.Profile.value_4 == 0 ||
                      cartProductRel.Profile.value_5 == null ||
                      cartProductRel.Profile.value_5 == 0 ||
                      cartProductRel.Profile.value_6 == null ||
                      cartProductRel.Profile.value_6 == 0 ||
                      cartProductRel.Profile.value_7 == null ||
                      cartProductRel.Profile.value_7 == 0)
                  ) {
                    yup = false;
                    yupo = false;
                  }
                  if (
                    !(
                      relationMetaObject.sizeMan &&
                      relationMetaObject.sizeMan == "true"
                    ) &&
                    productCatMeta.sizeType &&
                    productCatMeta.sizeType != "accessories" &&
                    !(cartProductRel.Profile
                      ? cartProductRel.Profile.name
                      : productCatMeta.sizeType == "shoes"
                      ? relationMetaObject.shoesSize
                      : relationMetaObject.size)
                  ) {
                    yup = false;
                    yupo = false;
                  }
                  if (
                    (productCatMeta.slug == "all-shoes" &&
                    Object.keys(relationMetaObject).length === 0) ||
                    (productCatMeta.slug == "all-dictate" &&
                    Object.keys(relationMetaObject).length === 0) ||
                    (productCatMeta.slug == "all-sudairy2" &&
                    Object.keys(relationMetaObject).length === 0) ||
                    (productCatMeta.slug == 'ring2' &&
                    Object.keys(relationMetaObject).length === 0) ||
                    (productCatMeta.slug == 'all-rings' &&
                    Object.keys(relationMetaObject).length === 0)
                  ) {
                    yup = false;
                    yupo = false;
                  }
                  if (
                    (productCatMeta.slug == "all-shoes" &&
                    Object.keys(relationMetaObject).length > 0) ||
                    (productCatMeta.slug == "all-dictate" &&
                    Object.keys(relationMetaObject).length > 0) ||
                    (productCatMeta.slug == "all-sudairy2" &&
                    Object.keys(relationMetaObject).length > 0) ||
                    (productCatMeta.slug == 'ring2' &&
                    Object.keys(relationMetaObject).length > 0) ||
                    (productCatMeta.slug == 'all-rings' &&
                    Object.keys(relationMetaObject).length > 0)
                  ) {
                    yupo = true;
                  }
                  yupf.push(yupo);
                });
              }
              console.log("====================================");
              console.log(yupf);
              console.log("====================================");
              let status = yupf.includes(false) ? false : true;
              return status;
            })(),
            cartItemsDetails:
              cartProductRelations.length > 0
                ? cartProductRelations.map((cartProduct) => {
                    var product = cartProduct.Product;
                    var stockAmount =
                      product.Stock && product.Stock.dataValues
                        ? product.Stock.dataValues.value
                        : null;
                    var relationMetaObject = {};
                    cartProduct.Metas.forEach((meta) => {
                      relationMetaObject[meta.property] = meta.value;
                    });
                    var productMetaObject = {};
                    product.Metas.forEach((meta) => {
                      productMetaObject[meta.type] =
                        meta.product_meta_relationship.value;
                    });

                    // Check if there's ONE product Out of Stock or Deleted or if the product stock is negative!
                    /**
                     * TODO: stockAmount mustn't be negative.
                     * When someone orders, we need to check the available `quantity` and `stockAmount` available
                     * If quantity < stockAmount => Approve the order
                     * If quantity > stockAmount => Return message to user that there's only X available in stock from this item
                     */
                    if (stockAmount < 1 || product.available == false) {
                      hasUnavailableItem = true;
                    }

                    // Fabric returns "null" as `stockAmount` because it doesn't have a Stock
                    if (stockAmount == null) {
                      hasUnavailableItem = false;
                    }

                    // var promoPrice = product.Promotions ? Math.round(
                    //   product.price * (1 - product.Promotions[0].promotion_product_relationship.discount_value / 100)
                    // ) : null;
                    // //console.log(productMetaObject)
                    return {
                      // img: productMetaObject.image_thumb,
                      img: product.image,
                      itemTitle: product[titleKey],
                      // itemPrice: `${product.price}`,
                      itemPrice: `${
                        product.Metas.filter(
                          (meta) => meta.type === "customized"
                        ).length >= 1 && relationMetaObject.price
                          ? relationMetaObject.price
                          : product.price_discount
                          ? product.price_discount
                          : relationMetaObject.pricePromo
                          ? relationMetaObject.pricePromo
                          : product.price
                      }`,
                      quantity: cartProduct.quantity,
                      stock: stockAmount,
                    };
                  })
                : [],
            hasUnavailableItem: hasUnavailableItem,
          });
        });
      })
      .catch((err) => {
        // console.log(err);
        res.status(401).json({
          status: false,
          message: "Error in loading header cart",
        });
      });
  }
);

// models.PartnerCode.findOne({
//   where: {
//     code: req.body.partnerCode,
//     verified: false
//   },
//   include: [{association: 'Partner'}]
// }).then(partnerCode => {

router.post(
  "/add-to-cart",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.body.products && req.body.products.length > 0) {
      var partnerCodePromise = req.body.partnerCodeId
        ? models.PartnerCode.findOne({
            where: {
              id: req.body.partnerCodeId,
            },
            include: [{ association: "Partner" }],
          })
        : null;

      return Promise.all([
        models.Cart.findOrCreate({
          where: {
            user_id: req.user.id,
          },
        }),
        partnerCodePromise,
        models.Category.findAll(),
        models.CategoryRelationship.findAll(),
      ])
        .then((results) => {
          var cart = results[0][0];
          var partnerCode = results[1];

          let allCategories = results[2];
          let allCategoryRelations = results[3];
          allCategoryRelations.forEach((i) => {
            // i.Children = allCategories.find(j => {return i.child_id == j.id})
            i.ParentCat = allCategories.find((j) => {
              return i.child_id == j.id;
            });
          });

          sequelize
            .transaction((t) => {
              var promises = [];
              req.body.products.map((item) => {
                var promoPromisesForMobile = req.body.isMobile
                  ? [
                      Product.findOne({
                        where: { id: item.productId },
                        include: [
                          {
                            association: "PromotionProductRelations",
                            include: [
                              {
                                association: "Promotion",
                                where: {
                                  type: "general",
                                },
                              },
                            ],
                          },
                        ],
                      }),
                      Product.findOne({
                        where: { id: item.productId },
                        include: [
                          {
                            association: "PromotionProductRelations",
                            include: [
                              {
                                association: "Promotion",
                                where: {
                                  type: "latest",
                                },
                              },
                            ],
                          },
                        ],
                      }),
                      Product.findOne({
                        where: { id: item.productId },
                        include: [
                          {
                            association: "Category",
                            include: [{ association: "Promotion" }],
                          },
                        ],
                      }),
                      Product.findOne({
                        where: { id: item.productId },
                      }),
                    ]
                  : [];

                var newPromise = Promise.all([
                  CartProductRelationship.create(
                    {
                      cart_id: cart.id,
                      product_id: item.productId,
                      quantity: item.quantity,
                      profile_id:
                        !item.sizeManFlag && typeof item.size === "number"
                          ? item.size
                          : null,
                    },
                    { transaction: t }
                  ),

                  ...promoPromisesForMobile,
                ]).then((results) => {
                  // var selectionArray = [];
                  var cartProduct = results[0];
                  var productPromotionToday = results[1];
                  var productPromotionLatest = results[2];
                  var productPromotionFromCategory = results[3];
                  var product = results[4];
                  // //console.log(productPromotionToday.PromotionProductRelations);
                  // var promotionDiscountToday = product.Promotions.find(item => item.type === 'general') ? product.Promotions.find(item => item.type === 'general').promotion_product_relationship.discount_value : d
                  var promotionDiscount =
                    productPromotionToday &&
                    productPromotionToday.PromotionProductRelations[0]
                      ? productPromotionToday.PromotionProductRelations[0]
                          .discount_value
                      : productPromotionLatest &&
                        productPromotionLatest.PromotionProductRelations[0]
                      ? productPromotionLatest.PromotionProductRelations[0]
                          .discount_value
                      : productPromotionFromCategory &&
                        productPromotionFromCategory.Category.Promotion
                      ? productPromotionFromCategory.Category.Promotion.discount
                      : null;

                  var promotionProductPrice = promotionDiscount
                    ? parseFloat(
                        product.price * (1 - promotionDiscount / 100)
                      ).toFixed(2)
                    : null;
                  var fabricSelectionArray = [];
                  var yakaSelectionArray = [];
                  var zarzourSelectionArray = [];
                  var akmamSelectionArray = [];
                  var othersSelectionArray = [];

                  if (item.selectedIds) {
                    item.selectedIds.forEach((selectionId) => {
                      let cat = allCategoryRelations.find((x) => {
                        x.id == selectionId;
                      });
                      switch (cat) {
                        case "fabric":
                          fabricSelectionArray.push(selectionId);
                          break;
                        case "yaka":
                          yakaSelectionArray.push(selectionId);
                          break;
                        case "betana":
                          yakaSelectionArray.push(selectionId);
                          break;
                        case "zarzour":
                          zarzourSelectionArray.push(selectionId);
                          break;
                        case "akmam":
                          akmamSelectionArray.push(selectionId);
                          break;
                        default:
                          othersSelectionArray.push(selectionId);
                          break;
                      }
                    });
                  }

                  if (item.fabrics) {
                    fabricSelectionArray = [...item.fabrics];
                  }
                  if (item.yaka) {
                    yakaSelectionArray = [...item.yaka];
                  }
                  if (item.zarzour) {
                    zarzourSelectionArray = [...item.zarzour];
                  }
                  if (item.akmam) {
                    akmamSelectionArray = [...item.akmam];
                  }
                  if (item.others) {
                    othersSelectionArray = [...item.others];
                  }
                  if (item.selectedColorId) {
                    fabricSelectionArray.push(item.selectedColorId);
                  }
                  if (item.fabric_custom) {
                    fabricSelectionArray.push(...item.fabric_custom);
                  }
                  if (item.yaka_custom) {
                    yakaSelectionArray.push(...item.yaka_custom);
                  }
                  if (item.zarzour_custom) {
                    zarzourSelectionArray.push(...item.zarzour_custom);
                  }
                  if (item.akmam_custom) {
                    akmamSelectionArray.push(...item.akmam_custom);
                  }
                  if (item.others_custom) {
                    othersSelectionArray.push(...item.others_custom);
                  }
                  var fabricSelectionArrayToCreate = [];
                  fabricSelectionArray.map((i) =>
                    fabricSelectionArrayToCreate.push({
                      type: "fabric",
                      category_rel_id: i,
                      cart_prod_id: cartProduct.id,
                    })
                  );
                  // //console.log("fabricSelectionArrayToCreate");

                  // //console.log(fabricSelectionArrayToCreate);

                  var setCustomizedFabric = models.CartCustomizeRelationship.bulkCreate(
                    fabricSelectionArrayToCreate,
                    { transaction: t }
                  );
                  var yakaSelectionArrayToCreate = [];
                  yakaSelectionArray.map((i) =>
                    yakaSelectionArrayToCreate.push({
                      type: "yaka",
                      category_rel_id: i,
                      cart_prod_id: cartProduct.id,
                    })
                  );

                  var setCustomizedYaka = models.CartCustomizeRelationship.bulkCreate(
                    yakaSelectionArrayToCreate,
                    { transaction: t }
                  );

                  var zarzourSelectionArrayToCreate = [];
                  zarzourSelectionArray.map((i) =>
                    zarzourSelectionArrayToCreate.push({
                      type: "zarzour",
                      category_rel_id: i,
                      cart_prod_id: cartProduct.id,
                    })
                  );

                  var setCustomizedZarzour = models.CartCustomizeRelationship.bulkCreate(
                    zarzourSelectionArrayToCreate,
                    { transaction: t }
                  );

                  var akmamSelectionArrayToCreate = [];
                  akmamSelectionArray.map((i) =>
                    akmamSelectionArrayToCreate.push({
                      type: "akmam",
                      category_rel_id: i,
                      cart_prod_id: cartProduct.id,
                    })
                  );

                  var setCustomizedAkmam = models.CartCustomizeRelationship.bulkCreate(
                    akmamSelectionArrayToCreate,
                    { transaction: t }
                  );

                  var othersSelectionArrayToCreate = [];
                  othersSelectionArray.map((i) =>
                    othersSelectionArrayToCreate.push({
                      type: "others",
                      category_rel_id: i,
                      cart_prod_id: cartProduct.id,
                    })
                  );

                  var setCustomizedOthers = models.CartCustomizeRelationship.bulkCreate(
                    othersSelectionArrayToCreate,
                    { transaction: t }
                  );

                  var setSize =
                    typeof item.size == "string"
                      ? cartProduct.createMeta(
                          { property: "size", value: item.size },
                          { transaction: t }
                        )
                      : item.sizeManFlag
                      ? cartProduct.createMeta(
                          { property: "sizeMan", value: "true" },
                          { transaction: t }
                        )
                      : null;
                  var setShoesSize = item.shoesSize
                    ? cartProduct.createMeta(
                        { property: "shoesSize", value: item.shoesSize },
                        { transaction: t }
                      )
                    : null;
                  var addPriceCustom =
                    item.customized && item.price
                      ? cartProduct.createMeta(
                          { property: "price", value: `${item.price}` },
                          { transaction: t }
                        )
                      : null;
                  var addPricePromo =
                    req.body.isMobile && promotionProductPrice
                      ? cartProduct.createMeta(
                          {
                            property: "pricePromo",
                            value: `${promotionProductPrice}`,
                          },
                          { transaction: t }
                        )
                      : null;
                  var setNote = item.note
                    ? cartProduct
                        .createMeta(
                          { property: "note", value: item.note.content },
                          { transaction: t }
                        )
                        .then((meta) => {
                          var imageArr = [];
                          item.note.images.map((image) => {
                            imageArr.push({
                              src: image,
                              cart_meta_id: meta.id,
                            });
                          });
                          return models.CartMetaImage.bulkCreate(imageArr, {
                            transaction: t,
                          });
                        })
                    : null;

                  return Promise.all([
                    setCustomizedFabric,
                    setCustomizedYaka,
                    setCustomizedZarzour,
                    setCustomizedAkmam,
                    setCustomizedOthers,
                    setSize,
                    setShoesSize,
                    setNote,
                    addPriceCustom,
                    addPricePromo,
                  ]);
                  // });
                });
                promises.push(newPromise);
              });
              var addPartnerCodeToCart = partnerCode
                ? cart.setCode(partnerCode, { transaction: t })
                : null;
              return Promise.all([...promises, addPartnerCodeToCart]);
            })
            .then((result) => {
              res.status(200).json({
                status: true,
              });
            })
            .catch((err) => {
              //console.log("errrrrrrrrrrrrrrror");

              //console.log(err);

              res.status(401).json({
                status: false,
                message:
                  req.body.language === 1
                    ? "Error in adding to cart"
                    : "خطأ في الاضافة للعربة",
              });
            });
        })
        .catch((err) => {
          //console.log("errrrrrrrrrrrrrrror");
          //console.log(err);

          res.status(401).json({
            status: false,
            message:
              req.body.language === 1
                ? "Error in adding to cart"
                : "خطأ في الاضافة للعربة",
          });
        });
    } else {
      return res.status(200).json({
        status: false,
        message:
          req.body.language === 1
            ? "Please add product list"
            : "برجاء إضافة المنتجات",
      });
    }
  }
);

// for kholoud
// router.post(
//   "/item-edits",
//   passport.authenticate("jwt", { session: false }),
//   (req, res) => {
//     CartProductRelationship.findOne({
//       where: {
//         id: req.body.productId
//       },
//       include: [
//         {
//           association: "Product",
//           include: [
//             { association: "Metas" },
//             {
//               model: models.CategoryRelationship,
//               as: "CategoryRelations",
//               include: [
//                 {
//                   model: models.Category,
//                   as: "Children",
//                   include: [{ model: models.CategoryMeta, as: "Metas" }]
//                 },
//                 {
//                   model: models.Category,
//                   as: "Parents",
//                   include: [{ model: models.CategoryMeta, as: "Metas" }]
//                 },
//                 {
//                   model: models.ProductCategoryRelationship,
//                   as: "ProductCategoryRelations",
//                   include: [
//                     {
//                       model: models.ProductCategoryRelationshipImage,
//                       as: "Image"
//                     }
//                   ]
//                 }
//               ]
//             },
//             {
//               model: models.Category,
//               as: "Category",
//               include: [
//                 { model: models.CategoryMeta, as: "Metas" },
//                 {
//                   model: models.Category,
//                   as: "Parents",
//                   include: [{ model: models.CategoryMeta, as: "Metas" }]
//                 }
//               ]
//             }
//           ]
//         },
//         { association: "CategoryRelations" },
//         { association: "Metas" }
//       ]
//     })
//       .then(cartProductRel => {
//         if (cartProductRel) {
//           var product = cartProductRel.Product;
//           let titleKey = req.body.language == 1 ? "title_en" : "title";
//           let nameKey = req.body.language == 1 ? "name_en" : "name";
//           var relationMetaObject = {};
//           cartProductRel.Metas.forEach(meta => {
//             relationMetaObject[meta.property] = meta.value;
//           });
//           var colors = [];
//           var customs = {};
//           var groups = [];
//           product.CategoryRelations.map(relation => {
//             var img;
//             if (relation.type === "fabric") {
//               relation.Children.Metas.map(meta =>
//                 meta.type == "image"
//                   ? (img = meta.category_meta_relationship.value)
//                   : null
//               );
//               colors.push({
//                 id: relation.id,
//                 name: relation.Children[nameKey],
//                 // productImg: relation.ProductCategoryRelations.Image.image,
//                 img: img
//               });
//             } else if (relation.type === "accessory" || "betana") {
//               customs[relation.Parents.name_en]
//                 ? customs[relation.Parents.name_en].push({
//                     id: relation.id,
//                     Children: relation.Children,
//                     Parents: relation.Parents,
//                     default: relation.ProductCategoryRelations.default
//                   })
//                 : (customs[relation.Parents.name_en] = [
//                     {
//                       id: relation.id,
//                       Children: relation.Children,
//                       Parents: relation.Parents,
//                       default: relation.ProductCategoryRelations.default
//                     }
//                   ]);
//             }
//           });
//           Object.keys(customs).forEach(customGroup => {
//             groups.push(customs[customGroup]);
//           });

//           res.status(200).json({
//             status: true,
//             colors: colors,
//             // custoz: product.CategoryRelations,
//             price: `${
//               product.Metas.filter(meta => meta.type === "customized").length >=
//                 1 && relationMetaObject.price
//                 ? relationMetaObject.price
//                 : relationMetaObject.pricePromo ? relationMetaObject.pricePromo : product.price
//             }`,
//             customs: groups.map(group => {
//               return {
//                 title:
//                   req.body.language == 1
//                     ? group[0].Parents[titleKey] + " " + "shape"
//                     : "شكل" + " " + group[0].Parents[titleKey],
//                 images: group.map(item => {
//                   var metaObject = {};
//                   item.Children.Metas.forEach(meta => {
//                     metaObject[meta.type] =
//                       meta.category_meta_relationship.value;
//                   });
//                   return {
//                     id: item.id,
//                     name: item.Children[nameKey],
//                     imgPath: metaObject.image
//                     // default: item.default
//                   };
//                 })
//               };
//             }),
//             selectedIds: cartProductRel.CategoryRelations.filter(
//               rel => rel.type === "accessory" || rel.type === "betana"
//             ).map(rel => rel.id),
//             selectedColorId: cartProductRel.CategoryRelations.filter(
//               rel => rel.type === "fabric"
//             ).map(rel => rel.id)[0]
//           });
//         } else {
//           return res.status(200).json({
//             status: false,
//             message: "your cart no longer has this product"
//           });
//         }
//       })
//       .catch(err => {
//         //console.log(err);
//         res.status(401).json({
//           status: false,
//           message:
//             req.body.language === 1
//               ? "Error in loading item edits"
//               : "خطأ في تحميل تعديلات المنتج"
//         });
//       });
//   }
// );

//  for kholoud, OPTIMIZED!!!

router.post(
  "/item-edits",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Promise.all([
      CartProductRelationship.findOne({
        where: {
          id: req.body.productId,
        },
        include: [
          {
            association: "Product",
            include: [
              { association: "Metas" },

              {
                model: models.Category,
                as: "Category",
                include: [
                  { model: models.CategoryMeta, as: "Metas" },
                  {
                    model: models.Category,
                    as: "Parents",
                    include: [{ model: models.CategoryMeta, as: "Metas" }],
                  },
                ],
              },
            ],
          },
          { association: "CategoryRelations" },
          { association: "Metas" },
        ],
      }),
      models.Category.findAll({ where: { available: true } }),
      // ,
      // models.CartCustomizeRelationship.findAll({
      //   where: {
      //     cart_prod_id: req.body.productId
      //   }
      // })
    ])

      .then((results) => {
        const cartProductRel = results[0];
        const allAvailableCategories = results[1];
        // const cartCustomizes = results[1];
        if (cartProductRel) {
          var product = cartProductRel.Product;
          let titleKey = req.body.language == 1 ? "title_en" : "title";
          let nameKey = req.body.language == 1 ? "name_en" : "name";
          var relationMetaObject = {};
          cartProductRel.Metas.forEach((meta) => {
            relationMetaObject[meta.property] = meta.value;
          });
          var colors = [];
          var customs = {};
          var groups = [];
          models.ProductCategoryRelationship.findAll({
            where: {
              product_id: product.id,
            },
            include: [
              {
                model: models.ProductCategoryRelationshipImage,
                as: "Image",
              },
            ],
          })
            .then((productCats) => {
              models.CategoryRelationship.findAll({
                where: {
                  id: {
                    [Op.in]: productCats.map((i) => i.category_rel_id),
                  },
                },
                include: [
                  {
                    model: models.Category,
                    as: "Children",
                    include: [{ model: models.CategoryMeta, as: "Metas" }],
                  },
                  {
                    model: models.Category,
                    as: "Parents",
                    include: [{ model: models.CategoryMeta, as: "Metas" }],
                  },
                  {
                    model: models.ProductCategoryRelationship,
                    as: "ProductCategoryRelations",
                    include: [
                      {
                        model: models.ProductCategoryRelationshipImage,
                        as: "Image",
                      },
                    ],
                  },
                ],
              })
                .then((CategoryRelations) => {
                  // product.CategoryRelations.map(relation => {

                  CategoryRelations.map((relation) => {
                    var img;
                    const productCatRelation = relation.ProductCategoryRelations.find(
                      (rel) => rel.product_id === product.id
                    );
                    if (relation.type === "fabric") {
                      relation.Children.Metas.map((meta) =>
                        meta.type == "image"
                          ? (img = meta.category_meta_relationship.value)
                          : null
                      );
                      if (
                        allAvailableCategories.find((categoryIterator) => {
                          return categoryIterator.id == relation.child_id;
                        }) &&
                        allAvailableCategories.find((categoryIterator) => {
                          return categoryIterator.id == relation.parent_id;
                        })
                      ) {
                        colors.push({
                          id: relation.id,
                          name: relation.Children[nameKey],
                          // productImg: relation.ProductCategoryRelations.Image.image,
                          // default: relation.ProductCategoryRelations.default,
                          default: productCatRelation.default,
                          img: img,
                        });
                      }
                    } else if (relation.type === "accessory" || "betana") {
                      customs[relation.Parents.name_en]
                        ? customs[relation.Parents.name_en].push({
                            id: relation.id,
                            Children: relation.Children,
                            Parents: relation.Parents,
                            // default: relation.ProductCategoryRelations.default
                            default: productCatRelation.default,
                          })
                        : (customs[relation.Parents.name_en] = [
                            {
                              id: relation.id,
                              Children: relation.Children,
                              Parents: relation.Parents,
                              // default: relation.ProductCategoryRelations.default
                              default: productCatRelation.default,
                            },
                          ]);
                    }
                  });
                  Object.keys(customs).forEach((customGroup) => {
                    // groups.push(customs[customGroup]);
                    let defaultExistis = false;
                    customs[customGroup].forEach((cg) => {
                      if (cg.default == true) defaultExistis = true;
                    });
                    if (!defaultExistis && customs[customGroup].length > 0) {
                      customs[customGroup][0].default = true;
                    }
                    groups.push(customs[customGroup]);
                  });

                  res.status(200).json({
                    stockType: product.Category.Metas.find((xxi) => {
                      return xxi.type == "stock_type";
                    })
                      ? product.Category.Metas.find((xxi) => {
                          return xxi.type == "stock_type";
                        }).category_meta_relationship.value
                      : product.Category.Parents[0].Metas.find((xxi) => {
                          return xxi.type == "stock_type";
                        })
                      ? product.Category.Parents[0].Metas.find((xxi) => {
                          return xxi.type == "stock_type";
                        }).category_meta_relationship.value
                      : "unknown",
                    status: true,
                    price: `${
                      product.Metas.filter((meta) => meta.type === "customized")
                        .length >= 1 && relationMetaObject.price
                        ? relationMetaObject.price
                        : relationMetaObject.pricePromo
                        ? relationMetaObject.pricePromo
                        : product.price
                    }`,
                    colors: colors,
                    customs: groups.map((group) => {
                      return {
                        title:
                          req.body.language == 1
                            ? group[0].Parents[titleKey] + " " + "shape"
                            : "شكل" + " " + group[0].Parents[titleKey],
                        images: group
                          .filter((groupIterator) => {
                            return (
                              allAvailableCategories.find(
                                (categoryIterator) => {
                                  return (
                                    categoryIterator.id ==
                                    groupIterator.Children.id
                                  );
                                }
                              ) &&
                              allAvailableCategories.find(
                                (categoryIterator) => {
                                  return (
                                    categoryIterator.id ==
                                    groupIterator.Parents.id
                                  );
                                }
                              )
                            );
                          })
                          .map((item) => {
                            var metaObject = {};
                            item.Children.Metas.forEach((meta) => {
                              metaObject[meta.type] =
                                meta.category_meta_relationship.value;
                            });
                            return {
                              id: item.id,
                              name: item.Children[nameKey],
                              imgPath: metaObject.image,
                              default: item.default,
                            };
                          }),
                      };
                    }),
                    selectedIds: cartProductRel.CategoryRelations.filter(
                      (rel) => rel.type === "accessory" || rel.type === "betana"
                    ).map((rel) => rel.id),
                    selectedColorId: cartProductRel.CategoryRelations.filter(
                      (rel) => rel.type === "fabric"
                    ).map((rel) => rel.id)[0],
                  });
                })
                .catch((err) => {
                  //console.log(err);
                  res.status(200).json({
                    status: false,
                    message: "error in loading item-edits",
                  });
                });
            })
            .catch((err) => {
              //console.log(err);
              res.status(200).json({
                status: false,
                message: "error in loading item-edits",
              });
            });
        } else {
          return res.status(200).json({
            status: false,
            message: "your cart no longer has this product",
          });
        }
      })
      .catch((err) => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message:
            req.body.language === 1
              ? "Error in loading item edits"
              : "خطأ في تحميل تعديلات المنتج",
        });
      });
  }
);

// for aya optimized

router.post(
  "/item-edits-customized",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Promise.all([
      CartProductRelationship.findOne({
        where: {
          id: req.body.productId,
        },
        include: [
          {
            association: "Product",
            include: [
              {
                model: models.Category,
                as: "Category",
                include: [
                  { model: models.CategoryMeta, as: "Metas" },
                  {
                    model: models.Category,
                    as: "Parents",
                    include: [{ model: models.CategoryMeta, as: "Metas" }],
                  },
                ],
              },
              { association: "Metas" },
            ],
          },
          // { association: "CategoryRelations" },
          { association: "Metas", include: [{ association: "Images" }] },
          { association: "Profile" },
        ],
      }),
      models.CartCustomizeRelationship.findAll({
        where: {
          cart_prod_id: req.body.productId,
        },
      }),
    ])

      .then((results) => {
        const cartProductRel = results[0];
        const cartCustomizes = results[1];
        if (cartProductRel) {
          // var cartcustomizeyaka = cartProductRel.CategoryRelations.map(i => i.cart_customize_relationship.type)
          //console.log("//////////");
          // //console.log(cartcustomizeyaka)
          //console.log("//////");
          //console.log(cartCustomizes.map(i => i.type));
          var product = cartProductRel.Product;
          let titleKey = req.body.language == 1 ? "title_en" : "title";
          let nameKey = req.body.language == 1 ? "name_en" : "name";
          var relationMetaObject = {};
          cartProductRel.Metas.forEach((meta) => {
            relationMetaObject[meta.property] = meta.value;
            relationMetaObject[`${meta.property}_images`] = meta.Images;
          });

          var colors = [];
          var customs = {};
          var groups = [];
          models.ProductCategoryRelationship.findAll({
            where: {
              product_id: product.id,
            },
            include: [
              {
                model: models.ProductCategoryRelationshipImage,
                as: "Image",
              },
            ],
          })
            .then((productCats) => {
              models.CategoryRelationship.findAll({
                where: {
                  id: {
                    [Op.in]: productCats.map((i) => i.category_rel_id),
                  },
                },
                include: [
                  {
                    model: models.Category,
                    as: "Children",
                    include: [{ model: models.CategoryMeta, as: "Metas" }],
                  },
                  {
                    model: models.Category,
                    as: "Parents",
                    include: [{ model: models.CategoryMeta, as: "Metas" }],
                  },
                  {
                    model: models.ProductCategoryRelationship,
                    as: "ProductCategoryRelations",
                    include: [
                      {
                        model: models.ProductCategoryRelationshipImage,
                        as: "Image",
                      },
                    ],
                  },
                ],
              })
                .then((CategoryRelations) => {
                  CategoryRelations.map((relation) => {
                    var img;
                    if (relation.type === "fabric") {
                      relation.Children.Metas.map((meta) =>
                        meta.type == "image"
                          ? (img = meta.category_meta_relationship.value)
                          : null
                      );
                      colors.push({
                        id: relation.id,
                        name: relation.Children[nameKey],
                        // productImg: relation.ProductCategoryRelations.Image.image,
                        img: img,
                      });
                    } else if (relation.type === "accessory" || "betana") {
                      customs[relation.Parents.name_en]
                        ? customs[relation.Parents.name_en].push({
                            id: relation.id,
                            Children: relation.Children,
                            Parents: relation.Parents,
                            default: relation.ProductCategoryRelations.default,
                          })
                        : (customs[relation.Parents.name_en] = [
                            {
                              id: relation.id,
                              Children: relation.Children,
                              Parents: relation.Parents,
                              default:
                                relation.ProductCategoryRelations.default,
                            },
                          ]);
                    }
                  });
                  Object.keys(customs).forEach((customGroup) => {
                    groups.push(customs[customGroup]);
                  });

                  res.status(200).json({
                    status: true,
                    colors: colors,
                    quantity: cartProductRel.quantity,
                    size: relationMetaObject.size
                      ? relationMetaObject.size
                      : cartProductRel.Profile
                      ? {
                          id: cartProductRel.Profile.id,
                          name: cartProductRel.Profile.name,
                        }
                      : null,
                    price: product.price,
                    customs: groups.map((group) => {
                      return {
                        title:
                          req.body.language == 1
                            ? group[0].Parents[titleKey] + " " + "shape"
                            : "شكل" + " " + group[0].Parents[titleKey],
                        images: group.map((item) => {
                          var metaObject = {};
                          item.Children.Metas.forEach((meta) => {
                            metaObject[meta.type] =
                              meta.category_meta_relationship.value;
                          });
                          return {
                            id: item.id,
                            name: item.Children[nameKey],
                            imgPath: metaObject.image,
                            // default: item.default
                          };
                        }),
                      };
                    }),
                    // rel.cart_customize_relationship && rel.cart_customize_relationship.type == 'fabric' &&
                    fabric_custom: cartCustomizes
                      .filter(
                        (rel) =>
                          // (rel.type === "accessory" || rel.type === "betana") &&
                          rel.type == "fabric"
                      )
                      .map((i) => i.category_rel_id),
                    yaka_custom: cartCustomizes
                      .filter(
                        (rel) =>
                          // (rel.type === "accessory" || rel.type === "betana") &&
                          rel.type == "yaka"
                      )
                      .map((i) => i.category_rel_id),
                    zarzour_custom: cartCustomizes
                      .filter(
                        (rel) =>
                          // (rel.type === "accessory" || rel.type === "betana") &&
                          rel.type == "zarzour"
                      )
                      .map((i) => i.category_rel_id),
                    akmam_custom: cartCustomizes
                      .filter(
                        (rel) =>
                          // (rel.type === "accessory" || rel.type === "betana") &&
                          rel.type == "akmam"
                      )
                      .map((i) => i.category_rel_id),
                    others_custom: cartCustomizes
                      .filter(
                        (rel) =>
                          // (rel.type === "accessory" || rel.type === "betana") &&
                          rel.type == "others"
                      )
                      .map((i) => i.category_rel_id),
                    note:
                      relationMetaObject.note || relationMetaObject.note === ""
                        ? {
                            content: relationMetaObject.note,
                            images: relationMetaObject.note_images
                              ? relationMetaObject.note_images.map(
                                  (img) => img.src
                                )
                              : [],
                          }
                        : undefined,

                    // selectedIds:  cartProductRel.CategoryRelations.filter(rel => rel.type === 'accessory'|| rel.type === 'betana' ).map(rel => rel.id),

                    // selectedColorId: cartProductRel.CategoryRelations.filter(
                    //   rel => rel.type === "fabric"
                    // ).map(rel => rel.id)[0]
                  });
                })
                .catch((err) => {
                  //console.log(err);
                  res.status(200).json({
                    status: false,
                    message: "error in loading item-edits",
                  });
                });
            })
            .catch((err) => {
              //console.log(err);
              res.status(200).json({
                status: false,
                message: "error in loading item-edits",
              });
            });
        } else {
          return res.status(200).json({
            req: req.body,
            status: false,
            message: "your cart no longer has this product",
          });
        }
      })
      .catch((err) => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message:
            req.body.language === 1
              ? "Error in loading item edits"
              : "خطأ في تحميل تعديلات المنتج",
        });
      });
  }
);

// for aya
// router.post(
//   "/item-edits-customized",
//   passport.authenticate("jwt", { session: false }),
//   (req, res) => {
//     CartProductRelationship.findOne({
//       where: {
//         id: req.body.productId
//       },
//       include: [
//         {
//           association: "Product",
//           include: [
//             {
//               model: models.CategoryRelationship,
//               as: "CategoryRelations",
//               include: [
//                 {
//                   model: models.Category,
//                   as: "Children",
//                   include: [{ model: models.CategoryMeta, as: "Metas" }]
//                 },
//                 {
//                   model: models.Category,
//                   as: "Parents",
//                   include: [{ model: models.CategoryMeta, as: "Metas" }]
//                 },
//                 {
//                   model: models.ProductCategoryRelationship,
//                   as: "ProductCategoryRelations",
//                   include: [
//                     {
//                       model: models.ProductCategoryRelationshipImage,
//                       as: "Image"
//                     }
//                   ]
//                 }
//               ]
//             },
//             {
//               model: models.Category,
//               as: "Category",
//               include: [
//                 { model: models.CategoryMeta, as: "Metas" },
//                 {
//                   model: models.Category,
//                   as: "Parents",
//                   include: [{ model: models.CategoryMeta, as: "Metas" }]
//                 }
//               ]
//             },
//             { association: "Metas" }
//           ]
//         },
//         { association: "CategoryRelations" },
//         { association: "Metas" }
//       ]
//     })
//       .then(cartProductRel => {
//         if (cartProductRel) {
//           var product = cartProductRel.Product;
//           let titleKey = req.body.language == 1 ? "title_en" : "title";
//           let nameKey = req.body.language == 1 ? "name_en" : "name";
//           var relationMetaObject = {};
//           cartProductRel.Metas.forEach(meta => {
//             relationMetaObject[meta.property] = meta.value;
//           });

//           var colors = [];
//           var customs = {};
//           var groups = [];
//           product.CategoryRelations.map(relation => {
//             var img;
//             if (relation.type === "fabric") {
//               relation.Children.Metas.map(meta =>
//                 meta.type == "image"
//                   ? (img = meta.category_meta_relationship.value)
//                   : null
//               );
//               colors.push({
//                 id: relation.id,
//                 name: relation.Children[nameKey],
//                 // productImg: relation.ProductCategoryRelations.Image.image,
//                 img: img
//               });
//             } else if (relation.type === "accessory" || "betana") {
//               customs[relation.Parents.name_en]
//                 ? customs[relation.Parents.name_en].push({
//                     id: relation.id,
//                     Children: relation.Children,
//                     Parents: relation.Parents,
//                     default: relation.ProductCategoryRelations.default
//                   })
//                 : (customs[relation.Parents.name_en] = [
//                     {
//                       id: relation.id,
//                       Children: relation.Children,
//                       Parents: relation.Parents,
//                       default: relation.ProductCategoryRelations.default
//                     }
//                   ]);
//             }
//           });
//           Object.keys(customs).forEach(customGroup => {
//             groups.push(customs[customGroup]);
//           });

//           res.status(200).json({
//             status: true,
//             colors: colors,
//             price: `${
//               product.Metas.filter(meta => meta.type === "customized").length >=
//                 1 && relationMetaObject.price
//                 ? relationMetaObject.price
//                 : relationMetaObject.pricePromo
//                 ? relationMetaObject.pricePromo
//                 : product.price
//             }`,
//             customs: groups.map(group => {
//               return {
//                 title:
//                   req.body.language == 1
//                     ? group[0].Parents[titleKey] + " " + "shape"
//                     : "شكل" + " " + group[0].Parents[titleKey],
//                 images: group.map(item => {
//                   var metaObject = {};
//                   item.Children.Metas.forEach(meta => {
//                     metaObject[meta.type] =
//                       meta.category_meta_relationship.value;
//                   });
//                   return {
//                     id: item.id,
//                     name: item.Children[nameKey],
//                     imgPath: metaObject.image
//                     // default: item.default
//                   };
//                 })
//               };
//             }),
//             // rel.cart_customize_relationship && rel.cart_customize_relationship.type == 'fabric' &&
//             fabric_custom: cartProductRel.CategoryRelations.filter(
//               rel =>
//                 // (rel.type === "accessory" || rel.type === "betana") &&
//                 rel.cart_customize_relationship.type == "fabric"
//             ).map(i => i.id),
//             yaka_custom: cartProductRel.CategoryRelations.filter(
//               rel =>
//                 // (rel.type === "accessory" || rel.type === "betana") &&
//                 rel.cart_customize_relationship.type == "yaka"
//             ).map(i => i.id),
//             zarzour_custom: cartProductRel.CategoryRelations.filter(
//               rel =>
//                 // (rel.type === "accessory" || rel.type === "betana") &&
//                 rel.cart_customize_relationship.type == "zarzour"
//             ).map(i => i.id),
//             akmam_custom: cartProductRel.CategoryRelations.filter(
//               rel =>
//                 // (rel.type === "accessory" || rel.type === "betana") &&
//                 rel.cart_customize_relationship.type == "akmam"
//             ).map(i => i.id),
//             others_custom: cartProductRel.CategoryRelations.filter(
//               rel =>
//                 // (rel.type === "accessory" || rel.type === "betana") &&
//                 rel.cart_customize_relationship.type == "others"
//             ).map(i => i.id),

//             // selectedIds:  cartProductRel.CategoryRelations.filter(rel => rel.type === 'accessory'|| rel.type === 'betana' ).map(rel => rel.id),
//             selectedColorId: cartProductRel.CategoryRelations.filter(
//               rel => rel.type === "fabric"
//             ).map(rel => rel.id)[0]
//           });
//         } else {
//           return res.status(200).json({
//             req: req.body,
//             status: false,
//             message: "your cart no longer has this product"
//           });
//         }
//       })
//       .catch(err => {
//         //console.log(err);
//         res.status(401).json({
//           status: false,
//           message:
//             req.body.language === 1
//               ? "Error in loading item edits"
//               : "خطأ في تحميل تعديلات المنتج"
//         });
//       });
//   }
// );

router.post(
  "/checkout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var titleKey = req.body.language === 1 ? "title_en" : "title";

    var cartFetch = Cart.findOne({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          association: "User",
          include: [
            { association: "Place", include: [{ association: "Country" }] },
          ],
        },
        { association: "Code", include: [{ association: "Partner" }] },
      ],
    });
    var generalOptionFetch = models.GeneralOption.findAll({
      where: {
        key: {
          [Op.or]: [
            "delivery_price",
            "man_price",
            "delivery_days_from",
            "delivery_days_to",
          ],
        },
      },
    });
    var branchQuery = models.Branch.findAll();
    var bankQuery = models.Bank.findAll();
    Promise.all([cartFetch, generalOptionFetch, branchQuery, bankQuery])
      .then((responses) => {
        var cart = responses[0];
        var generalOptionsList = responses[1];
        var branch = responses[2][0];
        var banks = responses[3];
        var deliveryCost =
          cart.User.Place && cart.User.Place.delivery_price
            ? cart.User.Place && cart.User.Place.delivery_price
            : cart.User.Place && cart.User.Place.Country.delivery_price
            ? cart.User.Place.Country.delivery_price
            : generalOptionsList.find((opt) => opt.key === "delivery_price")
                .value;
        // var deliveryCost = cart.User.Place.delivery_price  ? cart.User.Place.delivery_price :  cart.User.Place.Country.delivery_price;
        var partnerDiscount = cart.Code ? cart.Code.Partner.discount : 0;
        var userDiscount = req.user.discount || 0;

        partnerDiscount > userDiscount
          ? (userDiscount = 0)
          : (partnerDiscount = 0);

        var productsCost = 0.0;
        CartProductRelationship.findAll({
          where: {
            cart_id: cart.id,
          },
          include: [{ association: "Product" }, { association: "Metas" }],
        }).then((cartProductRelations) => {
          // //console.log(cartProductRelations)
          var sizeManFlag = false;
          cartProductRelations.length > 0
            ? cartProductRelations.map((cartProduct) => {
                var product = cartProduct.Product;

                var relationMetaObject = {};
                cartProduct.Metas.forEach((meta) => {
                  relationMetaObject[meta.property] = meta.value;
                });
                if (
                  relationMetaObject.sizeMan &&
                  relationMetaObject.sizeMan == "true"
                ) {
                  sizeManFlag = true;
                }
                // var discount = Math.round(((product.price - product.price_discount) / product.price) * 100);
                // var metaObject = {};
                // product.Category.Metas.forEach(meta => {
                //   metaObject[meta.type] =
                //     meta.category_meta_relationship.value;
                // });
                // var sizeManCost = cart.User.Place.man_price ? parseFloat(cart.User.Place.man_price) : cart.User.Place.Country.man_price ? parseFloat(cart.User.Place.Country.man_price) : parseFloat(metaObject['size_man']);

                // var productPrice = product.price_discount || product.price;
                var productPrice = relationMetaObject.price
                  ? relationMetaObject.price
                  : relationMetaObject.pricePromo
                  ? relationMetaObject.pricePromo
                  : product.price_discount
                  ? product.price_discount
                  : product.price;

                productsCost += parseFloat(productPrice) * cartProduct.quantity;
                // cartItemsNo += cartProduct.quantity;

                // cost += sizeManCost;
              })
            : 0;
          var from = parseInt(
            generalOptionsList.find((opt) => opt.key === "delivery_days_from")
              .value
          );
          var to = parseInt(
            generalOptionsList.find((opt) => opt.key === "delivery_days_to")
              .value
          );
          // //console.log(from, to)
          // var sizeMan = cart.User.Place.man_price ? cart.User.Place.man_price : cart.User.Place.Country.man_price

          var sizeMan = !sizeManFlag
            ? 0
            : cart.User.Place && cart.User.Place.man_price
            ? cart.User.Place.man_price
            : cart.User.Place && cart.User.Place.Country.man_price
            ? cart.User.Place.Country.man_price
            : generalOptionsList.find((opt) => opt.key === "man_price").value;
          res.status(200).json({
            delivery:
              req.body.language === 1
                ? `From ${moment()
                    .add(from, "days")
                    .format("LL")} to ${moment().add(to, "days").format("LL")}`
                : `من ${moment()
                    .add(from, "days")
                    .locale("ar")
                    .format("LL")} إلى ${moment()
                    .add(to, "days")
                    .locale("ar")
                    .format("LL")}`,
            address: req.user.address,
            userDiscount: userDiscount + "%",
            partnerDiscount: partnerDiscount + "%",
            sizeManFlag: sizeManFlag,
            branch: branch
              ? {
                  name: req.body.language == 1 ? branch.name_en : branch.name,
                  address:
                    req.body.language == 1 ? branch.address_en : branch.address,
                  workHours:
                    req.body.language == 1 ? branch.hours_en : branch.hours,
                  number: branch.number,
                }
              : {},

            orderSummary: {
              total: productsCost,
              expectedTotal:
                productsCost !== 0
                  ? (
                      productsCost *
                        (1 - (userDiscount + partnerDiscount) / 100) +
                      parseInt(deliveryCost) +
                      parseInt(sizeMan)
                    ).toFixed(2)
                  : 0,
              delivery: deliveryCost,
              sizeMan: sizeMan,
              // sizeMan: sizeManFlag ? sizeMan : "0"
            },
            bankTransfer: banks.map((bank) => {
              return {
                bankName: req.body.language === 1 ? bank.name_en : bank.name,
                bankNo: bank.number,
              };
            }),
            status: true,
          });
        });
      })
      .catch((err) => {
        //console.log(err);
        res.status(400).json({
          status: false,
        });
      });
  }
);

module.exports = router;
