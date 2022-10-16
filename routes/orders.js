const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const passport = require("passport");

const models = require("../models");
const moment = require("moment");
const Cart = models.Cart;
const GeneralCoupon = models.GeneralCoupon;

const {
  Order,
  OrderProductRelationship,
  sequelize,
  CategoryMetaRelationship,
  CategoryMeta,
} = models;
const {
  calculateThoob,
  calculateThoobSmall,
  calculateThoobMedium,
  calculateThoobLarge,
} = require("../controller/stockController");
const { sendMessage } = require("../controller/smsController");
const arabicNumbers = ["۰", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const {
  sendPaymentURL,
  requestTabbyPaymentURL,
} = require("../controller/paymentController");
const { sendMail } = require("../controller/mailController");
const { TailorRequest, DeliveryAddress, User } = require("../models");
const axios = require("axios");
const {
  sendNotificationToAdmin,
} = require("../controller/adminOrderNotification");

const convertToArabic = (number) => {
  return String(number)
    .split("")
    .map((char) => (char === "." ? "." : arabicNumbers[Number(char)]))
    .join("");
};

function makeOrderId(length) {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let charactersLength = characters.length;
  let timeNow = Date.now();
  for (let i = 0; i < length; i++) {
    result +=
      characters[Math.floor((timeNow * Math.random()) % charactersLength)];
  }
  return result;
}

router.post("/tabby_response", (req, res) => {
  console.log("====================================");
  console.log(req.body);
  console.log("====================================");
  axios
    .get(`https://api.tabby.ai/api/v1/payments/${req.body.query}`, {
      headers: {
        authorization: "Bearer sk_test_5438c016-9d45-4e5e-a90b-48d79664bf55",
        "content-type": "application/json",
      },
    })
    .then((response) => {
      console.log("====================================");
      console.log(response.data);
      console.log("====================================");
      if (response.data.status && response.data.status == "CLOSED") {
        Order.findOne({
          where: {
            id: parseInt(response.data.order.reference_id),
          },
        }).then(async (order) => {
          await makeOrderAfterPayment(order);
          models.Order.update(
            {
              status: "new",
              payment_id: response.data.id ? response.data.id : null,
            },
            { where: { id: parseInt(response.data.order.reference_id) } }
          ).then((resp) => {
            res.status(200).json({
              status: true,
              message: "Payment Successed",
              orderNo: parseInt(response.data.order.reference_id),
            });
          });
        });
      } else {
        Order.destroy({
          where: {
            id: parseInt(response.data.order.reference_id),
          },
        }).then((response) => {
          res.status(200).json({
            status: false,
            message: "Payment Failed",
          });
        });
      }
    });
});

router.post("/payment_response", (req, res) => {
  console.log("====================================");
  console.log(req.body);
  console.log("====================================");
  axios
    .get(`https://api.tap.company/v2/charges/${req.body.query}`, {
      headers: {
        authorization: "Bearer sk_live_jqHxSVkXG2IgT5Yhwb4QZuyC",
        "content-type": "application/json",
      },
    })
    .then((response) => {
      console.log("====================================");
      console.log(response.data);
      console.log("====================================");
      if (response.data.status && response.data.status == "CAPTURED") {
        Order.findOne({
          where: {
            id: parseInt(response.data.reference.order),
          },
        }).then(async (order) => {
          await makeOrderAfterPayment(order);
          models.Order.update(
            {
              status: "new",
              payment_id: response.data.id ? response.data.id : null,
            },
            { where: { id: response.data.reference.order } }
          ).then((resp) => {
            res.status(200).json({
              status: true,
              message: "Payment Successed",
              orderNo: parseInt(response.data.reference.order),
            });
          });
        });
        
      } else {
        Order.destroy({
          where: {
            id: parseInt(response.data.order.reference_id),
          },
        }).then((response) => {
          res.status(200).json({
            status: false,
            message: "Payment Failed",
          });
        });
      }
    });
});

router.post(
  "/request_tailor",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    TailorRequest.create({
      user_id: req.user.id,
      ...req.body,
    })
      .then(async (response) => {
        await sendNotificationToAdmin("Tailor Request Order", "tailor-orders");
        User.findOne({where: {id : response.user_id}}).then(async sender => {
          await sendMessage([966594704888],
            `
            ${sender.name} : الأسم
             ${sender.mobile} : رقم الجوال  
            ${response.region} : المنطقة`,
            "iThoob",
            "orderStatus"
          );
          return res.status(200).json({
            status: true,
            orderNo: response.id,
            message: "The Tailor Request Has Been Sent Successfully",
          });
        })
      })
      .catch((err) => {
        console.log(err);
        return res.status(200).json({
          status: false,
          message: "Somthing Went Wrong",
        });
      });
  }
);

router.post("/tailor_order_update", (req, res) => {
  console.log("====================================");
  console.log(req.body);
  console.log("====================================");
  TailorRequest.update(
    { status: req.body.status },
    { where: { id: req.body.id } }
  )
    .then((response) => {
      return res.status(200).json({
        status: true,
        message: "Order Updated Successfully",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        status: false,
        message: "Somthing Went Wrong",
      });
    });
});

router.post("/tailor_expenses_update", (req, res) => {
  const key1 = models.GeneralOption.update(
    { value: req.body.tailor_extra_expenses },
    { where: { key: 'tailor_extra_expenses' } }
  )
  const key2 = models.GeneralOption.update(
    { value: req.body.man_price },
    { where: { key: 'man_price' } }
  )
  Promise.all([key1, key2])
    .then((responses) => {
      return res.status(200).json({
        status: true,
        message: "Expenses Updated Successfully",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        status: false,
        message: "Somthing Went Wrong",
      });
    });
});

