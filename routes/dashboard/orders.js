const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender");
const passport = require("passport");
const models = require("../../models");
const Sequelize = require("sequelize");
const { updateOrder } = require("../../controller/orderNotificationController");
const { sendMessage } = require("../../controller/smsController");
const { sendMail } = require("../../controller/mailController");
const moment = require("moment");
const Op = Sequelize.Op;
const {
  Order,
  OrderProductRelationship,
  MeasurementProfile,
  OrderProductMeta,
} = models;

router.post(
  "/getAllOrders-2",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    let userQuery = [];
    if (req.body.email || req.body.mobile) {
      let internalWhereObj = {};

      if (req.body.email != null && req.body.mobile != null) {
        internalWhereObj = {
          [Op.or]: [
            { email: { [Op.like]: `%${req.body.email}%` } },
            { mobile: { [Op.like]: `%${req.body.mobile}%` } },
          ],
        };
      } else if (req.body.email != null) {
        internalWhereObj = { email: { [Op.like]: `%${req.body.email}%` } };
      } else if (req.body.mobile != null) {
        internalWhereObj = { mobile: { [Op.like]: `%${req.body.mobile}%` } };
      }

      userQuery.push(models.User.findOne({ where: internalWhereObj }));
    }
    Promise.all(userQuery)
      .then((results) => {
        let userDetails = results[0];
        if (!req.body.pageSize || !req.body.pageIndex) {
          return res.status(200).json({
            status: false,
            message: "please add pageIndex and pageSize",
          });
        }
        const limit = req.body.pageSize;
        const index = req.body.pageIndex;
        const offset = limit * (index - 1);
        let whereObj = [];
        userDetails
          ? whereObj.push({ user_id: userDetails.id })
          : req.body.email || req.body.mobile
          ? whereObj.push({ user_id: "NO_USER_FOUND" })
          : null;
        req.body.status ? whereObj.push({ status: req.body.status }) : null;
        req.body.id
          ? whereObj.push({ id: { [Op.like]: "%" + req.body.id + "%" } })
          : null;
        Order.findAll({
          order: [["ordering_date", "DESC"]],
          where: {
            [Op.and]: [...whereObj],
          },
          limit,
          offset,
        }).then((orders) => {
            res.status(200).json({
              status: true,
              orders: orders,
            });
          })
          .catch((err) => {
            //console.log(err)
            res.status(200).json({
              status: false,
            });
          });
      })
      .catch((err) => {
        //console.log(err)
        res.status(200).json({
          status: false,
        });
      });

    // return ResponseSender.sendSuccess(res, "All Orders retrieved successfully")
  }
);

router.post(
  "/getAllOrders",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.pageSize || !req.body.pageIndex) {
      return res.status(200).json({
        status: false,
        message: "please add pageIndex and pageSize",
      });
    }
    const limit = req.body.pageSize;
    const index = req.body.pageIndex;
    const offset = limit * (index - 1);
    Order.findAll({
      order: [["ordering_date", "DESC"]],
      where: {
        user_id: req.body.userId,
      },
      limit,
      offset,
    })
      .then((orders) => {
        res.status(200).json({
          status: true,
          orders: orders,
        });
      })
      .catch((err) => {
        //console.log(err)
        res.status(200).json({
          status: false,
        });
      });
    // return ResponseSender.sendSuccess(res, "All Orders retrieved successfully")
  }
);

router.post(
  "/deleteOrder",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (req.body.id)
      Order.destroy({ where: { id: req.body.id } })
        .then((deletionResult) => {
          return ResponseSender.sendSuccess(
            res,
            "Order Deleted successfully",
            "status",
            deletionResult
          );
        })
        .catch((error) => {
          //console.log(error);
          return ResponseSender.sendDBError(res, "Database Error", error);
        });
    else
      return ResponseSender.sendInvalidRequest(
        res,
        "invalid, order id not specified",
        "invalid, order id not specified"
      );
  }
);

