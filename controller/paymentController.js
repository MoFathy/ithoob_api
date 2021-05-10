const axios = require("axios");

const models = require("../models");

module.exports.sendPaymentURL = (data) => {
  return axios.post("https://api.tap.company/v2/charges",data,{
    headers: {
        authorization: "Bearer sk_live_jqHxSVkXG2IgT5Yhwb4QZuyC",
        "content-type": "application/json",
      },
  });
};

module.exports.requestTabbyPaymentURL = (order, user) => {
  let data = {
    payment: {
      amount: order.total *
      (1 -
        (order.user_discount + order.partner_discount + order.coupon_discount) / 100) +
    parseFloat(
      order.delivery_type == "home"
        ? order.delivery_cost
        : 0
    ) +
    parseFloat(order.size_man),
      currency: "SAR",
      description: "string",
      buyer: {
        phone: "+96650000001",
        email: "successful.payment@tabby.ai",
        name: user.name,
        dob: "2019-08-24"
      },
      order: {
        tax_amount: "0.00",
        shipping_amount: "0.00",
        discount_amount: "0.00",
        updated_at: "2019-10-05T17:45:17+00:00",
        reference_id: order.id.toString(),
      },
      meta: {
        order_id: order.id.toString(),
        customer: user.id.toString()
      }
    },
    lang: "ar",
    merchant_code: "iThoobSA",
    merchant_urls: {
      success: "http://localhost:3000/orders",
      cancel: "http://localhost:3000/orders",
      failure: "http://localhost:3000/orders"
    }
  }
  console.log('====================================');
  console.log('====================================');
  console.log('====================================');
  console.log('====================================');
  console.log(order.total);
  console.log(data);

  console.log(order.total *
    (1 -
      (order.user_discount + order.partner_discount + order.coupon_discount) / 100) +
  parseFloat(
    order.delivery_type == "home"
      ? order.delivery_cost
      : 0
  ) +
  parseFloat(order.size_man));
  console.log('====================================');
  console.log('====================================');
  console.log('====================================');
  console.log('====================================');
  return axios.post("https://api.tabby.ai/api/v2/checkout",data,{
    headers: {
        authorization: "Bearer pk_test_1eee36bd-1107-4ef3-b731-1dc9bb206181",
        "content-type": "application/json",
      },
  });
};