router.get("/tailor_orders", (req, res) => {
  const generalOptionFetch = models.GeneralOption.findAll({where: {key: {[Op.or]: ['tailor_extra_expenses','man_price']}}})

  const orders = TailorRequest.findAll({
    include: [
      {
        association: "User",
        include: [
          { association: "Place", include: [{ association: "Country" }] },
        ],
      },
    ],
  })

  Promise.all([generalOptionFetch, orders])
    .then((responses) => {
      return res.status(200).json({
        status: true,
        orders: responses[1],
        tailor_expenses: responses[0].find(
          (opt) => opt.key === "man_price"
        ).value,
        tailor_extra_expenses: responses[0].find(
          (opt) => opt.key === "tailor_extra_expenses"
        ).value,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(200).json({
        status: false,
        message: "Somthing Went Wrong",
      });
    });
});

function makeOrderAfterPayment(order) {
  Cart.findOne({
    where: {
      user_id: order.user_id,
    },
    include: [
      { association: "Code", include: [{ association: "Partner" }] },
      {
        association: "CartProductRelationships",
        include: [
          {
            association: "Product",
            include: [
              {
                association: "Metas",
              },
              { association: "Stock" },
              // { association: "Fabric" }
              { model: models.CategoryRelationship, as: "CategoryRelations" },
              // { association: "CategoryRelations", where:{default:1} },
              {
                association: "Category",
                include: [{ association: "Parents" }],
              },
            ],
          },
          { association: "Metas" },
          { association: "CategoryRelations" },
          { association: "Profile" },
        ],
      },
      {
        association: "User",
        include: [
          { association: "Place", include: [{ association: "Country" }] },
        ],
      },
    ],
  }).then((cart) => {
    var promises = [];
    let total = 0;

    cart.CartProductRelationships.map((item) => {
      var relationMetaObject = {};
      var product = item.Product;
      item.Metas.forEach((meta) => {
        relationMetaObject[meta.property] = meta.value;
        relationMetaObject["quantity_id"] = meta.quantity_id;
      });
      var cost = relationMetaObject.price
        ? relationMetaObject.price
        : relationMetaObject.pricePromo
        ? relationMetaObject.pricePromo
        : item.Product.price_discount
        ? item.Product.price_discount
        : item.Product.price;

      total += cost * item.quantity;
      var orderProductRelInstance = {
        quantity: item.quantity,
        order_id: order.id,
        cost: cost,
        product_id: item.product_id,
        profile_id: item.profile_id,
      };
      if (relationMetaObject.quantity_id) {
        models.Quantity.findOne({
          where: { id: relationMetaObject.quantity_id },
        }).then((quantity) => {
          quantity.update({
            quantity: quantity.quantity - item.quantity,
          });
        });
      }

      const relationsForProductMainCat = {};

      product.Category &&
      product.Category.Parents &&
      product.Category.Parents[0] &&
      product.Category.Parents[0].Metas
        ? product.Category.Parents[0].Metas.map((meta) => {
            relationsForProductCat[meta.type] =
              meta.category_meta_relationship.value;
          })
        : null;
      //console.log('old cat',product.Category.id)
      var fabricCatId = "";
      //console.log('cart',item.CategoryRelations)
      product.CategoryRelations.map((cat) => {
        if (cat.product_category_relationship.default && cat.type == "color") {
          // this is the product default color
          // //console.log('cat.child_id',cat.child_id)
          fabricCatId = cat.child_id;
        }
        // //console.log('item',cat.child_id,cat.id,cat.product_category_relationship,cat.product_category_relationship.default)
      });
      item.CategoryRelations.map((cat) => {
        if (
          cat.cart_customize_relationship &&
          cat.cart_customize_relationship.type == "fabric"
        ) {
          // user add custom color in cart
          fabricCatId = cat.child_id;
        }
        // //console.log('item',cat.child_id,cat.id,cat.cart_customize_relationship)
      });
      const maxQuantityMeta = CategoryMeta.findOne({
        where: {
          type: "max_quantity",
        },
      }).then((meta) => {
        return CategoryMetaRelationship.findOne({
          where: {
            category_id: fabricCatId,
            category_meta_id: meta.id,
          },
        }).then((categoryMeta) => {
          // //console.log('max categoryMeta',categoryMeta)
          return categoryMeta;
        });
      });
      const fabricTypeMeta = CategoryMeta.findOne({
        where: {
          type: "fabric_type",
        },
      }).then((meta) => {
        if (!meta) {
          return null;
        }
        return CategoryMetaRelationship.findOne({
          where: {
            category_id: fabricCatId,
            category_meta_id: meta.id,
          },
        }).then((categoryMeta) => {
          return categoryMeta;
        });
      });
      // maxQuantityMeta &&
      // relationsForProductMainCat &&
      // relationsForProductMainCat.stock_type &&
      // relationsForProductMainCat.stock_type === "fabric" &&
      // item.Profile
      // mnaguib stock fixed for size s without review to controll
      // remain review small decrement value is correct, then large and medium, then profile, then stock for normal product
      const deductFromStock = item.Product.Stock
        ? item.Product.Stock.decrement({
            value: item.quantity,
          })
        : maxQuantityMeta && fabricCatId != "" && item.Profile
        ? maxQuantityMeta.then((result) =>
            fabricTypeMeta.then((val) => {
              return result && result.decrement
                ? result.decrement({
                    value: calculateThoob(
                      item.Profile.value_1,
                      item.Profile.value_2,
                      item.Profile.value_3,
                      item.Profile.value_4,
                      item.Profile.value_5,
                      item.Profile.value_6,
                      item.Profile.value_7,
                      item.Profile.value_8,
                      item.Profile.value_9,
                      item.Profile.value_10,
                      item.Profile.value_11,
                      item.Profile.value_12,
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : val && val.decrement
                ? val.decrement({
                    value: calculateThoob(
                      item.Profile.value_1,
                      item.Profile.value_2,
                      item.Profile.value_3,
                      item.Profile.value_4,
                      item.Profile.value_5,
                      item.Profile.value_6,
                      item.Profile.value_7,
                      item.Profile.value_8,
                      item.Profile.value_9,
                      item.Profile.value_10,
                      item.Profile.value_11,
                      item.Profile.value_12,
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : null;
            })
          )
        : maxQuantityMeta &&
          fabricCatId != "" &&
          relationMetaObject.size &&
          relationMetaObject.size === "s"
        ? maxQuantityMeta.then((result) => {
            return fabricTypeMeta.then((val) => {
              // //console.log('qty',fabricTypeMeta);
              // fabricTypeMeta.then(val=>//console.log('val',val && val.value ? val.value : "normal"));
              return result && result.decrement
                ? result.decrement({
                    value: calculateThoobSmall(
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : val && val.decrement
                ? val.decrement({
                    value: calculateThoobSmall(
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : null;
            });
          })
        : maxQuantityMeta &&
          fabricCatId != "" &&
          relationMetaObject.size &&
          relationMetaObject.size === "m"
        ? maxQuantityMeta.then((result) =>
            fabricTypeMeta.then((val) => {
              return result && result.decrement
                ? result.decrement({
                    value: calculateThoobMedium(
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : val && val.decrement
                ? val.decrement({
                    value: calculateThoobMedium(
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : null;
            })
          )
        : maxQuantityMeta &&
          fabricCatId != "" &&
          relationMetaObject.size &&
          relationMetaObject.size === "l"
        ? maxQuantityMeta.then((result) =>
            fabricTypeMeta.then((val) => {
              return result && result.decrement
                ? result.decrement({
                    value: calculateThoobLarge(
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : val && val.decrement
                ? val.decrement({
                    value: calculateThoobLarge(
                      val && val.value ? val.value : "normal",
                      item.quantity
                    ),
                  })
                : null;
            })
          )
        : // : product.Stock.decrement(
          //     { value: item.quantity },
          //     { transaction: t }
          //   );
          null;

      promises.push(deductFromStock);
    });
    var destroyingCart = models.CartProductRelationship.destroy({
      where: { cart_id: cart.id },
    });

    let orderMessage = sendMessage(
      [cart.User.mobile],
      `عميلنا الراقي !
        طلبك رقم ${order.id} قيد التنفيذ.
        شكراً وشرفتنا .
         للتواصل عبر الواتس اب : 966594704888
        `,
      "iThoob",
      "orderStatus"
    );

    let orderEmail = sendMail(
      cart.User.email,
      "iThoob Order",
      `مرحبا ${cart.User.name}`,
      `<h4 style="text-align:right">يا هلا و مرحبا</h4><p style="text-align:right">شكرا لطلبك من iThoob.</p><p style="text-align:right">سيتم التواصل معك عبر البريد الإلكتروني لتحديث و متابعة حالة طلبك ${order.id}.</p><p style="text-align:right">شاكرين لكم ذوقكم الراقي..</p><p style="text-align:right">الاستفسارات يمكنك التواصل عبر الواتساب(966594704888)</p>`,
      "orderStatus"
    );

    let orderNotification = sendNotificationToAdmin("Order", "all-orders");
    promises.push(destroyingCart);
    promises.push(orderMessage);
    promises.push(orderEmail);
    promises.push(orderNotification);
    return Promise.all([...promises]);
  });
}

router.post(
  "/confirm-payment",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log(req.body);
    var responseUrl = null;
    var paymentData = null;
    var couponDisc = 0;
    var couponDiscType = "percent";
    var orderProducts = [];
    var purchased_items_to_discount = 0;
    var free_items = 0;
    var sebhaArray = [];
    var khatemArray = [];
    var asweraArray = [];
    var deblaArray = [];
    var thoobsArray = [];

    if (!req.body.deliveryMethod || !req.body.paymentMethod) {
      return res.status(200).json({
        status: false,
        message: "please enter both paymentMethod and deliveryMethod",
      });
    }

    if (
      req.body.paymentMethod !== "bankTransfer" &&
      req.body.paymentMethod !== "creditCard" &&
      req.body.paymentMethod !== "payOnDelivery" &&
      req.body.paymentMethod !== "tabbyPayment" &&
      req.body.paymentMethod !== "tabbyPayLater"
    ) {
      return res.status(200).json({
        status: false,
        message: "please enter right value for paymentMethod",
      });
    }

    let requests = [];
    const cart = Cart.findOne({
      where: {
        user_id: req.user.id,
      },
      include: [
        { association: "Code", include: [{ association: "Partner" }] },
        {
          association: "CartProductRelationships",
          include: [
            {
              association: "Product",
              include: [
                {
                  association: "Metas",
                },
                { association: "Stock" },
                // { association: "Fabric" }
                { model: models.CategoryRelationship, as: "CategoryRelations" },
                // { association: "CategoryRelations", where:{default:1} },
                {
                  association: "Category",
                  include: [{ association: "Metas" },{ association: "Parents" }],
                },
              ],
            },
            { association: "Metas" },
            { association: "CategoryRelations" },
            { association: "Profile" },
          ],
        },
        {
          association: "User",
          include: [
            { association: "Place", include: [{ association: "Country" }] },
          ],
        },
      ],
    });

    const generalOptionFetch = models.GeneralOption.findAll({
      where: { key: { [Op.or]: ["delivery_price", "man_price","purchased_items_to_discount", "free_items"] } },
    });

    const allCartCustomizeRelationshipsQuery =
      models.CartCustomizeRelationship.findAll();

    requests.push(cart);
    requests.push(generalOptionFetch);
    requests.push(allCartCustomizeRelationshipsQuery);
    if (req.body.deliveryMethod == "homeDelivery") {
      requests.push(
        DeliveryAddress.create({ user_id: req.user.id, ...req.body.address })
      );
    }
    // const allCategoryRelationshipsQuery = models.CategoryRelationship.findAll();

    // Promise.all([cart, generalOptionFetch, allCartCustomizeRelationshipsQuery, allCategoryRelationshipsQuery]).then(results => {
    Promise.all(requests).then((results) => {
      const cart = results[0];
      const generalOptionsList = results[1];

      //get quantity discount right offer
      purchased_items_to_discount = generalOptionsList.find(
        (opt) => opt.key === "purchased_items_to_discount"
      ).value || 0;
      free_items = generalOptionsList.find(
        (opt) => opt.key === "free_items"
      ).value || 0;

      //used to create products list for tabby payment
      orderProducts = cart.CartProductRelationships.map((item) => {
        return {
          title: item.Product.title,
          description: item.Product.sub_title,
          unit_price:
            item.Product.price +
            (req.body.paymentMethod == "tabbyPayLater"
              ? (item.Product.price * 5.5) / 100 + 1
              : (item.Product.price * 6.5) / 100 + 1),
          discount_amount: item.Product.price_discount,
          image_url: item.Product.image,
          quantity: item.quantity,
        };
      });
      
      
      const allCartCustomizeRelationships = results[2];
      // const allCategoryRelationships = results[3];
      if (cart.CartProductRelationships.length > 0) {
        return sequelize
          .transaction((t) => {
            return req.user
              .createOrder(
                {
                  /**
                   * `id` will be Auto Increment from the `orders` table directly
                   * This is a Client Request to simplify Order IDs
                   */
                  // id: makeOrderId(10),
                  ordering_date: moment(),
                  // delivery_date: moment().add(5, "days"),
                  address:
                    req.body.address &&
                    req.body.address.region &&
                    req.body.address.region != ""
                      ? `${req.body.address.region} ${req.body.address.naighborhood} ${req.body.address.street}`
                      : req.user.address,
                  delivery_type:
                    req.body.deliveryMethod == "homeDelivery"
                      ? "home"
                      : req.body.deliveryMethod == "branch"
                      ? "branch"
                      : null,
                  status: "pending_payment",
                  payment_method: req.body.paymentMethod,
                  partner_code_id: cart.Code ? cart.Code.id : null,
                  delivery_address_id:
                    req.body.deliveryMethod == "homeDelivery"
                      ? results[3].id
                      : null,
                },
                { transaction: t }
              )
              .then((order) => {
                var promises = [];
                let total = 0;
                cart.CartProductRelationships.map((item) => {
                  var relationMetaObject = {};
                  var product = item.Product;
                  item.Metas.forEach((meta) => {
                    relationMetaObject[meta.property] = meta.value;
                    relationMetaObject["quantity_id"] = meta.quantity_id;
                  });
                  var cost = relationMetaObject.price
                    ? relationMetaObject.price
                    : relationMetaObject.pricePromo
                    ? relationMetaObject.pricePromo
                    : item.Product.price_discount
                    ? item.Product.price_discount
                    : item.Product.price;

                  // total += cost * item.quantity;
                  // underwear products count discount
                  total +=  cost * item.quantity;
                  var orderProductRelInstance = {
                    quantity: item.quantity,
                    order_id: order.id,
                    cost: cost,
                    product_id: item.product_id,
                    profile_id: item.profile_id,
                  };
                  
                  if (relationMetaObject.quantity_id) {
                    models.Quantity.findOne({
                      where: { id: relationMetaObject.quantity_id },
                    }).then((quantity) => {
                      quantity.update({
                        quantity: quantity.quantity - item.quantity,
                      });
                    });
                  }
                  var proMetas = {}

                    product.Category &&
                    product.Category.Metas
                    ? product.Category.Metas.map((meta) => {
                      proMetas[meta.type] =
                          meta.category_meta_relationship.value;
                      })
                    : null;
                    
                    if(proMetas.slug == 'all-sebah-'){
                      for(let i = 0; i < item.quantity; i++){
                        sebhaArray.push(cost)
                      }
                    }
                    if(proMetas.slug == 'daily-thoob'){
                      for(let i = 0; i < item.quantity; i++){
                        thoobsArray.push(cost)
                      }
                    }
                    if(proMetas.slug == 'all-rings'){
                      for(let i = 0; i < item.quantity; i++){
                        khatemArray.push(cost)
                      }
                    }
                    if(proMetas.slug == 'ring2'){
                      for(let i = 0; i < item.quantity; i++){
                        deblaArray.push(cost)
                      }
                    }
                    if(proMetas.slug == 'bracelets'){
                      for(let i = 0; i < item.quantity; i++){
                        asweraArray.push(cost)
                      }
                    }
                    
                    console.log("========================================================================");
                    console.log("========================================================================");
                    // console.log(asweraArray);
                    // console.log("orderProductMetasArray is", orderProductMetasArray);
                    // console.log("relationMetaObject is", relationMetaObject);
                    // console.log("orderProductRelInstance is", orderProductRelInstance);
                    // console.log("product is", product);
                    // console.log("Category is", product.Category);
                    // console.log("metas is", proMetas);

                    console.log("========================================================================");
                    console.log("========================================================================");
                    // item.CategoryRelations.map(catRel => {
                    //   orderProductCustomizeArray.push({order_prod_id: orderProductRel.id,cat_rel_id: catRel.id})
                    // })
                  var newPromise = OrderProductRelationship.create(
                    orderProductRelInstance,
                    { transaction: t }
                  ).then((orderProductRel) => {
                    var orderProductMetasArray = [];
                    // var orderProductCustomizeArray = [];
                    item.Metas.map((meta) => {
                      orderProductMetasArray.push({
                        order_prod_id: orderProductRel.id,
                        property: meta.property,
                        value: meta.value,
                        quantity_id: meta.quantity_id ? meta.quantity_id : null,
                      });
                    });
                    
                    var Metas = models.OrderProductMeta.bulkCreate(
                      orderProductMetasArray,
                      { transaction: t }
                    );
                    // var Metas = orderProductRel.bulkCreate(item.Metas, {transaction: t})
                    let productCartCustomizations =
                      allCartCustomizeRelationships.filter((i) => {
                        return i.cart_prod_id == item.id;
                      });
                    // var catRel = models.OrderCustomizeRelationship.bulkCreate(orderProductCustomizeArray,{transaction: t})
                    var customFabric = item.CategoryRelations.filter(
                      (item) => {
                        return productCartCustomizations.filter((idx) => {
                          return (
                            idx.category_rel_id == item.id &&
                            idx.type === "fabric"
                          );
                        }).length;
                      } // item.cart_customize_relationship.type === "fabric"
                    );
                    var customYaka = item.CategoryRelations.filter(
                      (item) => {
                        return productCartCustomizations.filter((idx) => {
                          return (
                            idx.category_rel_id == item.id &&
                            idx.type === "yaka"
                          );
                        }).length;
                      } // item.cart_customize_relationship.type === "yaka"
                    );
                    var customadds = item.CategoryRelations.filter(
                      (item) => {
                        return productCartCustomizations.filter((idx) => {
                          return (
                            idx.category_rel_id == item.id &&
                            idx.type === "adds"
                          );
                        }).length;
                      } // item.cart_customize_relationship.type === "yaka"
                    );
                    var customAkmam = item.CategoryRelations.filter(
                      (item) => {
                        return productCartCustomizations.filter((idx) => {
                          return (
                            idx.category_rel_id == item.id &&
                            idx.type === "akmam"
                          );
                        }).length;
                      } // item.cart_customize_relationship.type === "akmam"
                    );
                    var customZarzour = item.CategoryRelations.filter(
                      (item) => {
                        return productCartCustomizations.filter((idx) => {
                          return (
                            idx.category_rel_id == item.id &&
                            idx.type === "zarzour"
                          );
                        }).length;
                      } // item.cart_customize_relationship.type === "zarzour"
                    );
                    var customOthers = item.CategoryRelations.filter(
                      (item) => {
                        return productCartCustomizations.filter((idx) => {
                          return (
                            idx.category_rel_id == item.id &&
                            idx.type === "others"
                          );
                        }).length;
                      } // item.cart_customize_relationship.type === "others"
                    );

                    // var catRel = orderProductRel.setCategoryRelations(
                    //   item.CategoryRelations,
                    //   { transaction: t }
                    // );
                    var catRelFabric = orderProductRel
                      .setCategoryRelations(customFabric, { transaction: t })
                      .then((result) => {
                        models.OrderCustomizeRelationship.update(
                          {
                            type: "fabric",
                          },
                          {
                            where: {
                              id: {
                                [Op.in]: result[0]
                                  ? result[0].map((item) => item.dataValues.id)
                                  : [],
                              },
                            },
                          },
                          { transaction: t }
                        );
                      });
                    var catRelYaka = orderProductRel
                      .setCategoryRelations(customYaka, { transaction: t })
                      .then((result) => {
                        models.OrderCustomizeRelationship.update(
                          {
                            type: "yaka",
                          },
                          {
                            where: {
                              id: {
                                [Op.in]: result[0]
                                  ? result[0].map((item) => item.dataValues.id)
                                  : [],
                              },
                            },
                          },
                          { transaction: t }
                        );
                      });
                    var catReladds = orderProductRel
                      .setCategoryRelations(customadds, { transaction: t })
                      .then((result) => {
                        models.OrderCustomizeRelationship.update(
                          {
                            type: "adds",
                          },
                          {
                            where: {
                              id: {
                                [Op.in]: result[0]
                                  ? result[0].map((item) => item.dataValues.id)
                                  : [],
                              },
                            },
                          },
                          { transaction: t }
                        );
                      });
                    var catRelAkmam = orderProductRel
                      .setCategoryRelations(customAkmam, { transaction: t })
                      .then((result) => {
                        models.OrderCustomizeRelationship.update(
                          {
                            type: "akmam",
                          },
                          {
                            where: {
                              id: {
                                [Op.in]: result[0]
                                  ? result[0].map((item) => item.dataValues.id)
                                  : [],
                              },
                            },
                          },
                          { transaction: t }
                        );
                      });
                    var catRelZarzour = orderProductRel
                      .setCategoryRelations(customZarzour, { transaction: t })
                      .then((result) => {
                        models.OrderCustomizeRelationship.update(
                          {
                            type: "zarzour",
                          },
                          {
                            where: {
                              id: {
                                [Op.in]: result[0]
                                  ? result[0].map((item) => item.dataValues.id)
                                  : [],
                              },
                            },
                          },
                          { transaction: t }
                        );
                      });
                    var catRelOthers = orderProductRel
                      .setCategoryRelations(customOthers, { transaction: t })
                      .then((result) => {
                        models.OrderCustomizeRelationship.update(
                          {
                            type: "others",
                          },
                          {
                            where: {
                              id: {
                                [Op.in]: result[0]
                                  ? result[0].map((item) => item.dataValues.id)
                                  : [],
                              },
                            },
                          },
                          { transaction: t }
                        );
                      });
                    return Promise.all([
                      catRelFabric,
                      catRelYaka,
                      catRelAkmam,
                      catRelZarzour,
                      catRelOthers,
                      catReladds,
                      Metas,
                    ]);
                  });
                  const relationsForProductMainCat = {};

                  product.Category &&
                  product.Category.Parents &&
                  product.Category.Parents[0] &&
                  product.Category.Parents[0].Metas
                    ? product.Category.Parents[0].Metas.map((meta) => {
                        relationsForProductCat[meta.type] =
                          meta.category_meta_relationship.value;
                      })
                    : null;
                  //console.log('old cat',product.Category.id)
                  var fabricCatId = "";
                  //console.log('cart',item.CategoryRelations)
                  product.CategoryRelations.map((cat) => {
                    if (
                      cat.product_category_relationship.default &&
                      cat.type == "color"
                    ) {
                      // this is the product default color
                      // //console.log('cat.child_id',cat.child_id)
                      fabricCatId = cat.child_id;
                    }
                    // //console.log('item',cat.child_id,cat.id,cat.product_category_relationship,cat.product_category_relationship.default)
                  });
                  item.CategoryRelations.map((cat) => {
                    if (
                      cat.cart_customize_relationship &&
                      cat.cart_customize_relationship.type == "fabric"
                    ) {
                      // user add custom color in cart
                      fabricCatId = cat.child_id;
                    }
                    // //console.log('item',cat.child_id,cat.id,cat.cart_customize_relationship)
                  });
                  const maxQuantityMeta = CategoryMeta.findOne({
                    where: {
                      type: "max_quantity",
                    },
                  }).then((meta) => {
                    return CategoryMetaRelationship.findOne({
                      where: {
                        category_id: fabricCatId,
                        category_meta_id: meta.id,
                      },
                    }).then((categoryMeta) => {
                      // //console.log('max categoryMeta',categoryMeta)
                      return categoryMeta;
                    });
                  });
                  const fabricTypeMeta = CategoryMeta.findOne({
                    where: {
                      type: "fabric_type",
                    },
                  }).then((meta) => {
                    if (!meta) {
                      return null;
                    }
                    return CategoryMetaRelationship.findOne({
                      where: {
                        category_id: fabricCatId,
                        category_meta_id: meta.id,
                      },
                    }).then((categoryMeta) => {
                      return categoryMeta;
                    });
                  });
                  // maxQuantityMeta &&
                  // relationsForProductMainCat &&
                  // relationsForProductMainCat.stock_type &&
                  // relationsForProductMainCat.stock_type === "fabric" &&
                  // item.Profile
                  // mnaguib stock fixed for size s without review to controll
                  // remain review small decrement value is correct, then large and medium, then profile, then stock for normal product
                  const deductFromStock = item.Product.Stock
                    ? item.Product.Stock.decrement(
                        {
                          value: item.quantity,
                        },
                        { transaction: t }
                      )
                    : maxQuantityMeta && fabricCatId != "" && item.Profile
                    ? maxQuantityMeta.then((result) =>
                        fabricTypeMeta.then((val) => {
                          return result && result.decrement
                            ? result.decrement(
                                {
                                  value: calculateThoob(
                                    item.Profile.value_1,
                                    item.Profile.value_2,
                                    item.Profile.value_3,
                                    item.Profile.value_4,
                                    item.Profile.value_5,
                                    item.Profile.value_6,
                                    item.Profile.value_7,
                                    item.Profile.value_8,
                                    item.Profile.value_9,
                                    item.Profile.value_10,
                                    item.Profile.value_11,
                                    item.Profile.value_12,
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : val && val.decrement
                            ? val.decrement(
                                {
                                  value: calculateThoob(
                                    item.Profile.value_1,
                                    item.Profile.value_2,
                                    item.Profile.value_3,
                                    item.Profile.value_4,
                                    item.Profile.value_5,
                                    item.Profile.value_6,
                                    item.Profile.value_7,
                                    item.Profile.value_8,
                                    item.Profile.value_9,
                                    item.Profile.value_10,
                                    item.Profile.value_11,
                                    item.Profile.value_12,
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : null;
                        })
                      )
                    : maxQuantityMeta &&
                      fabricCatId != "" &&
                      relationMetaObject.size &&
                      relationMetaObject.size === "s"
                    ? maxQuantityMeta.then((result) => {
                        return fabricTypeMeta.then((val) => {
                          // //console.log('qty',fabricTypeMeta);
                          // fabricTypeMeta.then(val=>//console.log('val',val && val.value ? val.value : "normal"));
                          return result && result.decrement
                            ? result.decrement(
                                {
                                  value: calculateThoobSmall(
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : val && val.decrement
                            ? val.decrement(
                                {
                                  value: calculateThoobSmall(
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : null;
                        });
                      })
                    : maxQuantityMeta &&
                      fabricCatId != "" &&
                      relationMetaObject.size &&
                      relationMetaObject.size === "m"
                    ? maxQuantityMeta.then((result) =>
                        fabricTypeMeta.then((val) => {
                          return result && result.decrement
                            ? result.decrement(
                                {
                                  value: calculateThoobMedium(
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : val && val.decrement
                            ? val.decrement(
                                {
                                  value: calculateThoobMedium(
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : null;
                        })
                      )
                    : maxQuantityMeta &&
                      fabricCatId != "" &&
                      relationMetaObject.size &&
                      relationMetaObject.size === "l"
                    ? maxQuantityMeta.then((result) =>
                        fabricTypeMeta.then((val) => {
                          return result && result.decrement
                            ? result.decrement(
                                {
                                  value: calculateThoobLarge(
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : val && val.decrement
                            ? val.decrement(
                                {
                                  value: calculateThoobLarge(
                                    val && val.value ? val.value : "normal",
                                    item.quantity
                                  ),
                                },
                                { transaction: t }
                              )
                            : null;
                        })
                      )
                    : // : product.Stock.decrement(
                      //     { value: item.quantity },
                      //     { transaction: t }
                      //   );
                      null;
                  promises.push(newPromise);
                  if (
                    req.body.paymentMethod != "creditCard" &&
                    req.body.paymentMethod != "tabbyPayment" &&
                    req.body.paymentMethod != "tabbyPayLater"
                  ) {
                    // //console.log('deductFromStock',deductFromStock)
                    promises.push(deductFromStock);
                    var destroyingCart = models.CartProductRelationship.destroy({
                      where: { cart_id: cart.id },
    
                      // transaction: t,
                    });
                  promises.push(destroyingCart);

                  }
                });
                
                console.log("========================================================================");
                console.log("========================================================================");
                    console.log(thoobsArray);
                    console.log(sebhaArray);
                console.log("========================================================================");
                console.log("========================================================================");
                var quantity_discount = 0;
                if(sebhaArray.length && sebhaArray.length > 1){
                  var count = Math.floor(sebhaArray.length / 2);
                  const newArr = sebhaArray.sort(function(a, b) {
                    return b - a;
                  });
                  for(let i = 0; i <newArr.length; i++){
                    if(i >= newArr.length - count){
                      quantity_discount +=  Number(newArr[i]);
                    }
                  }
                }
                if(khatemArray.length && khatemArray.length > 1){
                  var count = Math.floor(khatemArray.length / 2);
                  const newArr = khatemArray.sort(function(a, b) {
                    return b - a;
                  });
                  for(let i = 0; i <newArr.length; i++){
                    if(i >= newArr.length - count){
                      quantity_discount +=  Number(newArr[i]);
                    }
                  }
                }
                if(asweraArray.length && asweraArray.length > 1){
                  var count = Math.floor(asweraArray.length / 2);
                  const newArr = asweraArray.sort(function(a, b) {
                    return b - a;
                  });
                  for(let i = 0; i <newArr.length; i++){
                    if(i >= newArr.length - count){
                      quantity_discount +=  Number(newArr[i]);
                    }
                  }
                }
                if(deblaArray.length && deblaArray.length > 1){
                  var count = Math.floor(deblaArray.length / 2);
                  const newArr = deblaArray.sort(function(a, b) {
                    return b - a;
                  });
                  for(let i = 0; i <newArr.length; i++){
                    if(i >= newArr.length - count){
                      quantity_discount +=  Number(newArr[i]);
                    }
                  }
                }
                if(thoobsArray.length && thoobsArray.length > 2){
                  var count = Math.ceil(thoobsArray.length / 3 * 2);
                  const newArr = thoobsArray.sort(function(a, b) {
                    return b - a;
                  });
                  for(let i = 0; i <newArr.length; i++){
                    if(i >= count){
                      quantity_discount +=  Number(newArr[i]);
                    }
                  }
                }
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');

                console.log("quantity_discount", quantity_discount);
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');
                console.log('====================================');

                var userDiscount = req.user.discount || 0;
                var partnerDiscount = cart.Code
                  ? cart.Code.Partner.discount
                  : 0;

                // Apply the biggest coupon discount only
                var userDiscountOriginalVal = userDiscount;
                var partnerDiscountOriginalVal = partnerDiscount;

                partnerDiscount >= userDiscount
                  ? (userDiscount = 0)
                  : (partnerDiscount = 0);

                var deliveryCost =
                  cart.User.Place && cart.User.Place.delivery_price
                    ? cart.User.Place.delivery_price
                    : cart.User.Place && cart.User.Place.Country.delivery_price
                    ? cart.User.Place.Country.delivery_price
                    : generalOptionsList.find(
                        (opt) => opt.key === "delivery_price"
                      ).value;
                var sizeMan = !req.body.sizeManFlag
                  ? 0
                  : cart.User.Place && cart.User.Place.man_price
                  ? cart.User.Place.man_price
                  : cart.User.Place && cart.User.Place.Country.man_price
                  ? cart.User.Place.Country.man_price
                  : generalOptionsList.find((opt) => opt.key === "man_price")
                      .value;

                var addCosts = order.update(
                  {
                    total: total,
                    user_discount: userDiscountOriginalVal,
                    partner_discount: partnerDiscountOriginalVal,
                    delivery_cost:
                      req.body.deliveryMethod == "homeDelivery"
                        ? deliveryCost
                        : 0,
                    size_man: sizeMan,
                    quantity_discount: quantity_discount,
                    expected_total:
                          total *
                            (1 - (userDiscount + partnerDiscount) / 100) +
                          parseFloat(
                            req.body.deliveryMethod == "homeDelivery"
                              ? deliveryCost
                              : 0
                          ) +
                          parseFloat(sizeMan) - quantity_discount,
                  },
                  { transaction: t }
                );

                // check if there a discount coupon
                if (req.body.coupon_code && req.body.coupon_code != null) {
                  coupon = GeneralCoupon.findOne({
                    where: {
                      code: req.body.coupon_code,
                    },
                  }).then((coupon) => {
                    console.log(coupon.discount);
                    let discount_coupon = 0;
                    let coupon_discount_type = "percent";
                    //check if order date is between  coupon start and end date
                    let compare = moment().isBetween(
                      coupon.start_date,
                      coupon.end_date
                    );
                    console.log(compare);
                    if (coupon.discount && compare) {
                      discount_coupon = coupon.discount;
                      couponDisc = coupon.discount;
                      coupon_discount_type = coupon.discount_type;
                      couponDiscType = coupon.discount_type;
                    }
                    console.log("discount_coupon is" + discount_coupon, coupon_discount_type, couponDiscType, couponDisc);
                   

                    order.update(
                      {
                        coupon_discount: discount_coupon,
                        coupon_discount_type: coupon.discount_type,
                        coupon_code: req.body.coupon_code
                          ? req.body.coupon_code
                          : null,
                        quantity_discount: quantity_discount,
                        expected_total:
                          total *
                            (1 - (userDiscount + partnerDiscount + (coupon_discount_type === "percent" ?discount_coupon : 0)) / 100) -
                            (coupon_discount_type === "money" ? discount_coupon : 0) +
                          parseFloat(
                            req.body.deliveryMethod == "homeDelivery"
                              ? deliveryCost
                              : 0
                          ) +
                          parseFloat(sizeMan) - quantity_discount,
                      },
                      { transaction: t }
                    );
                    // change the coupon status after using it
                    // GeneralCoupon.update({status: 0},{where : {code : coupon.code}},{ transaction: t })

                    console.log(userDiscount,partnerDiscount,couponDiscType,couponDisc,
                      total *
                      (1 - (userDiscount + partnerDiscount + (couponDiscType === "percent" ?couponDisc : 0)) / 100) -
                            (couponDiscType === "money" ? couponDisc : 0) +
                      parseFloat(
                        req.body.deliveryMethod == "homeDelivery"
                          ? deliveryCost
                          : 0
                      ) +
                      parseFloat(sizeMan) - quantity_discount);
                    // return Promise.all([...promises]);
                    if (req.body.paymentMethod == "creditCard") {
                      paymentData = {
                        amount:
                          total *
                          (1 - (userDiscount + partnerDiscount + (couponDiscType === "percent" ?couponDisc : 0)) / 100) -
                                (couponDiscType === "money" ? couponDisc : 0) +
                          parseFloat(
                            req.body.deliveryMethod == "homeDelivery"
                              ? deliveryCost
                              : 0
                          ) +
                          parseFloat(sizeMan) - quantity_discount,
                        currency: "SAR",
                        threeDSecure: true,
                        save_card: false,
                        description: "Order Payment",
                        statement_descriptor: "Sample",
                        metadata: {
                          udf1: "test 1",
                          udf2: "test 2",
                        },
                        reference: {
                          transaction: "txn_0001",
                          order: order.id,
                        },
                        receipt: {
                          email: false,
                          sms: true,
                        },
                        customer: {
                          first_name: req.user.name,
                          middle_name: "",
                          last_name: "",
                          email: req.user.email,
                          phone: {
                            country_code: "",
                            number: req.user.mobile,
                          },
                        },
                        merchant: {
                          id: "",
                        },
                        source: {
                          id: "src_all",
                        },
                        post: {
                          url: "https://api.ithoob.com:5002/api/payment_response",
                        },
                        redirect: {
                          url: "https://ithoob.com/checkout",
                        },
                      };
                    }
                  });
                }else if (req.body.paymentMethod == "creditCard") {
                  paymentData = {
                    amount:
                      total *
                      (1 - (userDiscount + partnerDiscount) / 100) +
                      parseFloat(
                        req.body.deliveryMethod == "homeDelivery"
                          ? deliveryCost
                          : 0
                      ) +
                      parseFloat(sizeMan) - quantity_discount,
                    currency: "SAR",
                    threeDSecure: true,
                    save_card: false,
                    description: "Order Payment",
                    statement_descriptor: "Sample",
                    metadata: {
                      udf1: "test 1",
                      udf2: "test 2",
                    },
                    reference: {
                      transaction: "txn_0001",
                      order: order.id,
                    },
                    receipt: {
                      email: false,
                      sms: true,
                    },
                    customer: {
                      first_name: req.user.name,
                      middle_name: "",
                      last_name: "",
                      email: req.user.email,
                      phone: {
                        country_code: "",
                        number: req.user.mobile,
                      },
                    },
                    merchant: {
                      id: "",
                    },
                    source: {
                      id: "src_all",
                    },
                    post: {
                      url: "https://api.ithoob.com:5002/api/payment_response",
                    },
                    redirect: {
                      url: "https://ithoob.com/checkout",
                    },
                  };
                }
                
                

                const removePartnerDiscount = cart.update(
                  { partner_code_id: null },
                  { where: { id: cart.id } }
                );
                

                

                if (
                  req.body.paymentMethod != "creditCard" &&
                  req.body.paymentMethod != "tabbyPayment" &&
                  req.body.paymentMethod != "tabbyPayLater"
                ) {
                  let orderMessage = sendMessage(
                    [req.user.mobile],
                    req.body.language === 1
                      ? `Dear customer, 
                      Your order # ${order.id} is in progress.
                      Contact us via WhatsApp: 966594704888
                      Thank you.
                      `
                      : `عميلنا الراقي !
                      طلبك رقم ${order.id} قيد التنفيذ.
                      شكراً وشرفتنا .
                       للتواصل عبر الواتس اب : 966594704888
                      `,
                    "iThoob",
                    "orderStatus"
                  );
  
                  let orderEmail = sendMail(
                    req.user.email,
                    "iThoob Order",
                    req.body.language === 1
                      ? `Hello ${req.user.name}`
                      : `مرحبا ${req.user.name}`,
                    `<h4 style="text-align:right">يا هلا و مرحبا</h4><p style="text-align:right">شكرا لطلبك من iThoob.</p><p style="text-align:right">سيتم التواصل معك عبر البريد الإلكتروني لتحديث و متابعة حالة طلبك ${order.id}.</p><p style="text-align:right">شاكرين لكم ذوقكم الراقي..</p><p style="text-align:right">الاستفسارات يمكنك التواصل عبر الواتساب(966594704888)</p>`,
                    "orderStatus"
                  );
  
                  let orderNotification = sendNotificationToAdmin(
                    "Order",
                    "all-orders"
                  );
                  promises.push(orderMessage);
                  promises.push(orderEmail);
                  promises.push(orderNotification);
                }

                return Promise.all([
                  { orderNo: order.id },
                  ...promises,
                  addCosts,
                  removePartnerDiscount,
                  { newOrder: order },
                ]);
              });
          })
          .then((result) => {
            if (req.body.paymentMethod == "creditCard") {
              console.log('====================================');
              console.log(paymentData);
              console.log('====================================');
              sendPaymentURL(paymentData).then((paymentResponse) => {
                console.log(paymentResponse.data.transaction.url);
                responseUrl = paymentResponse.data.transaction.url;
                console.log(responseUrl);
                res.status(200).json({
                  status: true,
                  orderNo: result[0].orderNo,
                  responseUrl,
                });
              });
            } else if (
              req.body.paymentMethod == "tabbyPayment" ||
              req.body.paymentMethod == "tabbyPayLater"
            ) {
              requestTabbyPaymentURL(
                result[result.length - 1].newOrder,
                req.user,
                req.body.paymentMethod,
                orderProducts
              )
                .then((tabbyResponse) => {
                  console.log("tabbyResponse tabbyResponse tabbyResponse");
                  console.log(tabbyResponse);
                  responseUrl =
                    req.body.paymentMethod == "tabbyPayLater"
                      ? tabbyResponse.data.configuration.available_products
                          .pay_later[0].web_url
                      : tabbyResponse.data.configuration.available_products
                          .installments[0].web_url;
                  console.log(responseUrl);
                  res.status(200).json({
                    status: true,
                    orderNo: result[0].orderNo,
                    responseUrl,
                  });
                })
                .catch((err) => console.log(err));
            } else {
              res.status(200).json({
                status: true,
                orderNo: result[0].orderNo,
                responseUrl,
              });
            }
          })
          .catch((err) => {
            console.log(err);
            res.status(200).json({ err });
          });
      } else {
        res.status(200).json({
          status: false,
          message: "no products in your card",
        });
      }
    });
  }
);

// post rollback
router.post(
  "/orders",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const enums = models.GeneralEnum.findAll({
      where: {
        value: {
          [Op.in]: ["all", "current", "pending_payment", "cancelled"],
        },
      },
    });
    const orderQuery = Order.findAll({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          association: "OrderProductRelationships",
          separate: true,
          include: [
            {
              association: "Product",
              seperate: true,
              include: [
                { association: "Metas" },
                {
                  association: "Category",
                  include: [
                    { association: "Metas" },
                    {
                      association: "Parents",
                      include: {
                        association: "Metas",
                      },
                    },
                  ],
                },
              ],
            },
            { association: "Profile" },
            { association: "CategoryRelations" },
            { association: "Metas", separate: true },
          ],
        },
      ],
      order: [["ordering_date", "DESC"]],
    });
    // const generalOptionFetch = models.GeneralOption.findAll({
    //   where: { key: { [Op.or]: ["delivery_price", "man_price"] } }
    // });
    Promise.all([
      enums,
      orderQuery,
      // generalOptionFetch
    ])
      .then((responses) => {
        var enumsList = responses[0];
        var orders = responses[1];
        // var generalOptionsList = responses[2];
        res.status(200).json({
          status: true,
          categories: enumsList.map((item) => {
            return {
              catId: item.id,
              catName: req.body.language === 1 ? item.name_en : item.name,
              slug: item.value,
            };
          }),
          orders:
            orders.length > 0
              ? orders.map((order) => {
                  // var deliveryCost =
                  //   order.User.Place && order.User.Place.delivery_price
                  //     ? order.User.Place.delivery_price
                  //     : order.User.Place &&
                  //       order.User.Place.Country.delivery_price
                  //     ? order.User.Place.Country.delivery_price
                  //     : generalOptionsList.find(
                  //         opt => opt.key === "delivery_price"
                  //       ).value;
                  // var sizeMan =
                  //   order.User.Place && order.User.Place.man_price
                  //     ? order.User.Place.man_price
                  //     : order.User.Place && order.User.Place.Country.man_price
                  //     ? order.User.Place.Country.man_price
                  //     : generalOptionsList.find(opt => opt.key === "man_price")
                  //         .value;
                  // var productsCost = 0.0;

                  var partnerDiscount = order.partner_discount
                    ? order.partner_discount
                    : 0;
                  var userDiscount = req.user.discount || 0;

                  // Apply the biggest coupon discount only
                  var userDiscountOriginalVal = userDiscount;
                  var partnerDiscountOriginalVal = partnerDiscount;
                  partnerDiscount >= userDiscount
                    ? (userDiscount = 0)
                    : (partnerDiscount = 0);

                  return {
                    orderNo: order.id,
                    orderStatus: order.status,
                    newOrderDate:
                      req.body.language === 1 && order.ordering_date
                        ? moment(order.ordering_date).format("LL")
                        : order.ordering_date
                        ? moment(order.ordering_date).locale("ar").format("LL")
                        : null,
                    deliveryDate:
                      req.body.language === 1 && order.delivery_date
                        ? moment(order.delivery_date).format("LL")
                        : order.delivery_date
                        ? moment(order.delivery_date).locale("ar").format("LL")
                        : null,
                    pickableDate:
                      req.body.language === 1 && order.pickable_date
                        ? moment(order.pickable_date).format("LL")
                        : order.pickable_date
                        ? moment(order.pickable_date).locale("ar").format("LL")
                        : null,
                    productionDate:
                      req.body.language === 1 && order.production_date
                        ? moment(order.production_date).format("LL")
                        : order.production_date
                        ? moment(order.production_date)
                            .locale("ar")
                            .format("LL")
                        : null,
                    cancellationDate:
                      req.body.language === 1 && order.cancellation_date
                        ? moment(order.cancellation_date).format("LL")
                        : order.cancellation_date
                        ? moment(order.cancellation_date)
                            .locale("ar")
                            .format("LL")
                        : null,
                    deliveryAndPayment: {
                      paymentMethod: order.payment_method,
                      deliveryMethod: order.delivery_type + " delivery",
                      address:
                        order.delivery_type == "home" ? order.address : "",
                    },
                    orderSummary: {
                      userDiscount: userDiscountOriginalVal + "%",
                      delivery:
                        true || req.body.language === "1"
                          ? String(order.delivery_cost)
                          : convertToArabic(order.delivery_cost),
                      costOfsizeMan:
                        true || req.body.language === "1"
                          ? order.OrderProductRelationships.find((item) => {
                              let foundSizeManProp = false;
                              item.Metas.forEach((meta) => {
                                if (
                                  meta.property == "sizeMan" &&
                                  meta.value == "true"
                                )
                                  foundSizeManProp = true;
                              });
                              return foundSizeManProp;
                            }) == undefined
                            ? 0
                            : String(order.size_man)
                          : order.OrderProductRelationships.find((item) => {
                              let foundSizeManProp = false;
                              item.Metas.forEach((meta) => {
                                if (
                                  meta.property == "sizeMan" &&
                                  meta.value == "true"
                                )
                                  foundSizeManProp = true;
                              });
                              return foundSizeManProp;
                            }) == undefined
                          ? 0
                          : convertToArabic(order.size_man),
                      total: String(order.total),
                      partnerDiscount: partnerDiscountOriginalVal + "%",
                      coupon_discount: order.coupon_discount,
                      coupon_code: order.coupon_code,
                      coupon_discount_type:order.coupon_discount_type,
                      quantity_discount : order.quantity_discount,
                      expectTotal:
                        // (true || req.body.language === "1") ?
                        order.OrderProductRelationships.find((item) => {
                          let foundSizeManProp = false;
                          item.Metas.forEach((meta) => {
                            if (
                              meta.property == "sizeMan" &&
                              meta.value == "true"
                            )
                              foundSizeManProp = true;
                          });
                          return foundSizeManProp;
                        }) !== undefined
                          ? String(
                              // There's a sizeMan cost!
                              (
                                order.total *
                                  (1 -
                                    (userDiscount +
                                      partnerDiscount +
                                      (order.coupon_discount_type && order.coupon_discount_type !== "money"? order.coupon_discount : 0)) / 100) -
                                (order.coupon_discount_type && order.coupon_discount_type === "money" ? order.coupon_discount : 0) +
                                parseFloat(order.delivery_cost) +
                                parseFloat(order.size_man) +
                                (req.body.paymentMethod == "tabbyPayLater"
                                  ? ((order.total +
                                      parseFloat(order.delivery_cost)) *
                                      5.5) /
                                      100 +
                                    1
                                  : req.body.paymentMethod == "tabbyPayLater"
                                  ? ((order.total +
                                      parseFloat(order.delivery_cost)) *
                                      6.5) /
                                      100 +
                                    1
                                  : 0)
                              ).toFixed(2) - order.quantity_discount
                            )
                          : order.coupon_discount_type && order.coupon_discount_type !== "money"
                          ? String(
                              // There's NO sizeMan cost!
                              (
                                order.total *
                                  (1 -
                                    (userDiscount +
                                      partnerDiscount +
                                      order.coupon_discount) /
                                      100) +
                                parseFloat(order.delivery_cost)
                              ).toFixed(2)
                            ) - order.quantity_discount
                          : order.coupon_discount_type && order.coupon_discount_type === "money" ? String(
                              // There's NO sizeMan cost!
                              (
                                order.total *
                                  (1 - (userDiscount + partnerDiscount) / 100) -
                                order.coupon_discount +
                                parseFloat(order.delivery_cost)
                              ).toFixed(2) - order.quantity_discount
                            ) : String(
                              // There's NO sizeMan cost!
                              (
                                order.total *
                                  (1 - (userDiscount + partnerDiscount) / 100) -
                                order.coupon_discount +
                                parseFloat(order.delivery_cost)
                              ).toFixed(2) - order.quantity_discount
                            ),
                      // : order.OrderProductRelationships.find((item) => {
                      //   let foundSizeManProp = false;
                      //   item.Metas.forEach((meta) => {
                      //     if (meta.property == "sizeMan" && meta.value == "true")
                      //       foundSizeManProp = true;
                      //   })
                      //   return foundSizeManProp;
                      // }) == undefined ? convertToArabic((
                      //   order.total *
                      //   (1 -
                      //     (order.user_discount + partnerDiscount) / 100) +
                      //   parseFloat(order.delivery_cost)).toFixed(2)
                      // )
                      //   :
                      //   convertToArabic((
                      //     order.total *
                      //     (1 -
                      //       (order.user_discount + partnerDiscount) / 100) +
                      //     parseFloat(order.delivery_cost) +
                      //     parseFloat(order.size_man)).toFixed(2)
                      //   )
                    },
                    sizeManFlag:
                      order.OrderProductRelationships.find((item) => {
                        let foundSizeManProp = false;
                        item.Metas.forEach((meta) => {
                          if (
                            meta.property == "sizeMan" &&
                            meta.value == "true"
                          )
                            foundSizeManProp = true;
                        });
                        return foundSizeManProp;
                      }) == undefined
                        ? false
                        : true,
                    orderDetails: {
                      itemsOfOrders: order.OrderProductRelationships.map(
                        (item) => {
                          var product = item.Product;
                          var productCatMeta = {};

                          // console.log(item.Product.Category.Parents.length)
                          // item.Product.Category.
                          // CategoryMetaRelationship.findAll({
                          //   where: {
                          //     category_id: item.Product.Category.Parents.map(category => category.id)
                          //   },
                          //   include: [
                          //     { association: "Meta" }
                          //   ]
                          // })
                          // .then(res => {
                          //   console.log(res.map(meta => meta.))
                          // })

                          product.Category.Metas.map((meta) => {
                            productCatMeta[meta.type] =
                              meta.category_meta_relationship.value;
                          });

                          var relationMetaObject = {};
                          item.Metas.forEach((meta) => {
                            relationMetaObject[meta.property] = meta.value;
                          });

                          var newPrice =
                            product.price_discount || product.price;
                          var discount = Math.round(
                            ((product.price - newPrice) / product.price) * 100
                          );
                          var discountValue = product.price - newPrice;
                          console.log(
                            "==================================== product"
                          );
                          console.log(item.Metas);
                          console.log(
                            "==================================== product"
                          );

                          return {
                            itemImg: product.image,
                            productId: item.id,
                            itemTitle:
                              req.body.language == "1"
                                ? product.title_en
                                : product.title,
                            quantity:
                              true || req.body.language === "1"
                                ? String(item.quantity)
                                : convertToArabic(item.quantity),
                            price:
                              true || req.body.language === "1"
                                ? `${item.cost}`
                                : convertToArabic(item.cost),
                            edited:
                              item.CategoryRelations.length >= 1 &&
                              !product.Metas.filter(
                                (meta) => meta.type === "customized"
                              ).length >= 1
                                ? true
                                : false,
                            stockType: productCatMeta.stock_type
                              ? productCatMeta.stock_type
                              : product.Category.Parents.length
                              ? product.Category.Parents[0]
                                ? product.Category.Parents[0].Metas.length
                                  ? product.Category.Parents[0].Metas.find(
                                      (myMetaObject) => {
                                        return (
                                          myMetaObject.type == "stock_type"
                                        );
                                      }
                                    )
                                    ? product.Category.Parents[0].Metas.find(
                                        (myMetaObject) => {
                                          return (
                                            myMetaObject.type == "stock_type"
                                          );
                                        }
                                      ).category_meta_relationship.value
                                    : null
                                  : null
                                : null
                              : null,
                            designed:
                              product.Metas.filter(
                                (meta) => meta.type === "customized"
                              ).length >= 1
                                ? true
                                : false,
                            selectedSize: {
                              id: item.Profile ? item.Profile.id : undefined,
                              name: item.Profile
                                ? item.Profile.name
                                : productCatMeta.sizeType == "shoes"
                                ? relationMetaObject.shoesSize
                                : relationMetaObject.size,
                              sizeType: productCatMeta.sizeType,
                            },
                            sizeManFlag:
                              relationMetaObject.sizeMan &&
                              relationMetaObject.sizeMan == "true"
                                ? true
                                : false,
                            discount:
                              true || req.body.language === "1"
                                ? discount + "%"
                                : convertToArabic(discount) + "%",
                            discountValue:
                              true || req.body.language === "1"
                                ? "-" + discountValue
                                : "-" + convertToArabic(discountValue),
                            notes:
                              item.Metas.filter(
                                (meta) =>
                                  meta.property == "note" && meta.value !== null
                              ).length != 0
                                ? item.Metas.filter(
                                    (meta) =>
                                      meta.property == "note" &&
                                      meta.value !== null
                                  )[0].value
                                : null,
                            // {
                            //   console.log(meta.property == "note",
                            //   meta.value !== null);
                            //   var note = '';
                            //   if (
                            //     meta.property == "note" &&
                            //     meta.value !== null
                            //   ){
                            //     console.log(meta.value);
                            //     note = meta.value;
                            //   }
                            //   return note;
                            // }),
                          };
                        }
                      ),
                    },
                  };
                })
              : [],
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(200).json({
          status: false,
          message:
            req.body.language === 1
              ? "Error while retreiving the orders"
              : "خطأ  في إسترجاع الاوردرات",
        });
      });
  }
);

router.post(
  "/orders-old",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const enums = models.GeneralEnum.findAll({
      where: {
        value: {
          [Op.in]: ["all", "current", "pending_payment", "cancelled"],
        },
      },
    });
    const orderQuery = Order.findAll({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          association: "OrderProductRelationships",
          include: [
            {
              association: "Product",
              include: [
                { association: "Metas" },
                {
                  association: "Category",
                  include: [{ association: "Metas" }],
                },
              ],
            },
            { association: "Profile" },
            {
              association: "CategoryRelations",
            },
            { association: "Metas" },
          ],
        },
        {
          association: "User",
          include: [
            { association: "Place", include: [{ association: "Country" }] },
          ],
        },
        { association: "Code", include: [{ association: "Partner" }] },
      ],
    });
    const generalOptionFetch = models.GeneralOption.findAll({
      where: { key: { [Op.or]: ["delivery_price", "man_price"] } },
    });
    Promise.all([enums, orderQuery, generalOptionFetch]).then((responses) => {
      var enumsList = responses[0];
      var orders = responses[1];
      var generalOptionsList = responses[2];
      res.status(200).json({
        status: true,
        categories: enumsList.map((item) => {
          return {
            catId: item.id,
            catName: req.body.language === 1 ? item.name_en : item.name,
            slug: item.value,
          };
        }),
        orders:
          orders.length > 0
            ? orders.map((order) => {
                var deliveryCost =
                  order.User.Place && order.User.Place.delivery_price
                    ? order.User.Place.delivery_price
                    : order.User.Place &&
                      order.User.Place.Country.delivery_price
                    ? order.User.Place.Country.delivery_price
                    : generalOptionsList.find(
                        (opt) => opt.key === "delivery_price"
                      ).value;
                var sizeMan =
                  order.User.Place && order.User.Place.man_price
                    ? order.User.Place.man_price
                    : order.User.Place && order.User.Place.Country.man_price
                    ? order.User.Place.Country.man_price
                    : generalOptionsList.find((opt) => opt.key === "man_price")
                        .value;
                var productsCost = 0.0;
                order.OrderProductRelationships.map((orderProductRel) => {
                  productsCost +=
                    parseFloat(orderProductRel.cost) * orderProductRel.quantity;
                });
                var partnerDiscount = order.Code
                  ? order.Code.Partner.discount
                  : 0;
                var userDiscount = req.user.discount || 0;
                return {
                  orderNo: order.id,
                  orderStatus: order.status,
                  newOrderDate:
                    req.body.language === 1 && order.ordering_date
                      ? moment(order.ordering_date).format("LL")
                      : order.ordering_date
                      ? moment(order.ordering_date).locale("ar").format("LL")
                      : null,
                  deliveryDate:
                    req.body.language === 1 && order.delivery_date
                      ? moment(order.delivery_date).format("LL")
                      : order.delivery_date
                      ? moment(order.delivery_date).locale("ar").format("LL")
                      : null,
                  pickableDate:
                    req.body.language === 1 && order.pickable_date
                      ? moment(order.pickable_date).format("LL")
                      : order.pickable_date
                      ? moment(order.pickable_date).locale("ar").format("LL")
                      : null,
                  productionDate:
                    req.body.language === 1 && order.production_date
                      ? moment(order.production_date).format("LL")
                      : order.production_date
                      ? moment(order.production_date).locale("ar").format("LL")
                      : null,
                  deliveryAndPayment: {
                    paymentMethod: order.payment_method,
                    deliveryMethod: order.delivery_type + " delivery",
                    address: order.address,
                  },
                  orderSummary: {
                    userDiscount:
                      userDiscount !== 0 && req.body.language === "1"
                        ? userDiscount + "%"
                        : userDiscount !== 0
                        ? convertToArabic(userDiscount) + "%"
                        : undefined,
                    userDiscountValue:
                      userDiscount !== 0 && req.body.language === "1"
                        ? "-" + (userDiscount * productsCost) / 100
                        : userDiscount !== 0
                        ? "-" +
                          convertToArabic((userDiscount * productsCost) / 100)
                        : undefined,
                    delivery:
                      req.body.language === "1"
                        ? String(deliveryCost)
                        : convertToArabic(deliveryCost),
                    costOfsizeMan:
                      req.body.language === "1"
                        ? String(sizeMan)
                        : convertToArabic(sizeMan),
                    total:
                      req.body.language === "1"
                        ? String(productsCost)
                        : convertToArabic(productsCost),
                    partnerDiscount:
                      partnerDiscount !== 0 && req.body.language === "1"
                        ? partnerDiscount + "%"
                        : partnerDiscount !== 0
                        ? convertToArabic(partnerDiscount) + "%"
                        : undefined,
                    partnerDiscountValue:
                      partnerDiscount !== 0 && req.body.language === "1"
                        ? "-" + (partnerDiscount * productsCost) / 100
                        : partnerDiscount !== 0
                        ? "-" +
                          convertToArabic(
                            (partnerDiscount * productsCost) / 100
                          )
                        : undefined,
                    expectTotal:
                      req.body.language === "1"
                        ? String(
                            productsCost *
                              (1 - (userDiscount + partnerDiscount) / 100) +
                              parseFloat(deliveryCost) +
                              parseFloat(sizeMan)
                          )
                        : convertToArabic(
                            productsCost *
                              (1 - (userDiscount + partnerDiscount) / 100) +
                              parseFloat(deliveryCost) +
                              parseFloat(sizeMan)
                          ),
                  },
                  orderDetails: {
                    itemsOfOrders: order.OrderProductRelationships.map(
                      (item) => {
                        var product = item.Product;
                        var relationMetaObject = {};
                        var newPrice = product.price_discount || product.price;
                        var discount = Math.round(
                          ((product.price - newPrice) / product.price) * 100
                        );
                        var discountValue = product.price - newPrice;
                        item.Metas.forEach((meta) => {
                          relationMetaObject[meta.property] = meta.value;
                        });
                        var productCatMeta = {};
                        product.Category.Metas.map((meta) => {
                          productCatMeta[meta.type] =
                            meta.category_meta_relationship.value;
                        });
                        return {
                          itemImg: product.image,
                          productId: item.id,
                          itemTitle: product.title,
                          quantity:
                            req.body.language === "1"
                              ? String(item.quantity)
                              : convertToArabic(item.quantity),
                          price:
                            req.body.language === "1"
                              ? `${item.cost}`
                              : convertToArabic(item.cost),
                          edited:
                            item.CategoryRelations.length >= 1 &&
                            !product.Metas.filter(
                              (meta) => meta.type === "customized"
                            ).length >= 1
                              ? true
                              : false,
                          designed:
                            product.Metas.filter(
                              (meta) => meta.type === "customized"
                            ).length >= 1
                              ? true
                              : false,
                          selectedSize: {
                            id: item.Profile ? item.Profile.id : undefined,
                            name: item.Profile
                              ? item.Profile.name
                              : productCatMeta.sizeType == "shoes"
                              ? relationMetaObject.shoesSize
                              : relationMetaObject.size,

                            sizeType: productCatMeta.sizeType,
                          },
                          sizeManFlag:
                            relationMetaObject.sizeMan &&
                            relationMetaObject.sizeMan == "true"
                              ? true
                              : false,
                          discount:
                            req.body.language === "1"
                              ? discount + "%"
                              : convertToArabic(discount) + "%",
                          discountValue:
                            req.body.language === "1"
                              ? "-" + discountValue
                              : "-" + convertToArabic(discountValue),
                        };
                      }
                    ),
                  },
                };
              })
            : [],
      });
    });
  }
);

router.post(
  "/cancel-order",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (!req.body.orderNo) {
      return res.status(200).json({
        status: false,
        message: "Error enter order",
      });
    }
    Promise.all([
      Order.findOne({
        where: {
          id: req.body.orderNo,
        },
        include: [
          {
            association: "OrderProductRelationships",
            include: [
              {
                association: "Product",
                include: [
                  { association: "Stock" },
                  { association: "Metas" },
                  {
                    association: "Category",
                    include: [{ association: "Parents" }],
                  },
                ],
              },
            ],
          },
        ],
      }),
      models.Branch.findOne({ order: [["id", "DESC"]] }),
    ]).then((firstResults) => {
      let order = firstResults[0];
      let branchData = firstResults[1];
      if (!order) {
        return res.status(200).json({
          status: false,
          message:
            req.body.language === 1 ? "Error no order" : "خطأ لا يوجد طلب ",
        });
      }
      if (order.user_id !== req.user.id) {
        return res.status(200).json({
          status: false,
          message:
            req.body.language === 1
              ? "Error not your order"
              : "خطأ لا تملك هذا الطلب",
        });
      }
      if (
        order.status === "production" ||
        order.status === "charged" ||
        order.status === "pickable" ||
        order.status === "delivered"
      ) {
        return res.status(200).json({
          status: false,
          message:
            req.body.language === 1
              ? "can't update order a this point"
              : "لا يمكن  الغاء الطلب في هذه المرحلة",
        });
      }
      if (order.status === "cancelled") {
        return res.status(200).json({
          status: false,
          message:
            req.body.language === 1
              ? "can't cancel an already cancelled order"
              : "لا يمكن الغاء طلب تم الغاؤه",
        });
      }
      return sequelize
        .transaction((t) => {
          const promises = [];
          order.OrderProductRelationships.map((item) => {
            var relationMetaObject = {};
            var product = item.Product;
            if (item.Metas)
              item.Metas.forEach((meta) => {
                relationMetaObject[meta.property] = meta.value;
              });
            const relationsForProductMainCat = {};

            product.Category &&
            product.Category.Parents[0] &&
            product.Category.Parents[0].Metas
              ? product.Category.Parents[0].Metas.map((meta) => {
                  relationsForProductCat[meta.type] =
                    meta.category_meta_relationship.value;
                })
              : null;
            const maxQuantityMeta = CategoryMeta.findOne({
              where: {
                type: "max_quantity",
              },
            }).then((meta) => {
              return CategoryMetaRelationship.findOne({
                where: {
                  category_id: product.Category.id,
                  category_meta_id: meta.id,
                },
              }).then((categoryMeta) => {
                return categoryMeta;
              });
            });
            const fabricTypeMeta = CategoryMeta.findOne({
              where: {
                type: "fabric_type",
              },
            }).then((meta) => {
              if (meta) {
                return CategoryMetaRelationship.findOne({
                  where: {
                    category_id: product.Category.id,
                    category_meta_id: meta.id,
                  },
                }).then((categoryMeta) => {
                  return categoryMeta;
                });
              }
            });

            const incrementinStock = item.Product.Stock
              ? item.Product.Stock.increment(
                  {
                    value: item.quantity,
                  },
                  { transaction: t }
                )
              : maxQuantityMeta &&
                relationsForProductMainCat &&
                relationsForProductMainCat.stock_type &&
                relationsForProductMainCat.stock_type === "fabric" &&
                item.Profile
              ? maxQuantityMeta.increment(
                  {
                    value: calculateThoob(
                      item.Profile.value_1,
                      item.Profile.value_2,
                      item.Profile.value_3,
                      item.Profile.value_4,
                      item.Profile.value_5,
                      item.Profile.value_6,
                      item.Profile.value_7,
                      item.Profile.value_8,
                      item.Profile.value_9,
                      item.Profile.value_10,
                      item.Profile.value_11,
                      item.Profile.value_12,
                      fabricTypeMeta && fabricTypeMeta.value
                        ? fabricTypeMeta.value
                        : "normal",
                      item.quantity
                    ),
                  },
                  { transaction: t }
                )
              : maxQuantityMeta &&
                relationsForProductMainCat &&
                relationsForProductMainCat.stock_type &&
                relationsForProductMainCat.stock_type === "fabric" &&
                relationMetaObject.size &&
                relationMetaObject.size === "s"
              ? maxQuantityMeta.increment(
                  {
                    value: calculateThoobSmall(
                      fabricTypeMeta && fabricTypeMeta.value
                        ? fabricTypeMeta.value
                        : "normal",
                      item.quantity
                    ),
                  },
                  { transaction: t }
                )
              : maxQuantityMeta &&
                relationsForProductMainCat &&
                relationsForProductMainCat.stock_type &&
                relationsForProductMainCat.stock_type === "fabric" &&
                relationMetaObject.size &&
                relationMetaObject.size === "m"
              ? maxQuantityMeta.increment(
                  {
                    value: calculateThoobMedium(
                      fabricTypeMeta && fabricTypeMeta.value
                        ? fabricTypeMeta.value
                        : "normal",
                      item.quantity
                    ),
                  },
                  { transaction: t }
                )
              : maxQuantityMeta &&
                relationsForProductMainCat &&
                relationsForProductMainCat.stock_type &&
                relationsForProductMainCat.stock_type === "fabric" &&
                relationMetaObject.size &&
                relationMetaObject.size === "l"
              ? maxQuantityMeta.increment({
                  value: calculateThoobLarge(
                    fabricTypeMeta && fabricTypeMeta.value
                      ? fabricTypeMeta.value
                      : "normal",
                    item.quantity
                  ),
                })
              : relationsForProductMainCat &&
                relationsForProductMainCat.stock_type &&
                relationsForProductMainCat.stock_type === "product"
              ? product.Stock.increment(
                  { value: item.quantity },
                  { transaction: t }
                )
              : null;
            promises.push(incrementinStock);
          });

          promises.push(
            order.update(
              { status: "cancelled", cancellation_date: Date.now() },
              { transaction: t }
            )
          );
          promises.push(
            sendMessage(
              [req.user.mobile],
              req.body.language === 1
                ? `Hello!
              Unfortunately, your order ${req.body.orderNo} got canceled. Thank you and see you next time.
              Contact us via WhatsApp: 966594704888
              Thank you.
              `
                : `هلابك !
              خسارة تم إلغاء طلبك رقم ${req.body.orderNo} ، شكراً لك ونشوفك مرة ثانية .
              للتواصل عبر الواتس اب 966594704888
              `,
              "Ithoob",
              "orderStatus"
            )
          );
          promises.push(
            sendMail(
              req.user.email,
              "iThoob Order",
              req.body.language === 1
                ? `Hello ${req.user.name}`
                : `مرحبا ${req.user.name}`,
              req.body.language === 1
                ? `Your order ${req.body.orderNo} has been cancelled`
                : `تم إلغاء طلبك رقم ${req.body.orderNo} `,
              "orderStatus"
            )
          );
          return Promise.all(promises);
        })
        .then(() => {
          res.status(200).json({
            status: true,
            branch: branchData,
          });
        })
        .catch((err) => {
          //console.log(err);
          res.status(200).json({
            status: false,
            message:
              req.body.language === 1
                ? "Error in cancelling order"
                : "خطأ  في الغاء الطلب",
          });
        });
    });
  }
);

router.post(
  "/order-item-edits",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Promise.all([
    OrderProductRelationship.findOne({
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
                var adds_cost = incrementCost("adds");

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
                  adds_custom:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? allCategoryRelations
                          .filter((rel) => {
                            return allOrderCustomizations.filter((idx) => {
                              return (
                                idx.cat_rel_id == rel.id && idx.type == "adds"
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

                  adds_cost:
                    product.Metas.filter((meta) => meta.type === "customized")
                      .length >= 1
                      ? adds_cost
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
                console.log(err);
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