router.put(
  "/update-order-status",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.orderId) {
      return res.status(200).json({
        status: false,
        message: "please enter orderId",
      });
    }
    if (!req.body.orderStatus) {
      return res.status(200).json({
        status: false,
        message: "please enter orderStatus",
      });
    }
    Order.findOne({
      where: {
        id: req.body.orderId,
      },
      include: [
        { association: "User", include: [{ association: "Metas" }] },
        {
          association: "OrderProductRelationships",
          include: [
            { association: "Product" }
          ],
        },
      ],
    })
      .then((order) => {
        // update order
        updateOrder(order, req.body.orderStatus, res);
        // get order status in arabic
        let orderStatus = order.status == "pending_payment" ? `فى إنتظار الدفع ` :
        order.status == "production" ? `فى مرحلة الإنتاج` :
        order.status == "charged" ? ` تم شحن الطلب  ` :
        order.status == "delivered" ? ` تم تسليم الطلب ` :
        order.status == "pickable" ? ` تم تجهيز الطلب ` :
        order.status == "cancelled" ? ` تم إلغاء الطلب ` :
         ` فى إنتظار التأكيد ` ;
         //get order discounts
        let discounts = '';
        if(order.partner_discount && order.partner_discount != 0){
          discounts += `<h4 style="text-align:right"> خصم شركاء : ${order.partner_discount}</h4>`;
        }
        if(order.user_discount && order.user_discount != 0){
          discounts += `<h4 style="text-align:right"> خصم عميل : ${order.user_discount}</h4>`;
        }
        if(order.coupon_discount && order.coupon_discount != 0){
          discounts += `<h4 style="text-align:right"> خصم كوبون : ${order.coupon_discount}</h4>`;
        }
        if(order.delivery_cost && order.delivery_cost != 0){
          discounts += `<h4 style="text-align:right"> رسوم توصيل : ${order.delivery_cost}</h4>`;
        }
        if(order.quantity_discount && order.quantity_discount != 0){
          discounts += `<h4 style="text-align:right"> رسوم توصيل : ${order.quantity_discount}</h4>`;
        }
        // get order details
        let products = `<h3 style="padding:8px;border:1px solid #fdfdfd;border-radius:8px;text-align:center;background:#ddd;margin:10px">بيانات الطلب</h3>`+
        `<div style="display:flex;justify-content: space-between;direction: rtl;padding: 20px;">`+
        `<div style="width:50%"><h3 style="text-align:right"> رقم الطلب : ${order.id}</h3><h4 style="text-align:right"> تاريخ الطلب : ${moment(order.ordering_date).locale("ar").format("LL")} </h4><h4 style="text-align:right"> حالة الطلب : ${orderStatus} </h4></div>`+
        `<div style="width:50%">`+ discounts +`<h4 style="text-align:right"> إجمالى الطلب : ${order.expected_total}</h4></div>`+
        `</div>`;
        // add order products
        products += `<h3 style="padding:8px;border:1px solid #fdfdfd;border-radius:8px;text-align:center;background:#ddd;margin:10px;margin-bottom:0px">بيانات المنتجات</h3>`;
        order.OrderProductRelationships.forEach((orderProductRel) => {
          const product = orderProductRel.Product;
          const {quantity, cost } = orderProductRel;
          products += `<div style="display:flex;direction: rtl;padding: 10px;"><img src="${product.image}" width="120px;" style="border:1px solid #ddd;border-radius: 10px; margin: 10px;"><div><h3>${product.title}</h3><p> الكميه : ${quantity}</p><p> السعر :${cost}</p></div></div>`;
        });
        // the message which will be send to the client
        let message = `<h4 style="text-align:right">عميلنا الراقي!</h4>`;
        if(order.status == "pending_payment"){
          message += `<p style="text-align:right">لتأكيد طلبك نرجو تحويل المبلغ على رقم الحساب :3105000068201316372000 </p>`;
        }else if(order.status == "production"){
          message += `<p style="text-align:right">طلبك رقم ${order.id} قيد التنفيذ.
          شكراً وشرفتنا .
          </p>`;
        }else if(order.status == "charged"){
          message += `<p style="text-align:right">طلبك رقم ${order.id} جاهز وسيتم شحنه في أقرب وقت .
          شكراً وشرفتنا .
          </p>`;
        }else if(order.status == "delivered"){
          message += `<p style="text-align:right"> طلبك وصل وتم تسليمه .
          ملبوس العافية ، شكراً لذوقك وبانتظارك المرة الجاية
          </p>`;
        }else if(order.status == "pickable"){
          message += `<p style="text-align:right">عميلنا الراقي! 
          نبشرك انتهينا من تحضير طلبك رقم ${order.id} . 
          بإمكانك استلامه من معرضنا الآن .
          </p>`;
        }else if(order.status == "cancelled"){
          message += `<p style="text-align:right">خسارة تم إلغاء طلبك ، شكراً لك ونشوفك مرة ثانية .</p>`;
        }else{
          message += `<p style="text-align:right">طلبك رقم ${order.id} بانتظار التأكيد.
          شكراً وشرفتنا .
          </p>`;
        }
        message += `<p style="text-align:right"> للتواصل عبر الواتس اب : 966594704888</p>`;
         
        sendMail(order.User.email,"iThoob Order", ` ${order.User.name} مرحبا `,message,"orderStatus",products);
        sendMessage(
          [order.User.mobile],
          message,
          "iThoob",
          "orderStatus"
        );
        console.log('====================================');
         console.log('email message was sent');
         console.log('====================================');
      })
      .catch((err) => {
        console.log(err);
        res.status(200).json({
          status: false,
          message: "error in finding order",
        });
      });
  }
);

