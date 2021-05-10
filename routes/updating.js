const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");
const models = require("../models");
const sequelize = models.sequelize;
const CartProductRelationship = models.CartProductRelationship;

// the next 3 APIs for kholoud for editing specific things in cart products
router.post(
  "/edit-cart-item",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    CartProductRelationship.findOne({
      where: {
        id: req.body.productId,
      },
      include: [
        // {
        //   association: "Product",
        //   include: [
        //     {
        //       model: models.CategoryRelationship,
        //       as: "CategoryRelations",
        //       include: [
        //         {
        //           model: models.Category,
        //           as: "Children",
        //           include: [{ model: models.CategoryMeta, as: "Metas" }]
        //         },
        //         {
        //           model: models.Category,
        //           as: "Parents",
        //           include: [{ model: models.CategoryMeta, as: "Metas" }]
        //         },
        //         {
        //           model: models.ProductCategoryRelationship,
        //           as: "ProductCategoryRelations",
        //           include: [
        //             {
        //               model: models.ProductCategoryRelationshipImage,
        //               as: "Image"
        //             }
        //           ]
        //         }
        //       ]
        //     },
        //     {
        //       model: models.Category,
        //       as: "Category",
        //       include: [
        //         { model: models.CategoryMeta, as: "Metas" },
        //         {
        //           model: models.Category,
        //           as: "Parents",
        //           include: [{ model: models.CategoryMeta, as: "Metas" }]
        //         }
        //       ]
        //     }
        //   ]
        // },
        { association: "CategoryRelations" },
      ],
    })
      .then((cartProductRel) => {
        models.CategoryRelationship.findAll({
          where: {
            id: {
              [Op.in]: [...req.body.selectedIds],
            },
          },
        })
          .then((categoryrelations) => {
            // cartProductRel.setCategoryRelations(categoryrelations) (Old/Not Working properly Solution)
            // BulkCreate => Insert

            // Delete current customsId
            models.CartCustomizeRelationship.destroy({
              where: {
                cart_prod_id: cartProductRel.id,
              },
            }).then(() => {
              // Create new customs
              models.CartCustomizeRelationship.bulkCreate(
                categoryrelations.map((obj) => {
                  let data = {
                    type: obj.type !== "fabric" ? "others" : obj.type,
                    category_rel_id: obj.id,
                    cart_prod_id: cartProductRel.id,
                  };
                  return data;
                })
              )
                .then(() => {
                  res.status(200).json({
                    status: true,
                    data: [...req.body.selectedIds],
                    fullData: categoryrelations,
                    cartProductRel: cartProductRel,
                  });
                })
                .catch((err) => {
                  console.log(err);
                  res.status(401).json({
                    status: false,
                    message:
                      req.body.language === 1
                        ? "Error in editing cart item"
                        : "خطأ في تعديل مفضلات المنتج",
                  });
                });
            });
          })
          .catch((err) => {
            //console.log(err);
            res.status(401).json({
              status: false,
              message:
                req.body.language === 1
                  ? "Error in editing cart item"
                  : "خطأ في تعديل مفضلات المنتج",
            });
          });
      })
      .catch((err) => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message:
            req.body.language === 1
              ? "Error in editing cart item"
              : "خطأ في تعديل مفضلات المنتج",
        });
      });
  }
);

router.post(
  "/edit-item-quantity",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.body.quantity === 0) {
      return CartProductRelationship.destroy({
        where: {
          id: req.body.productId,
        },
      })
        .then(() => {
          res.status(200).json({
            status: true,
            // message: 'error in editing quantity'
          });
        })
        .catch((err) => {
          //console.log(err);
          res.status(401).json({
            status: false,
            message: "error in deleting quantity",
          });
        });
    }
    CartProductRelationship.update(
      {
        quantity: req.body.quantity,
      },
      {
        where: {
          id: req.body.productId,
        },
      }
    )
      .then(() => {
        res.status(200).json({
          status: true,
          // message: 'error in editing quantity'
        });
      })
      .catch((err) => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message: "error in editing quantity",
        });
      })
      .catch((err) => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message: "error in editing quantity",
        });
      });
  }
);