router.put(
  "/change-order-delivery",
  passport.authenticate("jwt-admin", {
    session: false,
  }),
  (req, res) => {
    if (!req.body.orderId) {
      return res.status(200).json({
        status: false,
        message: "please add orderId",
      });
    }
    if (!req.body.deliveryMethod) {
      return res.status(200).json({
        status: false,
        message: "please add deliveryMethod",
      });
    }
    if (
      !(
        req.body.deliveryMethod == "home" || req.body.deliveryMethod == "branch"
      )
    ) {
      //console.log(req.body.deliveryMethod != "home")
      //console.log(req.body.deliveryMethod != "branch")

      return res.status(200).json({
        status: false,
        message: "deliveryMethod should be either home or branch",
      });
    }
    Promise.all([
      Order.findOne({
        where: {
          id: req.body.orderId,
        },
        include: [
          {
            association: "User",
          },
        ],
      }),
      models.Place.findAll(),
      models.GeneralOption.findOne({
        where: {
          key: "delivery_price",
        },
      }),
    ])
      .then((results) => {
        const order = results[0];
        const places = results[1];
        const defaultDeliveryPrice = results[2];
        let updateObj = {
          delivery_type: req.body.deliveryMethod,
        };
        if (updateObj.delivery_type == "home") {
          let userCity = places.find((place) => {
            return place.id == order.User.area_id;
          });
          let userCountry = places.find((place) => {
            return place.id == userCity.country_id;
          });
          //console.log("citizzzzzzzzzz")
          //console.log(userCity)
          //console.log("countriezzzzzz")
          //console.log(userCountry)
          updateObj.delivery_cost =
            userCity && userCity.delivery_price
              ? userCity.delivery_price
              : userCountry && userCountry.delivery_price
              ? userCountry.delivery_price
              : defaultDeliveryPrice.value;
          updateObj.delivery_cost = parseInt(updateObj.delivery_cost);
          updateObj.address = order.User.address;
        } else if (updateObj.delivery_type == "branch") {
          updateObj.delivery_cost = 0;
          updateObj.address = null;
        }

        Order.update(updateObj, {
          where: {
            id: req.body.orderId,
          },
        })
          .then(() => {
            res.status(200).json({
              status: true,
              message: "order delivery method changed successfully",
            });
          })
          .catch((err) => {
            //console.log(err);
            res.status(200).json({
              status: false,
              message: "Error in changing delivery type",
            });
          });
      })
      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "Error in changing delivery type",
        });
      });
  }
);

// NOT WORKING
router.post(
  "/order-details",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.orderId) {
      return res.status(200).json({
        status: false,
        message: "please add orderId",
      });
    }
    Promise.all([
      Order.findOne({
        where: {
          id: req.body.orderId,
        },
        include: [
          {association: "delivery_address"},
          {
            association: "OrderProductRelationships",
            include: [
              { association: "Product" },
              { association: "Profile" },
              {
                association: "Metas",
                include: [
                  {
                    association: "quantities",
                    include: [
                      { association: "size" },
                      { association: "fabric" },
                      { association: "shoeColor" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
      models.CategoryRelationship.findAll({
        where: {
          type: "fabric",
        },
        include: [{ association: "Children", where: { type: "color" } }],
      }), // 1
      models.CategoryMetaRelationship.findAll(), //2
      models.Category.findAll({ where: { available: true } }), //3
    ]).then((responses) => {
      let order = responses[0],
        categoryRelationship = responses[1],
        categoryMetaRelationship = responses[2],
        allCategories = responses[3];
      let obj = {size: null, shoeColor: null, color: null, fabric: null};
      res.status(200).json({
        status: true,
        order: {
          id: order.id,
          deliveryMethod: order.delivery_type,
          address: order.address,
          status: order.status,
          delivery_address: order.delivery_address,
          products: order.OrderProductRelationships.map((orderProductRel) => {
            obj = {size: null, shoeColor: null, color: null, fabric: null};
            const product = orderProductRel.Product;
            const { id, quantity, cost, Profile, Metas } = orderProductRel;
            if(Metas && Metas[0] != 'undefined' && Metas.length > 0){

            const stQuantity =  Metas[0].quantities;
            if(stQuantity){
              const {fabric, size, shoeColor} = stQuantity;
              if(size != null){
                obj.size = {name :size.name_en, id: size.id} ;
              }
              if(fabric != null){
                obj.fabric = {name :fabric.name_en, id: fabric.id} ;
              }
              if(shoeColor != null){
                obj.shoeColor = {image :shoeColor.image, id: shoeColor.id, name:shoeColor.name_en} ;
              }
              let sotockcolors = categoryRelationship.filter((colCatRel) => {
                return colCatRel.id == stQuantity.color_id;
              });
              if (sotockcolors && sotockcolors.length > 0) {
                let stocKat = allCategories.filter((cat) => {
                  return cat.id == sotockcolors[0].child_id;
                });
                let colorImg = categoryMetaRelationship.filter((img) => {
                  return img.category_id == stocKat[0].id;
                });
                obj.color = {
                  image: colorImg[0].value,
                  id: sotockcolors[0].id,
                  name: sotockcolors[0].name_en
                };
              }
            }
          }
            
            return {
              orderProductId: id,
              quantity,
              cost,
              title: product.title,
              title_en: product.title_en,
              sku: product.sku,
              image: product.image,
              profile: Profile ? { id: Profile.id, name: Profile.name } : null,
              size: Metas.find((meta) => meta.property === "shoesSize")
                ? Metas.find((meta) => meta.property === "shoesSize").value
                : Metas.find((meta) => meta.property === "sizeMan") &&
                  Metas.find((meta) => meta.property === "sizeMan").value
                ? "Sizeman"
                : Metas.find((meta) => meta.property === "size")
                ? Metas.find((meta) => meta.property === "size").value
                : null,
              stockQuantities: obj
            };
          }),
        },
      });
    });
    // Order.findOne({
    //   where: {
    //     id: req.body.orderId
    //   },
    //   include: [{ association: "OrderProductRelationships", include: [{ association: "Product" }, { association: "Profile"}, { association: "Metas" }] }]
    // }).then(order => {

    // })
  }
);

// working
router.put(
  "/edit-product-measurement",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.orderProductId) {
      return res.status(200).json({
        status: false,
        message: "please add orderProductId",
      });
    }
    if (!req.body.measurement) {
      return res.status(200).json({
        status: false,
        message: "please add measurement",
      });
    }
    OrderProductRelationship.findOne({
      where: {
        id: req.body.orderProductId,
      },
      include: [
        { association: "Product", include: [{ association: "Category" }] },
        { association: "Order" },
      ],
    })
      .then((productRel) => {
        if (!productRel) {
          return res.status(200).json({
            status: false,
            message: "no product in order with this orderProductId",
          });
        }

        /**
         * Unset Measurement Profile Id
         * It's used when changing size in "s/m/l" & "sizeman"
         */
        const unsetMeasurementProfileId = productRel.setProfile(null);

        //console.log(typeof req.body.measurement)
        if (typeof req.body.measurement === "number") {
          return MeasurementProfile.findOne({
            where: {
              id: req.body.measurement,
            },
          }).then((profile) => {
            if (!profile) {
              return res.status(200).json({
                status: false,
                message: "no profile with this id",
              });
            }
            if (profile.user_id !== productRel.Order.user_id) {
              return res.status(200).json({
                status: false,
                message: "order user doesn't have this profile",
              });
            }
            /**
             * Set MeasurementProfileId in "order_product_relationships" table
             * Set "size" to "" in "order_product_meta" - So, when admin changes the sizetype to "Size" or "SizeMan" it won't break
             * (Previously) It was "destroy" the whole row from "order_product_meta"
             */
            const resetSize = models.OrderProductMeta.update(
              { property: "size", value: "" },
              { where: { order_prod_id: productRel.id } }
            );
            const setMeasurementProfileId = productRel.setProfile(profile);

            return Promise.all([setMeasurementProfileId, resetSize]);
          });
        } else if (
          req.body.measurement == "s" ||
          req.body.measurement == "m" ||
          req.body.measurement == "l"
        ) {
          /**
           * Update regular size (s, m, l)
           * Make sure to "unset" measurement profile id
           * It's very important to unset it, as the previous/current change might be Profile Id, we will get 2 sizes (Regular Size & Profile Id)
           */
          const updateSize = models.OrderProductMeta.update(
            { property: "size", value: req.body.measurement },
            { where: { order_prod_id: productRel.id } }
          );

          return Promise.all([updateSize, unsetMeasurementProfileId]);
        } else if (req.body.measurementType == "shoes") {
          return Promise.all([
            models.OrderProductMeta.update(
              { property: "size", value: req.body.measurement },
              {
                where: { order_prod_id: productRel.id },
              }
            ),
            productRel.setProfile(null),
          ]);
        } else if (req.body.measurement == "sizeman") {
          /**
           * Update sizeman property & value
           * Make sure to "unset" measurement profile id
           * It's very important to unset it, as the previous/current change might be Profile Id, we will get 2 sizes (SizeMan & Profile Id)
           */
          const selectSizeman = models.OrderProductMeta.update(
            { property: "sizeMan", value: "true" },
            { where: { order_prod_id: productRel.id } }
          );

          return Promise.all([selectSizeman, unsetMeasurementProfileId]);
        } else {
          const err = new Error("please add right value of measurement");
          throw err;
        }
      })
      .then(() => {
        res.status(200).json({
          status: true,
          message: "product in order measurement updated successfully",
        });
      })
      .catch((err) => {
        //console.log(err)
        res.status(200).json({
          status: false,
          message: "error in updating product order measurement",
        });
      });
  }
);

router.post(
  "/order-item-edits",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    // Promise.all([
    OrderProductRelationship.findOne({
      where: {
        id: req.body.orderProductRelId,
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
        { association: "Profile" },
        {
          model: models.CategoryRelationship,
          as: "CategoryRelations",
          where: {
            [Op.notExists]: Sequelize.literal(
              "NOT EXISTS (SELECT `id` FROM `category_relationships` as x WHERE `x`.`parent_id` = `CategoryRelations`.`child_id`)"
            ),
          },
          include: [
            { association: "Children", include: [{ association: "Metas" }] },
          ],
        },
        { association: "Metas" },
      ],
    })
      //   ,
      //   models.OrderCustomizeRelationship.findAll({
      //     where: {
      //       order_prod_id: req.body.productId
      //     }
      //   })
      // ])
      .then((orderProductRel) => {
        // const orderCustomizes = results[1];
        if (!orderProductRel) {
          return res.status(200).json({
            status: false,
            message:
              req.body.language === 1
                ? "no product with this id"
                : "لا يوجد  منتج  مطابق",
          });
        }
        models.ProductCategoryRelationship.findAll({
          where: {
            product_id: orderProductRel.Product.id,
          },
          include: [
            {
              model: models.ProductCategoryRelationshipImage,
              as: "Image",
            },
          ],
        })
          .then((productCats) => {
            Promise.all([
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
              }),
              models.OrderCustomizeRelationship.findAll({
                where: { order_prod_id: orderProductRel.id },
              }),
              models.CategoryRelationship.findAll({
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
              }),
            ])
              .then((results) => {
                CategoryRelations = results[0];
                allOrderCustomizations = results[1];
                allCategoryRelations = results[2];

                var product = orderProductRel.Product;
                console.log(product);
                let titleKey = req.body.language == 1 ? "title_en" : "title";
                let nameKey = req.body.language == 1 ? "name_en" : "name";
                var relationMetaObject = {};
                orderProductRel.Metas.forEach((meta) => {
                  relationMetaObject[meta.property] = meta.value;
                });
                var colors = [];
                var customs = {};
                var groups = [];
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
                            default: relation.ProductCategoryRelations.default,
                          },
                        ]);
                  }
                });
                Object.keys(customs).forEach((customGroup) => {
                  groups.push(customs[customGroup]);
                });

                var incrementCost = (type) => {
                  var cost = 0;
                  orderProductRel.CategoryRelations.filter(
                    (rel) => rel.order_customize_relationship.type == type
                  ).map((i) => {
                    i.Children.Metas.find((i) => i.type === "cost")
                      ? (cost += parseInt(
                          i.Children.Metas.find((i) => i.type === "cost")
                            .category_meta_relationship.value
                        ))
                      : null;
                  });
                  return cost;
                };
                var fabric_cost = incrementCost("fabric");
                var yaka_cost = incrementCost("yaka");
                var akmam_cost = incrementCost("akmam");
                var zarzour_cost = incrementCost("zarzour");
                var others_cost = incrementCost("others");

                res.status(200).json({
                  status: true,
                  // categoryRelations,
                  price: `${
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length > 0 && relationMetaObject.price
                      ? relationMetaObject.price
                      : product.price
                  }`,
                  colors:
                    !product.Metas.filter((meta) => meta.type === "customized")
                      .length > 0
                      ? colors
                      : undefined,
                  customs:
                    !product.Metas.filter((meta) => meta.type === "customized")
                      .length > 0
                      ? groups.map((group) => {
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
                                cost: metaObject.cost,
                                default: item.default,
                              };
                            }),
                          };
                        })
                      : undefined,

                  fabric_custom: (function () {
                    let resultfabric_custom =
                      product.Metas.filter((meta) => meta.type === "customized")
                        .length >= 1
                        ? allCategoryRelations
                            .filter((rel) => {
                              return allOrderCustomizations.filter((idx) => {
                                return (
                                  idx.cat_rel_id == rel.id &&
                                  idx.type == "fabric"
                                );
                              }).length;
                            })
                            .map((i) => {
                              return {
                                categoryType: i.Children.type,
                                parentId: i.parent_id,
                                id: i.id,
                                name: i.Children[nameKey],
                                image: i.Children.Metas.find(
                                  (i) => i.type === "image"
                                )
                                  ? i.Children.Metas.find(
                                      (i) => i.type === "image"
                                    ).category_meta_relationship.value
                                  : null,
                                cost:
                                  product.Metas.filter(
                                    (meta) => meta.type === "customized"
                                  ).length > 0 &&
                                  i.Children.Metas.find(
                                    (i) => i.type === "cost"
                                  )
                                    ? i.Children.Metas.find(
                                        (i) => i.type === "cost"
                                      ).category_meta_relationship.value
                                    : undefined,
                              };
                            })
                        : undefined;

                    if (resultfabric_custom && resultfabric_custom.length > 2) {
                      let mainFabric = {
                        ...resultfabric_custom.find((i) => {
                          return i.parentId == 1;
                        }),
                      };
                      let childFabric = {
                        ...resultfabric_custom.find((i) => {
                          return i.categoryType == "child" && i.parentId != 1;
                        }),
                      };
                      let colorOfFabric = {
                        ...resultfabric_custom.find((i) => {
                          return i.categoryType == "color";
                        }),
                      };
                      if (
                        mainFabric &&
                        mainFabric.id &&
                        childFabric &&
                        childFabric.id &&
                        colorOfFabric &&
                        colorOfFabric.id
                      ) {
                        resultfabric_custom[0] = { ...mainFabric };
                        resultfabric_custom[1] = { ...childFabric };
                        resultfabric_custom[2] = { ...colorOfFabric };
                      }
                    }
                    return resultfabric_custom;
                  })(),
                  fabric_cost:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? fabric_cost
                      : undefined,
                  yaka_custom:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? allCategoryRelations
                          .filter((rel) => {
                            return allOrderCustomizations.filter((idx) => {
                              return (
                                idx.cat_rel_id == rel.id && idx.type == "yaka"
                              );
                            }).length;
                          })
                          .map((i) => {
                            return {
                              id: i.id,
                              name: i.Children[nameKey],
                              image: i.Children.Metas.find(
                                (i) => i.type === "image"
                              )
                                ? i.Children.Metas.find(
                                    (i) => i.type === "image"
                                  ).category_meta_relationship.value
                                : null,
                              cost:
                                product.Metas.filter(
                                  (meta) => meta.type === "customized"
                                ).length > 0 &&
                                i.Children.Metas.find((i) => i.type === "cost")
                                  ? i.Children.Metas.find(
                                      (i) => i.type === "cost"
                                    ).category_meta_relationship.value
                                  : undefined,
                            };
                          })
                      : undefined,

                  yaka_cost:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? yaka_cost
                      : undefined,
                  zarzour_custom:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? allCategoryRelations
                          .filter((rel) => {
                            return allOrderCustomizations.filter((idx) => {
                              return (
                                idx.cat_rel_id == rel.id &&
                                idx.type == "zarzour"
                              );
                            }).length;
                          })
                          .map((i) => {
                            return {
                              id: i.id,
                              name: i.Children[nameKey],
                              image: i.Children.Metas.find(
                                (i) => i.type === "image"
                              )
                                ? i.Children.Metas.find(
                                    (i) => i.type === "image"
                                  ).category_meta_relationship.value
                                : null,
                              cost:
                                product.Metas.filter(
                                  (meta) => meta.type === "customized"
                                ).length > 0 &&
                                i.Children.Metas.find((i) => i.type === "cost")
                                  ? i.Children.Metas.find(
                                      (i) => i.type === "cost"
                                    ).category_meta_relationship.value
                                  : undefined,
                            };
                          })
                      : undefined,

                  zarzour_cost:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? zarzour_cost
                      : undefined,
                  akmam_custom:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? allCategoryRelations
                          .filter((rel) => {
                            return allOrderCustomizations.filter((idx) => {
                              return (
                                idx.cat_rel_id == rel.id && idx.type == "akmam"
                              );
                            }).length;
                          })
                          .map((i) => {
                            return {
                              id: i.id,
                              name: i.Children[nameKey],
                              image: i.Children.Metas.find(
                                (i) => i.type === "image"
                              )
                                ? i.Children.Metas.find(
                                    (i) => i.type === "image"
                                  ).category_meta_relationship.value
                                : null,
                              cost:
                                product.Metas.filter(
                                  (meta) => meta.type === "customized"
                                ).length > 0 &&
                                i.Children.Metas.find((i) => i.type === "cost")
                                  ? i.Children.Metas.find(
                                      (i) => i.type === "cost"
                                    ).category_meta_relationship.value
                                  : undefined,
                            };
                          })
                      : undefined,

                  akmam_cost:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? akmam_cost
                      : undefined,
                  others_custom:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? allCategoryRelations
                          .filter((rel) => {
                            return allOrderCustomizations.filter((idx) => {
                              return (
                                idx.cat_rel_id == rel.id && idx.type == "others"
                              );
                            }).length;
                          })
                          .map((i) => {
                            return {
                              id: i.id,
                              name: i.Children[nameKey],
                              image: i.Children.Metas.find(
                                (i) => i.type === "image"
                              )
                                ? i.Children.Metas.find(
                                    (i) => i.type === "image"
                                  ).category_meta_relationship.value
                                : null,
                              cost:
                                product.Metas.filter(
                                  (meta) => meta.type === "customized"
                                ).length > 0 &&
                                i.Children.Metas.find((i) => i.type === "cost")
                                  ? i.Children.Metas.find(
                                      (i) => i.type === "cost"
                                    ).category_meta_relationship.value
                                  : undefined,
                            };
                          })
                      : undefined,

                  others_cost:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? others_cost
                      : undefined,
                  selectedIds:
                    !product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? orderProductRel.CategoryRelations.filter(
                          (rel) =>
                            rel.type === "accessory" || rel.type === "betana"
                        ).map((rel) => rel.id)
                      : undefined,
                  selectedColorId:
                    !product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? orderProductRel.CategoryRelations.filter(
                          (rel) => rel.type === "fabric"
                        ).map((rel) => rel.id)[0]
                      : undefined,
                  measurement_custom:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? [
                          {
                            quantity: orderProductRel.quantity,
                          },
                          {
                            size: orderProductRel.Profile
                              ? orderProductRel.Profile.name
                              : relationMetaObject.size
                              ? relationMetaObject.size
                              : null,
                          },
                        ]
                      : undefined,
                });
              })
              .catch((err) => {
                //console.log(err);
                res.status(200).json({
                  status: false,
                  message:
                    req.body.language === 1
                      ? "Error in loading item edits"
                      : "خطأ في تحميل تعديلات المنتج",
                });
              });
          })
          .catch((err) => {
            //console.log(err);
            res.status(200).json({
              status: false,
              message:
                req.body.language === 1
                  ? "Error in loading item edits"
                  : "خطأ في تحميل تعديلات المنتج",
            });
          });

        // }
      })
      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message:
            req.body.language === 1
              ? "Error in loading item edits"
              : "خطأ في تحميل تعديلات المنتج",
        });
      });
  }
);

module.exports = router;