router.post(
  "/edit-item-measurement",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log('====================================');
    console.log(req.body);
    console.log('====================================');
    CartProductRelationship.findOne({
      where: {
        id: req.body.productId,
      },
      include: [
        {
          association: "Product",
          include: [
            { association: "Category", include: [{ association: "Metas" }] },
          ],
        },
        { association: "Metas" },
      ],
    })
      .then((cartProductRel) => {
        cartProductRel
          .update({ profile_id: null })
          .then((done) => {
            var product = cartProductRel.Product;
            var relationMetaObject = {};
            cartProductRel.Metas.forEach((meta) => {
              relationMetaObject[meta.property] = meta.value;
            });
            var productCatMeta = {};
            product.Category.Metas.map((meta) => {
              productCatMeta[meta.type] = meta.category_meta_relationship.value;
            });
            if(req.body.stockUpdate){
               if (req.body.size) {
                if (productCatMeta.sizeType === "shoes") {
                  // If there's already "sizeMan" value in "cart_product_meta" table. Update it with the new size!
                  if (relationMetaObject.shoesSize) {
                    return models.CartProductMeta.update(
                      {
                        property: "shoesSize",
                        value: req.body.size,
                        quantity_id: req.body.quantity_id,
                      },
                      {
                        where: {
                          cart_prod_id: cartProductRel.id,
                          property: "shoesSize",
                        },
                      }
                    )
                      .then(() => {
                        res.status(200).json({ status: true });
                      })
                      .catch((err) => {
                        //console.log(err);
                        res.status(401).json({ status: false });
                      });
                  } else {
                    /**
                     * If there's no current value. Create new row with "shoesSize" property & its size.
                     * Next time, it will be updated, instead of re-create new entry.
                     */
                    return cartProductRel
                      .createMeta({
                        property: "shoesSize",
                        value: req.body.size,
                        quantity_id: req.body.quantity_id,
                      })
                      .then(() => {
                        res.status(200).json({ status: true });
                      })
                      .catch((err) => {
                        //console.log(err);
                        res.status(401).json({ status: false });
                      });
                  }
                } else if (productCatMeta.sizeType === "accessories") {
                  // If there's already "sizeMan" value in "cart_product_meta" table. Update it with the new size!
                  if (relationMetaObject.accessorySize) {
                    return models.CartProductMeta.update(
                      {
                        property: "accessorySize",
                        value: req.body.size,
                        quantity_id: req.body.quantity_id,
                      },
                      {
                        where: {
                          cart_prod_id: cartProductRel.id,
                          property: "accessorySize",
                        },
                      }
                    )
                      .then(() => {
                        res.status(200).json({ status: true });
                      })
                      .catch((err) => {
                        //console.log(err);
                        res.status(401).json({ status: false });
                      });
                  } else {
                    /**
                     * If there's no current value. Create new row with "shoesSize" property & its size.
                     * Next time, it will be updated, instead of re-create new entry.
                    */
                    return cartProductRel
                      .createMeta({
                        property: "accessorySize",
                        value: req.body.size,
                        quantity_id: req.body.quantity_id,
                      })
                      .then(() => {
                        res.status(200).json({ status: true });
                      })
                      .catch((err) => {
                        //console.log(err);
                        res.status(401).json({ status: false });
                      });
                  }
                }else if(productCatMeta.sizeType === "sizeable"){
                  if (relationMetaObject.sizable) {
                    return models.CartProductMeta.update(
                      {
                        property: "sizeable",
                        value: req.body.size,
                        quantity_id: req.body.quantity_id,
                      },
                      {
                        where: {
                          cart_prod_id: cartProductRel.id,
                          property: "sizeable",
                        },
                      }
                    )
                      .then(() => {
                        res.status(200).json({ status: true });
                      })
                      .catch((err) => {
                        //console.log(err);
                        res.status(401).json({ status: false });
                      });
                  } else {
                    /**
                     * If there's no current value. Create new row with "shoesSize" property & its size.
                     * Next time, it will be updated, instead of re-create new entry.
                     */
                    return cartProductRel
                      .createMeta({
                        property: "sizeable",
                        value: req.body.size,
                        quantity_id: req.body.quantity_id,
                      })
                      .then(() => {
                        res.status(200).json({ status: true });
                      })
                      .catch((err) => {
                        //console.log(err);
                        res.status(401).json({ status: false });
                      });
                  }
                } else {
                  return Promise.all([
                    cartProductRel.update({ profile_id: req.body.size }),
                    models.CartProductMeta.destroy({
                      where: {
                        cart_prod_id: req.body.productId,
                        property: "sizeMan",
                      },
                    }),
                  ])
                    .then(() => {
                      res.status(200).json({ status: true });
                    })
                    .catch((err) => {
                      //console.log(err);
                      res.status(401).json({ status: false });
                    });
                }
              }
            }else if (req.body.sizeManFlag) {
              if (relationMetaObject.size) {
                return models.CartProductMeta.update(
                  {
                    property: "sizeMan",
                    value: "true",
                  },
                  {
                    where: {
                      cart_prod_id: cartProductRel.id,
                      property: "size",
                    },
                  }
                )
                  .then(() => {
                    res.status(200).json({ status: true });
                  })
                  .catch((err) => {
                    //console.log(err);
                    res.status(401).json({ status: false });
                  });
              } else {
                return cartProductRel
                  .createMeta({ property: "sizeMan", value: "true" })
                  .then(() => {
                    res.status(200).json({ status: true });
                  })
                  .catch((err) => {
                    //console.log(err);
                    res.status(401).json({ status: false });
                  });
              }
            } 
            else if (
              req.body.size === "s" ||
              req.body.size === "m" ||
              req.body.size === "l"
            ) {
              if (relationMetaObject.size) {
                return models.CartProductMeta.update(
                  {
                    value: req.body.size,
                  },
                  {
                    where: {
                      cart_prod_id: cartProductRel.id,
                      property: "size",
                    },
                  }
                )
                  .then(() => {
                    res.status(200).json({ status: true });
                  })
                  .catch((err) => {
                    //console.log(err);
                    res.status(401).json({ status: false });
                  });
              } else {
                if (relationMetaObject.sizeMan) {
                  return models.CartProductMeta.update(
                    { property: "size", value: req.body.size },
                    {
                      where: {
                        cart_prod_id: cartProductRel.id,
                        property: "sizeMan",
                      },
                    }
                  )
                    .then(() => {
                      res.status(200).json({ status: true });
                    })
                    .catch((err) => {
                      //console.log(err);
                      res.status(401).json({ status: false });
                    });
                } else {
                  return cartProductRel
                    .createMeta({ property: "size", value: req.body.size })
                    .then(() => {
                      res.status(200).json({ status: true });
                    })
                    .catch((err) => {
                      //console.log(err);
                      res.status(401).json({ status: false });
                    });
                }
              }
            }else if (typeof req.body.size === "number") {
              if (productCatMeta.sizeType === "shoes") {
    
                // If there's already "sizeMan" value in "cart_product_meta" table. Update it with the new size!
                if(relationMetaObject.shoesSize){
                  return models.CartProductMeta.update(
                    { property: "shoesSize", value: req.body.size },
                    {
                      where: {
                        cart_prod_id: cartProductRel.id,
                        property: "shoesSize"
                      }
                    }
                  )
                  .then(() => {
                    res.status(200).json({ status: true });
                  })
                  .catch(err => {
                    //console.log(err);
                    res.status(401).json({ status: false });
                  });
                }
                else{
                  /**
                   * If there's no current value. Create new row with "shoesSize" property & its size. 
                   * Next time, it will be updated, instead of re-create new entry.
                   */
                  return cartProductRel
                  .createMeta({ property: "shoesSize", value: req.body.size })
                  .then(() => {
                    res.status(200).json({ status: true });
                  })
                  .catch(err => {
                    //console.log(err);
                    res.status(401).json({ status: false });
                  });
                }
              } else {
                return Promise.all([
                  cartProductRel
                      .update({profile_id: req.body.size}),
                  models.CartProductMeta
                      .destroy({where: {cart_prod_id: req.body.productId, property: "sizeMan"}})
                ])
                .then(() => {
                  res.status(200).json({ status: true });
                })
                .catch(err => {
                  //console.log(err);
                  res.status(401).json({ status: false });
                });
              }
              
            } else {
              return res.status(401).json({
                status: false,
                message:
                  req.body.language === 1
                    ? "please enter valid inputs"
                    : "برجاء إدخال معطيات صحيحة",
              });
            }
          })
          .catch((err) => {
            //console.log(err);
            res.status(401).json({
              status: false,
              message:
                req.body.language === 1
                  ? "error in editing measurement"
                  : "خطأ في تعديل المقاس",
            });
          })
          .catch((err) => {
            //console.log(err);
            res.status(401).json({
              status: false,
              message:
                req.body.language === 1
                  ? "error in editing measurement"
                  : "خطأ في تعديل المقاس",
            });
          });
      })
      .catch((err) => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message:
            req.body.language === 1
              ? "error in editing measurement"
              : "خطأ في تعديل المقاس",
        });
      });
  }
);

// the next API for aya for editing the whole cart product once
router.post(
  "/edit-item-bulk",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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
              model: models.CategoryRelationship,
              as: "CategoryRelations",
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
            },
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
    })
      .then((cartProductRel) => {
        var product = cartProductRel.Product;
        var relationMetaObject = {};
        cartProductRel.Metas.forEach((meta) => {
          relationMetaObject[meta.property] = meta.value;
        });
        var productCatMeta = {};
        product.Category.Metas.map((meta) => {
          productCatMeta[meta.type] = meta.category_meta_relationship.value;
        });
        sequelize
          .transaction((t) => {
            let updateMeasurement;
            if (req.body.sizeManFlag) {
              if (relationMetaObject.size) {
                updateMeasurement = models.CartProductMeta.update(
                  {
                    value: "sizeMan",
                  },
                  {
                    where: {
                      cart_prod_id: cartProductRel.id,
                      property: "size",
                    },
                  }
                );
              } else {
                updateMeasurement = cartProductRel.createMeta({
                  property: "size",
                  value: "sizeMan",
                });
              }
            } else if (
              req.body.size === "s" ||
              req.body.size === "m" ||
              req.body.size === "l"
            ) {
              console.log("====================================");
              console.log("twooooooooo", req.body);
              console.log("====================================");
              if (relationMetaObject.size) {
                updateMeasurement = models.CartProductMeta.update(
                  {
                    value: req.body.size,
                  },
                  {
                    where: {
                      cart_prod_id: cartProductRel.id,
                      property: "size",
                    },
                  }
                );
              } else {
                updateMeasurement = cartProductRel.createMeta({
                  property: "size",
                  value: req.body.size,
                });
              }
            } else {
              if (productCatMeta.sizeType === "shoes") {
                console.log("====================================");
                console.log("threeeeee", req.body);
                console.log("====================================");
                updateMeasurement = cartProductRel.createMeta({
                  property: "shoesSize",
                  value: req.body.size,
                  quantity_id: req.body.quantity_id,
                });
              } else {
                updateMeasurement = cartProductRel.update({
                  profile_id: req.body.size,
                });
              }
            }
            var fabricSelectionArray = [];
            var yakaSelectionArray = [];
            var zarzourSelectionArray = [];
            var akmamSelectionArray = [];
            var othersSelectionArray = [];

            if (req.body.fabric_custom) {
              //console.log("here in fabric");
              fabricSelectionArray = [...req.body.fabric_custom];
              //console.log(fabricSelectionArray);
            }
            if (req.body.yaka_custom) {
              //console.log("here in yaka");

              yakaSelectionArray = [...req.body.yaka_custom];
              //console.log(yakaSelectionArray);
            }
            if (req.body.zarzour_custom) {
              zarzourSelectionArray = [...req.body.zarzour_custom];
            }
            if (req.body.akmam_custom) {
              akmamSelectionArray = [...req.body.akmam_custom];
            }
            if (req.body.others_custom) {
              othersSelectionArray = [...req.body.others_custom];
            }
            if (req.body.selectedColorId) {
              fabricSelectionArray.push(req.body.selectedColorId);
            }

            var fabricCategory = models.CategoryRelationship.findAll({
              where: {
                id: {
                  [Op.in]: fabricSelectionArray,
                },
              },
            });
            var yakaCategory = models.CategoryRelationship.findAll({
              where: {
                id: {
                  [Op.in]: yakaSelectionArray,
                },
              },
            });
            var zarzourCategory = models.CategoryRelationship.findAll({
              where: {
                id: {
                  [Op.in]: zarzourSelectionArray,
                },
              },
            });
            var akmamCategory = models.CategoryRelationship.findAll({
              where: {
                id: {
                  [Op.in]: akmamSelectionArray,
                },
              },
            });
            var othersCategory = models.CategoryRelationship.findAll({
              where: {
                id: {
                  [Op.in]: othersSelectionArray,
                },
              },
            });
            let destroyOldCutomizations = models.CartCustomizeRelationship.destroy(
              { where: { cart_prod_id: cartProductRel.id }, transaction: t }
            );
            return Promise.all([
              fabricCategory,
              yakaCategory,
              zarzourCategory,
              akmamCategory,
              othersCategory,
              destroyOldCutomizations,
            ]).then((results) => {
              var fabricResult = results[0];
              var yakaResult = results[1];
              var zarzourResult = results[2];
              var akmamResult = results[3];
              var othersResult = results[4];
              // var editItem = cartProductRel.setCategoryRelations(categoryrelations);
              //console.log("fabricResult");
              //console.log(fabricResult);
              //console.log("yakaResult");
              //console.log(yakaResult);
              let customsArr = [];
              fabricSelectionArray.forEach((i) => {
                customsArr.push({
                  type: "fabric",
                  category_rel_id: i,
                  cart_prod_id: cartProductRel.id,
                });
              });
              yakaSelectionArray.forEach((i) => {
                customsArr.push({
                  type: "yaka",
                  category_rel_id: i,
                  cart_prod_id: cartProductRel.id,
                });
              });
              zarzourSelectionArray.forEach((i) => {
                customsArr.push({
                  type: "zarzour",
                  category_rel_id: i,
                  cart_prod_id: cartProductRel.id,
                });
              });
              akmamSelectionArray.forEach((i) => {
                customsArr.push({
                  type: "akmam",
                  category_rel_id: i,
                  cart_prod_id: cartProductRel.id,
                });
              });
              othersSelectionArray.forEach((i) => {
                customsArr.push({
                  type: "others",
                  category_rel_id: i,
                  cart_prod_id: cartProductRel.id,
                });
              });

              let bulkCreate = models.CartCustomizeRelationship.bulkCreate(
                customsArr,
                { transaction: t }
              );
              // var editItemFabric = cartProductRel
              //   .setCategoryRelations(fabricResult, { transaction: t })
              //   .then(result => {
              //     //console.log("Results");
              //     //console.log(result);
              //     models.CartCustomizeRelationship.update(
              //       {
              //         type: "fabric"
              //       },
              //       {
              //         where: {
              //           id: {
              //             [Op.in]: result[1]
              //               ? result[1].map(item => item.dataValues.id)
              //               : []
              //           }
              //         },
              //         transaction: t
              //       },
              //     );
              //   });
              // var editItemYaka = cartProductRel
              //   .setCategoryRelations(yakaResult, { transaction: t })
              //   .then(result => {
              //     //console.log("yaka");
              //     //console.log(result);
              //     models.CartCustomizeRelationship.update(
              //       {
              //         type: "yaka"
              //       },
              //       {
              //         where: {
              //           id: {
              //             [Op.in]: result[1]
              //               ? result[1].map(item => item.dataValues.id)
              //               : []
              //           }
              //         }, transaction: t
              //       },
              //     );
              //   });
              // var editItemZarzour = cartProductRel
              //   .setCategoryRelations(zarzourResult, { transaction: t })
              //   .then(result => {
              //     models.CartCustomizeRelationship.update(
              //       {
              //         type: "zarzour"
              //       },
              //       {
              //         where: {
              //           id: {
              //             [Op.in]: result[1]
              //               ? result[1].map(item => item.dataValues.id)
              //               : []
              //           }
              //         }
              //       },
              //       { transaction: t }
              //     );
              //   });
              // var editItemAkmam = cartProductRel
              //   .setCategoryRelations(akmamResult, { transaction: t })
              //   .then(result => {
              //     models.CartCustomizeRelationship.update(
              //       {
              //         type: "akmam"
              //       },
              //       {
              //         where: {
              //           id: {
              //             [Op.in]: result[1]
              //               ? result[1].map(item => item.dataValues.id)
              //               : []
              //           }
              //         }, transaction: t
              //       },
              //     );
              //   });
              // var editItemOthers = cartProductRel
              //   .setCategoryRelations(othersResult, { transaction: t })
              //   .then(result => {
              //     models.CartCustomizeRelationship.update(
              //       {
              //         type: "others"
              //       },
              //       {
              //         where: {
              //           id: {
              //             [Op.in]: result[1]
              //               ? result[1].map(item => item.dataValues.id)
              //               : []
              //           }
              //         }
              //         , transaction: t,
              //       }
              //     );
              //   });

              var updateQuantity = req.body.quantity
                ? cartProductRel.update(
                    { quantity: req.body.quantity },
                    { transaction: t }
                  )
                : null;
              var updatePrice =
                req.body.fullCost &&
                product.Metas.filter((meta) => meta.type === "customized")
                  .length >= 1
                  ? models.CartProductMeta.update(
                      { property: "price", value: req.body.fullCost },
                      {
                        where: {
                          property: "price",
                          cart_prod_id: cartProductRel.id,
                        },
                        transaction: t,
                      }
                    )
                  : null;
              return Promise.all([
                // editItemFabric,
                // editItemYaka,
                // editItemAkmam,
                // editItemZarzour,
                // editItemOthers,
                updateQuantity,
                updateMeasurement,
                bulkCreate,
                updatePrice,
              ]);
            });
          })
          .then(() => {
            res.status(200).json({
              status: true,
            });
          })
          .catch((err) => {
            //console.log(err);
            res.status(401).json({
              status: false,
              message:
                req.body.language === 1
                  ? "Error in editing cart item"
                  : "خطأ في تعديل مفضلات المنتج",
            });
          });
      })
      .catch((err) => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message:
            req.body.language === 1
              ? "Error in editing cart item"
              : "خطأ في تعديل مفضلات المنتج",
        });
      });
  }
);

module.exports = router;
